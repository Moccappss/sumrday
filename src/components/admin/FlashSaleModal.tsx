import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap, X, Clock, ShoppingBag, Check,
  Trash2, Share2, Search, Flame, Sliders,
  Layers, Sparkles, ChevronDown, ChevronUp,
  LayoutGrid, ListFilter, ArrowRightLeft, Tag
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { SocialUpdate, FlashSaleSticker } from '../../types/socialUpdates';
import { notifyFlashSaleUpdated } from '../../utils/flashSaleHelper';

interface FlashSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onSaveProducts: (updatedList: any[]) => Promise<void>;
  selectedProductIds?: string[];
  initialProductId?: string;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface ProductRule {
  discountPercent: number;
  salePrice: number;
  quota: number;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

/* ─────────────── Small sub-components ─────────────── */

const Pill = ({
  label, active, onClick, count
}: { label: string; active: boolean; onClick: () => void; count?: number }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '5px 13px',
      borderRadius: 100,
      border: active ? '1.5px solid #f43f5e' : '1px solid rgba(0,0,0,0.1)',
      background: active ? '#f43f5e' : 'transparent',
      color: active ? '#fff' : 'var(--cms-text, #1e293b)',
      fontSize: 11.5,
      fontWeight: 700,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      transition: 'all 0.15s',
      flexShrink: 0
    }}
  >
    {label}
    {count !== undefined && (
      <span style={{
        padding: '1px 5px',
        borderRadius: 100,
        background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.07)',
        fontSize: 10,
        lineHeight: 1.4
      }}>{count}</span>
    )}
  </button>
);

const SectionCard = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    padding: '14px 16px',
    borderRadius: 16,
    background: 'var(--cms-panel-bg, #f8fafc)',
    border: '1px solid rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    ...style
  }}>
    {children}
  </div>
);

const SectionTitle = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: 'rgba(244,63,94,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--cms-text, #1e293b)' }}>{title}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--cms-text-muted, #64748b)', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted, #64748b)', marginBottom: 4 }}>
    {children}
  </div>
);

const StyledInput = ({
  type = 'text', value, onChange, placeholder, style, min, max, step
}: {
  type?: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; style?: React.CSSProperties; min?: string; max?: string; step?: string;
}) => (
  <input
    type={type}
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={{
      width: '100%',
      padding: '8px 11px',
      borderRadius: 10,
      border: '1.5px solid rgba(244,63,94,0.18)',
      background: 'var(--cms-input-bg, #fff)',
      color: 'var(--cms-text, #1e293b)',
      fontSize: 13,
      fontWeight: 600,
      outline: 'none',
      boxSizing: 'border-box',
      ...style
    }}
  />
);

/* ─────────────── Main Component ─────────────── */

export default function FlashSaleModal({
  isOpen,
  onClose,
  products,
  onSaveProducts,
  selectedProductIds = [],
  initialProductId,
  notify
}: FlashSaleModalProps) {
  // Ref to the entire modal inner div (covers all independently scrollable columns)
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'bulk' | 'custom'>('bulk');

  // ── Scroll lock: block wheel/touch that targets OUTSIDE modal, allow inside columns ──
  useEffect(() => {
    if (!isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      const container = modalContainerRef.current;
      // If event is completely outside the modal container, block it
      if (!container || !container.contains(e.target as Node)) {
        e.preventDefault();
        return;
      }
      // Find the nearest scrollable ancestor of the target within the modal
      let el = e.target as HTMLElement | null;
      while (el && el !== container) {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          const atTop = el.scrollTop <= 0;
          const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 1;
          if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
            e.preventDefault();
          }
          return; // Found scrollable ancestor — let it handle normally
        }
        el = el.parentElement;
      }
      // No scrollable ancestor found inside modal — block
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const container = modalContainerRef.current;
      if (!container || !container.contains(e.target as Node)) e.preventDefault();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ── State ─────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (selectedProductIds?.length) return selectedProductIds;
    if (initialProductId && products.some(p => p.id === initialProductId)) return [initialProductId];
    return products.map(p => p.id);
  });

  useEffect(() => {
    if (!isOpen) return;
    if (selectedProductIds?.length) setSelectedIds(selectedProductIds);
    else if (initialProductId && products.some(p => p.id === initialProductId)) setSelectedIds([initialProductId]);
    else setSelectedIds(products.map(p => p.id));
  }, [isOpen, initialProductId, selectedProductIds]);

  const [globalDiscount, setGlobalDiscount] = useState(30);
  const [globalQuota, setGlobalQuota] = useState(10);
  const [durationHours, setDurationHours] = useState(24);
  const [customEndTime, setCustomEndTime] = useState(() => {
    const d = new Date(); d.setHours(d.getHours() + 24);
    return d.toISOString().slice(0, 16);
  });
  const [useCustomEnd, setUseCustomEnd] = useState(false);
  const [flashTitle, setFlashTitle] = useState('FLASH SALE SPESIAL');
  const [broadcast, setBroadcast] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('Semua');

  const [productRules, setProductRules] = useState<Record<string, ProductRule>>(() => {
    const map: Record<string, ProductRule> = {};
    products.forEach(p => {
      const base = p.price || 0;
      map[p.id] = p.flashSale?.isActive
        ? { discountPercent: p.flashSale.discountPercent || 30, salePrice: p.flashSale.salePrice || Math.round(base * 0.7), quota: p.flashSale.stockLeft || 10 }
        : { discountPercent: 30, salePrice: Math.max(0, Math.round(base * 0.7)), quota: 10 };
    });
    return map;
  });

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean))), [products]);

  const durationPresets = [
    { label: '3 Jam', hours: 3 }, { label: '6 Jam', hours: 6 }, { label: '12 Jam', hours: 12 },
    { label: '1 Hari', hours: 24 }, { label: '2 Hari', hours: 48 }, { label: '3 Hari', hours: 72 }, { label: '7 Hari', hours: 168 }
  ];

  // ── Handlers ─────────────────────────────────────────────────
  const handleSelectDuration = (hrs: number) => {
    setDurationHours(hrs); setUseCustomEnd(false);
    const d = new Date(); d.setHours(d.getHours() + hrs);
    setCustomEndTime(d.toISOString().slice(0, 16));
  };

  const toggleProduct = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSelectAll = () => setSelectedIds(products.map(p => p.id));
  const handleClearAll = () => setSelectedIds([]);

  const handleSelectCategory = (cat: string) => {
    const catIds = products.filter(p => (p.category || 'Umum') === cat).map(p => p.id);
    const allSel = catIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allSel ? prev.filter(id => !catIds.includes(id)) : Array.from(new Set([...prev, ...catIds])));
  };

  const applyBatchDiscount = (pct: number) => {
    setGlobalDiscount(pct);
    setProductRules(prev => {
      const next = { ...prev };
      products.forEach(p => {
        const base = p.price || 0;
        next[p.id] = { ...(next[p.id] || { quota: globalQuota }), discountPercent: pct, salePrice: Math.max(0, Math.round(base * (1 - pct / 100))) };
      });
      return next;
    });
  };

  const applyBatchQuota = (q: number) => {
    const quota = Math.max(1, q);
    setGlobalQuota(quota);
    setProductRules(prev => {
      const next = { ...prev };
      products.forEach(p => { next[p.id] = { ...(next[p.id] || { discountPercent: globalDiscount, salePrice: 0 }), quota }; });
      return next;
    });
  };

  const updateProductDiscount = (id: string, base: number, pct: number) => {
    const p = Math.max(0, Math.min(99, pct));
    setProductRules(prev => ({ ...prev, [id]: { ...(prev[id] || { quota: globalQuota }), discountPercent: p, salePrice: Math.max(0, Math.round(base * (1 - p / 100))) } }));
  };

  const updateProductSalePrice = (id: string, base: number, price: number) => {
    const sp = Math.max(0, price);
    const pct = base > 0 ? Math.round(((base - sp) / base) * 100) : 0;
    setProductRules(prev => ({ ...prev, [id]: { ...(prev[id] || { quota: globalQuota }), discountPercent: pct, salePrice: sp } }));
  };

  const updateProductQuota = (id: string, quota: number) =>
    setProductRules(prev => ({ ...prev, [id]: { ...(prev[id] || { discountPercent: globalDiscount, salePrice: 0 }), quota: Math.max(1, quota) } }));

  const visibleProducts = useMemo(() =>
    products.filter(p => {
      const matchCat = filterCat === 'Semua' || (p.category || 'Umum') === filterCat;
      const q = searchQuery.toLowerCase().trim();
      return matchCat && (!q || (p.name || '').toLowerCase().includes(q));
    }), [products, filterCat, searchQuery]);

  const broadcastToFeed = async (prod: any, salePrice: number, origPrice: number, pct: number, endIso: string, quota: number) => {
    try {
      const existing: SocialUpdate[] = await storage.getItem('porto_social_updates', []);
      const sticker: FlashSaleSticker = { type: 'flash_sale', productId: prod.id, title: flashTitle || 'FLASH SALE', originalPrice: origPrice, salePrice, discountPercent: pct, endTime: endIso, productUrl: `/katalog/p/${prod.id}`, imageUrl: prod.gallery?.[0] || '', stockLeft: quota || undefined };
      const post: SocialUpdate = { id: `update-fs-${Date.now()}`, title: `Flash Sale: ${prod.name}`, category: 'product', content: `Flash Sale! ${prod.name} diskon ${pct}% → ${formatRp(salePrice)} (normal ${formatRp(origPrice)}).`, mediaUrls: prod.gallery?.[0] ? [prod.gallery[0]] : [], mediaType: 'image', projectTag: 'Flash Sale Toko', projectUrl: `/katalog/p/${prod.id}`, ctaLabel: 'Klaim Promo', badge: `DISKON ${pct}%`, price: formatRp(salePrice), customDate: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString(), likesCount: 0, isPinned: true, isPublished: true, sticker };
      const updated = [post, ...existing];
      await storage.setItem('porto_social_updates', updated);
      window.dispatchEvent(new CustomEvent('porto_social_updates_changed', { detail: updated }));
    } catch (err) { console.error('Broadcast error:', err); }
  };

  const handleApply = async () => {
    if (!selectedIds.length) { notify?.('Pilih minimal 1 produk', 'error'); return; }
    setIsProcessing(true);
    try {
      const endDateTime = useCustomEnd ? new Date(customEndTime).toISOString() : new Date(Date.now() + durationHours * 3600000).toISOString();
      const updatedList = products.map(p => {
        if (!selectedIds.includes(p.id)) return p;
        const base = p.price || 0;
        const rule = productRules[p.id] || { discountPercent: globalDiscount, salePrice: Math.max(0, Math.round(base * (1 - globalDiscount / 100))), quota: globalQuota };
        return { ...p, flashSale: { isActive: true, discountPercent: rule.discountPercent, salePrice: rule.salePrice, originalPrice: base, endTime: endDateTime, title: flashTitle, stockLeft: rule.quota } };
      });
      await onSaveProducts(updatedList);
      try {
        const shopSettings = await storage.getItem('porto_shop_settings', {});
        await storage.setItem('porto_shop_settings', { ...shopSettings, flashSale: { isActive: true, title: flashTitle, discountPercent: globalDiscount, endTime: endDateTime, startTime: new Date().toISOString(), stockQuota: globalQuota, productIds: selectedIds } });
        notifyFlashSaleUpdated();
      } catch (e) { console.warn('Sync error:', e); }
      if (broadcast && selectedIds.length > 0) {
        const first = products.find(p => p.id === selectedIds[0]);
        if (first) { const rule = productRules[first.id] || { discountPercent: globalDiscount, salePrice: Math.max(0, Math.round((first.price || 0) * (1 - globalDiscount / 100))), quota: globalQuota }; await broadcastToFeed(first, rule.salePrice, first.price || 0, rule.discountPercent, endDateTime, rule.quota); }
      }
      notify?.(`Flash Sale aktif untuk ${selectedIds.length} produk!`, 'success');
      onClose();
    } catch (err) { console.error(err); notify?.('Gagal mengaktifkan Flash Sale', 'error'); }
    finally { setIsProcessing(false); }
  };

  const handleTurnOff = async () => {
    if (!selectedIds.length) { notify?.('Pilih produk yang ingin dimatikan', 'error'); return; }
    setIsProcessing(true);
    try {
      const updatedList = products.map(p => selectedIds.includes(p.id) ? { ...p, flashSale: { ...p.flashSale, isActive: false } } : p);
      await onSaveProducts(updatedList);
      const shopSettings = await storage.getItem('porto_shop_settings', {});
      const remaining = updatedList.filter(p => p.flashSale?.isActive);
      await storage.setItem('porto_shop_settings', { ...shopSettings, flashSale: { ...shopSettings.flashSale, isActive: remaining.length > 0, productIds: remaining.map(p => p.id) } });
      notifyFlashSaleUpdated();
      notify?.(`Flash Sale dimatikan untuk ${selectedIds.length} produk`, 'info');
      onClose();
    } catch (err) { console.error(err); notify?.('Gagal mematikan Flash Sale', 'error'); }
    finally { setIsProcessing(false); }
  };

  if (!isOpen) return null;

  /* ─── RENDER ──────────────────────────────────────────────────*/
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'none', WebkitBackdropFilter: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, padding: 16,
        overscrollBehavior: 'contain'
      }}
    >
      {/* CSS for scrollable pill rows — can't be done with inline styles alone */}
      <style>{`
        .fs-hscroll {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: visible;
          gap: 6px;
          padding-bottom: 2px;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .fs-hscroll::-webkit-scrollbar { display: none; }
        .fs-hscroll > * { flex-shrink: 0; }
      `}</style>
      {/* Modal Shell */}
      <div ref={modalContainerRef} style={{
        background: 'var(--cms-card-bg, #ffffff)',
        borderRadius: 22,
        width: '100%', maxWidth: 1020,
        height: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(244,63,94,0.1)',
        color: 'var(--cms-text, #1e293b)',
        fontFamily: "'Outfit', sans-serif",
        overflow: 'hidden'
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          background: 'linear-gradient(90deg, rgba(244,63,94,0.06) 0%, transparent 60%)',
          flexShrink: 0
        }}>
          {/* Left: Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #f43f5e, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(244,63,94,0.3)'
            }}>
              <Zap size={20} fill="#fff" color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text, #1e293b)', letterSpacing: '-0.3px' }}>
                  Sistem Flash Sale
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: 100, fontSize: 10.5, fontWeight: 800,
                  background: 'rgba(244,63,94,0.1)', color: '#f43f5e',
                  display: 'inline-flex', alignItems: 'center', gap: 3
                }}>
                  <Flame size={10} fill="#f43f5e" color="#f43f5e" /> PROMO
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted, #64748b)', marginTop: 1 }}>
                Atur diskon flash sale massal atau custom per produk
              </div>
            </div>
          </div>

          {/* Right: Close */}
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)',
            color: 'var(--cms-text, #1e293b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          background: 'var(--cms-panel-bg, #f8fafc)',
          flexShrink: 0, flexWrap: 'wrap', gap: 8
        }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: 100, padding: 3, gap: 2 }}>
            {([
              { key: 'bulk', label: 'Atur Massal', icon: <Layers size={13} /> },
              { key: 'custom', label: 'Custom Per Produk', icon: <Sliders size={13} /> }
            ] as const).map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 16px', borderRadius: 100, border: 'none',
                  background: activeTab === tab.key ? 'linear-gradient(135deg,#f43f5e,#ea580c)' : 'transparent',
                  color: activeTab === tab.key ? '#fff' : 'var(--cms-text, #1e293b)',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  boxShadow: activeTab === tab.key ? '0 2px 8px rgba(244,63,94,0.25)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Selection badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 100,
            background: selectedIds.length ? 'rgba(244,63,94,0.08)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${selectedIds.length ? 'rgba(244,63,94,0.2)' : 'rgba(0,0,0,0.08)'}`,
            fontSize: 11.5, fontWeight: 700,
            color: selectedIds.length ? '#f43f5e' : 'var(--cms-text-muted, #64748b)'
          }}>
            <ShoppingBag size={13} />
            <span>{selectedIds.length} dari {products.length} produk terpilih</span>
          </div>
        </div>

        {/* ── Body: NOT scrollable itself — each column scrolls independently ── */}
        <div style={{
          flex: 1, overflow: 'hidden',
          padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 0,
          minHeight: 0
        }}>

          {/* ══════════ TAB: ATUR MASSAL ══════════ */}
          {activeTab === 'bulk' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)', gap: 16, flex: 1, minHeight: 0, overflow: 'hidden' }}>

              {/* Left: Settings — scrollable independently */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: 4 }}>

                {/* 1. Target produk */}
                <SectionCard>
                  <SectionTitle icon={<Layers size={14} color="#f43f5e" />} title="Pilih Target Produk" sub="Pilih semua atau berdasarkan kategori" />

                  {/* Scope pills — scrollable horizontally */}
                  <div className="fs-hscroll">
                    <Pill
                      label="Semua Produk"
                      active={selectedIds.length === products.length}
                      onClick={handleSelectAll}
                      count={products.length}
                    />
                    {categories.map(cat => {
                      const catProds = products.filter(p => (p.category || 'Umum') === cat);
                      const catSel = catProds.filter(p => selectedIds.includes(p.id)).length;
                      return (
                        <Pill
                          key={cat}
                          label={cat}
                          active={catSel === catProds.length}
                          onClick={() => handleSelectCategory(cat)}
                          count={catSel === catProds.length ? catProds.length : undefined}
                        />
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={handleSelectAll} style={{ fontSize: 11.5, fontWeight: 700, color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Pilih Semua</button>
                    <span style={{ color: 'rgba(0,0,0,0.2)' }}>|</span>
                    <button type="button" onClick={handleClearAll} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text-muted, #64748b)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Batal Pilih</button>
                  </div>
                </SectionCard>

                {/* 2. Diskon massal */}
                <SectionCard>
                  <SectionTitle icon={<Tag size={14} color="#f43f5e" />} title="Diskon Massal" sub="Otomatis hitung harga promo semua produk" />

                  {/* Preset grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                    {[10, 20, 25, 30, 40, 50, 60, 70, 75, 80].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyBatchDiscount(pct)}
                        style={{
                          padding: '7px 0', borderRadius: 10,
                          border: globalDiscount === pct ? '1.5px solid #f43f5e' : '1px solid rgba(0,0,0,0.08)',
                          background: globalDiscount === pct ? '#f43f5e' : 'transparent',
                          color: globalDiscount === pct ? '#fff' : 'var(--cms-text, #1e293b)',
                          fontSize: 12, fontWeight: 800, cursor: 'pointer'
                        }}
                      >{pct}%</button>
                    ))}
                  </div>

                  {/* Slider row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="range" min="5" max="90" step="5"
                      value={globalDiscount}
                      onChange={e => applyBatchDiscount(Number(e.target.value))}
                      style={{ flex: 1, accentColor: '#f43f5e', cursor: 'pointer' }}
                    />
                    <div style={{ padding: '4px 12px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', color: '#f43f5e', fontSize: 15, fontWeight: 900, minWidth: 52, textAlign: 'center' }}>
                      {globalDiscount}%
                    </div>
                  </div>
                </SectionCard>

                {/* 3. Durasi & Kuota Massal (2 col) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* Durasi */}
                  <SectionCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <SectionTitle icon={<Clock size={14} color="#f43f5e" />} title="Durasi Promo" />
                      <button type="button" onClick={() => setUseCustomEnd(!useCustomEnd)}
                        style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {useCustomEnd ? 'Preset' : 'Custom'}
                      </button>
                    </div>
                    {useCustomEnd ? (
                      <StyledInput type="datetime-local" value={customEndTime} onChange={e => setCustomEndTime(e.target.value)} />
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {durationPresets.map(dp => (
                          <Pill key={dp.hours} label={dp.label} active={durationHours === dp.hours} onClick={() => handleSelectDuration(dp.hours)} />
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  {/* Kuota */}
                  <SectionCard>
                    <SectionTitle icon={<ShoppingBag size={14} color="#f43f5e" />} title="Kuota Per Produk" sub="Unit per produk yang bisa dibeli" />
                    <FieldLabel>Jumlah Unit</FieldLabel>
                    <StyledInput type="number" min="1" value={globalQuota} onChange={e => applyBatchQuota(Number(e.target.value))} placeholder="10" />
                  </SectionCard>
                </div>

                {/* 4. Pengaturan Lain */}
                <SectionCard>
                  <SectionTitle icon={<Sparkles size={14} color="#f43f5e" />} title="Pengaturan Tambahan" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <FieldLabel>Judul Banner Flash Sale</FieldLabel>
                      <StyledInput value={flashTitle} onChange={e => setFlashTitle(e.target.value)} placeholder="FLASH SALE SPESIAL" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(244,63,94,0.15)', background: 'rgba(244,63,94,0.03)' }}>
                        <input type="checkbox" checked={broadcast} onChange={e => setBroadcast(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#f43f5e' }} />
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text, #1e293b)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Share2 size={12} color="#f43f5e" /> Siarkan ke Feed Otomatis
                        </span>
                      </label>
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* Right: Product preview — scrollable independently, fills full height */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(234,88,12,0.04))',
                  border: '1px solid rgba(244,63,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--cms-text, #1e293b)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={13} color="#f43f5e" />
                    Preview Produk Flash Sale
                  </span>
                  <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 700 }}>{selectedIds.length} produk</span>
                </div>

                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  minHeight: 0
                }}>
                  {selectedIds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--cms-text-muted, #64748b)' }}>
                      <ShoppingBag size={32} color="#cbd5e1" style={{ marginBottom: 10 }} />
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Belum ada produk dipilih</div>
                      <div style={{ fontSize: 11.5, marginTop: 4 }}>Pilih target produk di sebelah kiri</div>
                      <button type="button" onClick={handleSelectAll} style={{ marginTop: 12, padding: '7px 16px', borderRadius: 100, border: 'none', background: '#f43f5e', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                        Pilih Semua
                      </button>
                    </div>
                  ) : (
                    products.filter(p => selectedIds.includes(p.id)).map(p => {
                      const base = p.price || 0;
                      const rule = productRules[p.id] || { discountPercent: globalDiscount, salePrice: Math.max(0, Math.round(base * (1 - globalDiscount / 100))), quota: globalQuota };
                      const savings = base - rule.salePrice;
                      return (
                        <div key={p.id} style={{
                          padding: '10px 12px', borderRadius: 12,
                          background: 'var(--cms-card-bg, #fff)',
                          border: '1px solid rgba(244,63,94,0.15)',
                          display: 'flex', alignItems: 'center', gap: 10
                        }}>
                          {/* Uncheck btn */}
                          <div onClick={() => toggleProduct(p.id)} style={{ width: 18, height: 18, borderRadius: 6, background: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <Check size={11} color="#fff" strokeWidth={3} />
                          </div>
                          {/* Thumbnail */}
                          <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', background: '#e2e8f0', flexShrink: 0 }}>
                            {p.gallery?.[0] ? <img src={p.gallery[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={14} color="#94a3b8" /></div>}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                              <span style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>{formatRp(base)}</span>
                              <span style={{ fontSize: 11, color: '#f43f5e', fontWeight: 800 }}>{formatRp(rule.salePrice)}</span>
                            </div>
                          </div>
                          {/* Discount badge */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ padding: '2px 6px', borderRadius: 6, background: '#f43f5e', color: '#fff', fontSize: 10.5, fontWeight: 900 }}>-{rule.discountPercent}%</div>
                            <div style={{ fontSize: 9.5, color: '#10b981', fontWeight: 700, marginTop: 2 }}>hemat {formatRp(savings)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB: CUSTOM PER PRODUK ══════════ */}
          {activeTab === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 16, flex: 1, minHeight: 0, overflow: 'hidden' }}>

              {/* Left: Product List — scrollable independently */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, overflowY: 'auto', overscrollBehavior: 'contain', paddingRight: 4 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <SectionTitle icon={<ListFilter size={14} color="#f43f5e" />} title="Pilih & Atur Tiap Produk" sub="Centang produk lalu ubah diskon / harga / kuota masing-masing" />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={handleSelectAll} style={{ fontSize: 11.5, fontWeight: 700, color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' }}>Pilih Semua</button>
                    <button type="button" onClick={handleClearAll} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cms-text-muted, #64748b)', background: 'none', border: 'none', cursor: 'pointer' }}>Batal</button>
                  </div>
                </div>

                {/* Search & Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text" placeholder="Cari produk..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'var(--cms-input-bg, #f8fafc)', color: 'var(--cms-text, #1e293b)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  {/* Category filter pills — scrollable horizontally */}
                  <div className="fs-hscroll" style={{ gap: 5 }}>
                    {['Semua', ...categories].map(cat => (
                      <Pill key={cat} label={cat} active={filterCat === cat} onClick={() => setFilterCat(cat)}
                        count={cat === 'Semua' ? products.length : products.filter(p => (p.category || 'Umum') === cat).length}
                      />
                    ))}
                  </div>
                </div>

                {/* Product Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                  {visibleProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--cms-text-muted, #64748b)', fontSize: 12.5 }}>
                      Tidak ada produk cocok
                    </div>
                  ) : (
                    visibleProducts.map(p => {
                      const isChecked = selectedIds.includes(p.id);
                      const base = p.price || 0;
                      const rule = productRules[p.id] || { discountPercent: globalDiscount, salePrice: Math.max(0, Math.round(base * (1 - globalDiscount / 100))), quota: globalQuota };

                      return (
                        <div key={p.id} style={{
                          borderRadius: 14,
                          background: isChecked ? 'rgba(244,63,94,0.04)' : 'rgba(0,0,0,0.02)',
                          border: isChecked ? '1.5px solid rgba(244,63,94,0.3)' : '1px solid rgba(0,0,0,0.07)',
                          transition: 'all 0.15s', overflow: 'hidden'
                        }}>
                          {/* Top row */}
                          <div onClick={() => toggleProduct(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer' }}>
                            {/* Checkbox */}
                            <div style={{ width: 20, height: 20, borderRadius: 6, border: isChecked ? 'none' : '1.5px solid #cbd5e1', background: isChecked ? '#f43f5e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                              {isChecked && <Check size={13} color="#fff" strokeWidth={3} />}
                            </div>
                            {/* Image */}
                            <div style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', background: '#e2e8f0', flexShrink: 0 }}>
                              {p.gallery?.[0] ? <img src={p.gallery[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={14} color="#94a3b8" /></div>}
                            </div>
                            {/* Name & price */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: isChecked ? 800 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--cms-text-muted, #64748b)', marginTop: 1 }}>
                                {formatRp(base)}
                                {isChecked && <span style={{ color: '#f43f5e', fontWeight: 800, marginLeft: 6 }}>→ {formatRp(rule.salePrice)} (-{rule.discountPercent}%)</span>}
                              </div>
                            </div>
                            {p.flashSale?.isActive && (
                              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(244,63,94,0.12)', color: '#f43f5e', fontWeight: 800, flexShrink: 0 }}>Aktif</span>
                            )}
                          </div>

                          {/* Expanded custom controls */}
                          {isChecked && (
                            <div style={{ padding: '0 12px 12px', borderTop: '1px dashed rgba(244,63,94,0.18)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', gap: 8, paddingTop: 10 }}>
                                <div>
                                  <FieldLabel>Diskon (%)</FieldLabel>
                                  <input type="number" min="0" max="99" value={rule.discountPercent}
                                    onChange={e => updateProductDiscount(p.id, base, Number(e.target.value))}
                                    style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1.5px solid rgba(244,63,94,0.2)', background: 'var(--cms-input-bg, #fff)', color: '#f43f5e', fontSize: 13, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                                  />
                                </div>
                                <div>
                                  <FieldLabel>Harga Promo (Rp)</FieldLabel>
                                  <input type="number" min="0" value={rule.salePrice}
                                    onChange={e => updateProductSalePrice(p.id, base, Number(e.target.value))}
                                    style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1.5px solid rgba(244,63,94,0.2)', background: 'var(--cms-input-bg, #fff)', color: 'var(--cms-text, #1e293b)', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                  />
                                </div>
                                <div>
                                  <FieldLabel>Kuota</FieldLabel>
                                  <input type="number" min="1" value={rule.quota}
                                    onChange={e => updateProductQuota(p.id, Number(e.target.value))}
                                    style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1.5px solid rgba(244,63,94,0.2)', background: 'var(--cms-input-bg, #fff)', color: 'var(--cms-text, #1e293b)', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: Settings — scrollable independently, stays filled */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflowY: 'auto', overscrollBehavior: 'contain', paddingLeft: 4 }}>

                {/* Batch apply */}
                <SectionCard>
                  <SectionTitle icon={<ArrowRightLeft size={14} color="#f43f5e" />} title="Terapkan Diskon Serentak" sub="Ubah semua produk, lalu kustom satuan" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                    {[10, 20, 30, 40, 50, 60, 70, 80].map(pct => (
                      <button key={pct} type="button" onClick={() => applyBatchDiscount(pct)} style={{ padding: '7px 0', borderRadius: 10, border: globalDiscount === pct ? '1.5px solid #f43f5e' : '1px solid rgba(0,0,0,0.08)', background: globalDiscount === pct ? '#f43f5e' : 'transparent', color: globalDiscount === pct ? '#fff' : 'var(--cms-text, #1e293b)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>{pct}%</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="range" min="5" max="90" step="5" value={globalDiscount} onChange={e => applyBatchDiscount(Number(e.target.value))} style={{ flex: 1, accentColor: '#f43f5e', cursor: 'pointer' }} />
                    <div style={{ padding: '4px 12px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', color: '#f43f5e', fontSize: 15, fontWeight: 900, minWidth: 52, textAlign: 'center' }}>{globalDiscount}%</div>
                  </div>
                </SectionCard>

                {/* Durasi */}
                <SectionCard>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <SectionTitle icon={<Clock size={14} color="#f43f5e" />} title="Durasi & Batas Waktu" />
                    <button type="button" onClick={() => setUseCustomEnd(!useCustomEnd)} style={{ fontSize: 11, fontWeight: 700, color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' }}>{useCustomEnd ? 'Preset' : 'Custom Jam'}</button>
                  </div>
                  {useCustomEnd ? (
                    <StyledInput type="datetime-local" value={customEndTime} onChange={e => setCustomEndTime(e.target.value)} />
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {durationPresets.map(dp => (
                        <Pill key={dp.hours} label={dp.label} active={durationHours === dp.hours} onClick={() => handleSelectDuration(dp.hours)} />
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* Title & Kuota */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <FieldLabel>Judul Banner Flash Sale</FieldLabel>
                    <StyledInput value={flashTitle} onChange={e => setFlashTitle(e.target.value)} placeholder="FLASH SALE" />
                  </div>
                  <div>
                    <FieldLabel>Kuota Default (Unit)</FieldLabel>
                    <StyledInput type="number" min="1" value={globalQuota} onChange={e => applyBatchQuota(Number(e.target.value))} />
                  </div>
                </div>

                {/* Broadcast */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(244,63,94,0.15)', background: 'rgba(244,63,94,0.03)' }}>
                  <input type="checkbox" checked={broadcast} onChange={e => setBroadcast(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#f43f5e' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text, #1e293b)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Share2 size={13} color="#f43f5e" /> Siarkan ke Feed Beranda Otomatis
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--cms-panel-bg, #f8fafc)',
          flexShrink: 0
        }}>
          {/* Matikan */}
          <button
            type="button" onClick={handleTurnOff}
            disabled={isProcessing || !selectedIds.length}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 100,
              border: '1px solid rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.05)',
              color: '#ef4444', fontSize: 12, fontWeight: 800,
              cursor: (isProcessing || !selectedIds.length) ? 'not-allowed' : 'pointer',
              opacity: (isProcessing || !selectedIds.length) ? 0.55 : 1
            }}
          >
            <Trash2 size={13} /> Matikan Promo
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: 'var(--cms-text-muted, #64748b)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              Batal
            </button>
            <button
              type="button" onClick={handleApply}
              disabled={isProcessing || !selectedIds.length}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 24px', borderRadius: 100, border: 'none',
                background: 'linear-gradient(135deg, #f43f5e, #ea580c)',
                color: '#fff', fontSize: 13, fontWeight: 900,
                cursor: (isProcessing || !selectedIds.length) ? 'not-allowed' : 'pointer',
                opacity: (isProcessing || !selectedIds.length) ? 0.6 : 1,
                boxShadow: '0 4px 16px rgba(244,63,94,0.3)'
              }}
            >
              <Zap size={14} fill="#fff" color="#fff" />
              {isProcessing ? 'Menyimpan...' : `Aktifkan Flash Sale (${selectedIds.length} Produk)`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
