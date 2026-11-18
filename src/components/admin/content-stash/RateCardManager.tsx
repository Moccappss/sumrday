import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Receipt, Plus, Check, Trash2, Edit3, Eye, EyeOff, ChevronUp, Copy, ExternalLink, 
  Sparkles, CheckCircle2, Clock, RotateCcw, Share2, Tag, ArrowRight, ArrowLeft,
  MessageCircle, X, ChevronDown, LayoutGrid, Table, ShoppingBag, 
  ArrowUpRight, Link2, DollarSign, TrendingUp, Award, Zap, BarChart3, Palette,
  Upload, Download, FileSpreadsheet, Cloud
} from 'lucide-react';
import { storage } from '../../../utils/storage';
import { 
  type RateCardPackage, 
  DEFAULT_RATE_CARDS, 
  type AddonItem, 
  DEFAULT_ADDONS,
  DEFAULT_RATECARD_CATEGORIES,
  DEFAULT_RATECARD_BADGES,
  DEFAULT_CATEGORY_COLORS
} from './stashTypes';

export interface DeliverableRow {
  id: string;
  qty: string;
  unit: string;
  text: string;
}

export const parseDeliverableString = (raw: string, idx: number): DeliverableRow => {
  const trimmed = raw.trim();
  // 1) leading number + optional unit + separator + text
  const m1 = trimmed.match(/^(\d+)\s*(x|konsep|halaman|revisi|item|varian|hari|opsi|lembar)?\s*[-–•:]?\s*(.+)$/i);
  if (m1) {
    return {
      id: `deliv-${idx}-${Date.now()}`,
      qty: m1[1] || '',
      unit: m1[2] || '',
      text: m1[3] || ''
    };
  }
  // 2) text (3 Konsep) or text (3x)
  const m2 = trimmed.match(/^(.+?)\s*\((?:(\d+)\s*(.*?))\)$/i);
  if (m2) {
    return {
      id: `deliv-${idx}-${Date.now()}`,
      text: m2[1].trim(),
      qty: m2[2] || '',
      unit: m2[3] || ''
    };
  }
  return {
    id: `deliv-${idx}-${Date.now()}`,
    text: trimmed,
    qty: '',
    unit: ''
  };
};

export const formatDeliverableRow = (row: DeliverableRow): string => {
  const qty = row.qty?.trim();
  const unit = row.unit?.trim();
  const text = row.text?.trim() || '';
  if (!text) return '';

  if (qty && unit) {
    if (unit.toLowerCase() === 'x') {
      return `${qty}x ${text}`;
    }
    return `${qty} ${unit} ${text}`;
  } else if (qty) {
    return `${qty}x ${text}`;
  } else if (unit) {
    return `${text} (${unit})`;
  }
  return text;
};

const BILLING_OPTIONS = [
  { value: 'per proyek', label: 'Per Proyek' },
  { value: 'sekali', label: 'Sekali Bayar' },
  { value: 'per bulan', label: 'Per Bulan' },
  { value: 'mulai dari', label: 'Mulai Dari' },
  { value: 'per jam', label: 'Per Jam' },
  { value: 'per hari', label: 'Per Hari' }
];

// ── CUSTOM ROUNDED DROPDOWN (Replaces native square select) ──
interface RoundedSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}

const RoundedSelect: React.FC<RoundedSelectProps> = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find(o => o.value === value) || options[0];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'block' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: 14,
          border: '1.5px solid var(--cms-border, rgba(255,255,255,0.12))',
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
          color: 'var(--cms-text, currentColor)',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease'
        }}
      >
        <span>{current?.label}</span>
        <ChevronDown size={15} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          zIndex: 999999,
          background: 'var(--cms-card-bg, #1e293b)',
          border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))',
          borderRadius: 16,
          padding: 6,
          boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: opt.value === value ? 800 : 600,
                color: opt.value === value ? '#10b981' : 'var(--cms-text, currentColor)',
                background: opt.value === value ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => {
                if (opt.value !== value) e.currentTarget.style.background = 'var(--cms-switcher-bg, rgba(255,255,255,0.06))';
              }}
              onMouseOut={e => {
                if (opt.value !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={14} color="#10b981" strokeWidth={3} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── CUSTOM ROUNDED MANAGEABLE DROPDOWN (Support Add, Delete, Category Color) ──
interface ManageableSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  onAddOption: (val: string) => void;
  onDeleteOption: (val: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
  badgePreviewColor?: string;
  colorMap?: Record<string, string>;
  onColorChange?: (cat: string, color: string) => void;
}

const ManageableSelect: React.FC<ManageableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  onAddOption,
  onDeleteOption,
  placeholder = 'Pilih salah satu...',
  allowClear = false,
  clearLabel = '(Tanpa Badge)',
  badgePreviewColor,
  colorMap,
  onColorChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowAddInput(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (!options.includes(trimmed)) {
      onAddOption(trimmed);
    }
    onChange(trimmed);
    setNewItem('');
    setShowAddInput(false);
  };

  const currentColor = badgePreviewColor || (colorMap && value ? colorMap[value] : undefined);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)' }}>
            {label}
          </label>
          {colorMap && value && (
            <span style={{ fontSize: 11, fontWeight: 700, color: currentColor || 'var(--cms-text-muted)' }}>
              ● {value}
            </span>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          height: 42,
          padding: '0 14px',
          borderRadius: 14,
          border: '1.5px solid var(--cms-border, rgba(255,255,255,0.12))',
          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
          color: 'var(--cms-text, currentColor)',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          {currentColor && (
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: currentColor,
              flexShrink: 0,
              boxShadow: `0 0 6px ${currentColor}`
            }} />
          )}
          <span style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: value ? 'var(--cms-text)' : 'var(--cms-text-muted)'
          }}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown size={15} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.7, flexShrink: 0 }} />
      </button>

      {/* Dropdown Menu (No Dim, No Blur, Soft Floating Shadow) */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          zIndex: 999999,
          background: 'var(--cms-card-bg, #1e293b)',
          border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))',
          borderRadius: 16,
          padding: 8,
          boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxHeight: 270,
          overflowY: 'auto'
        }}>
          {allowClear && (
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 600,
                color: !value ? '#10b981' : 'var(--cms-text-muted)',
                background: !value ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span>{clearLabel}</span>
              {!value && <Check size={14} color="#10b981" strokeWidth={3} />}
            </div>
          )}

          {options.map((opt) => {
            const isSelected = opt === value;
            const optColor = colorMap?.[opt];
            return (
              <div
                key={opt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 10,
                  background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  padding: '2px 4px',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--cms-switcher-bg, rgba(255,255,255,0.06))';
                }}
                onMouseOut={e => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Select area */}
                <div
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 8px',
                    fontSize: 13,
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? '#10b981' : 'var(--cms-text)',
                    cursor: 'pointer'
                  }}
                >
                  {optColor && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: optColor, flexShrink: 0 }} />
                  )}
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isSelected && <Check size={14} color="#10b981" strokeWidth={3} />}
                </div>

                {/* Optional Category Color Picker */}
                {colorMap && onColorChange && (
                  <label
                    title={`Ubah warna untuk kategori ${opt}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      marginRight: 4,
                      position: 'relative'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <span style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: optColor || '#6366f1',
                      border: '1px solid rgba(255,255,255,0.3)',
                      display: 'inline-block'
                    }} />
                    <input
                      type="color"
                      value={optColor || '#6366f1'}
                      onChange={e => onColorChange(opt, e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                    />
                  </label>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteOption(opt);
                  }}
                  title={`Hapus "${opt}" dari daftar`}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: 0.7,
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.color = 'var(--cms-text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}

          {/* Add Option Row */}
          <div style={{ borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))', paddingTop: 6, marginTop: 2 }}>
            {!showAddInput ? (
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: '1px dashed var(--cms-border, rgba(255,255,255,0.15))',
                  background: 'transparent',
                  color: 'var(--cms-accent, #10b981)',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} />
                <span>Tambah Opsi Baru</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Nama baru..."
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd();
                    } else if (e.key === 'Escape') {
                      setShowAddInput(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--cms-border)',
                    background: 'var(--cms-switcher-bg)',
                    color: 'var(--cms-text)',
                    fontSize: 12,
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  Tambah
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddInput(false)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--cms-text-muted)',
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface RateCardManagerProps {
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  confirm?: (opts: { title?: string; message: string; onConfirm: () => void; isDestructive?: boolean }) => void;
  isDarkMode?: boolean;
  onBack?: () => void;
}

export const RateCardManager: React.FC<RateCardManagerProps> = ({
  notify,
  confirm,
  isDarkMode = true,
  onBack
}) => {
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [viewMode, setViewMode] = useState<'admin' | 'client'>('admin');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [studioPhone, setStudioPhone] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [syncedIds, setSyncedIds] = useState<Record<string, boolean>>({});
  const [syncedAddonIds, setSyncedAddonIds] = useState<Record<string, boolean>>({});

  // Sub-Tab Switcher: 'packages' | 'addons'
  const [activeTab, setActiveTab] = useState<'packages' | 'addons'>('packages');

  // Manageable Categories & Badges state
  const [categories, setCategories] = useState<string[]>(DEFAULT_RATECARD_CATEGORIES);
  const [badges, setBadges] = useState<string[]>(DEFAULT_RATECARD_BADGES);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(DEFAULT_CATEGORY_COLORS);

  // Add-ons state
  const [addons, setAddons] = useState<AddonItem[]>(DEFAULT_ADDONS);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonItem | null>(null);
  const [addonDraft, setAddonDraft] = useState<Partial<AddonItem>>({
    name: '',
    desc: '',
    category: 'Layanan',
    priceIdr: 150000,
    priceUsd: 10,
    priceSgd: 15
  });

  // Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit / Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<RateCardPackage | null>(null);
  const [deliverableRows, setDeliverableRows] = useState<DeliverableRow[]>([
    { id: '1', qty: '2', unit: 'Konsep', text: 'Desain Konsep Awal' },
    { id: '2', qty: '3', unit: 'x Revisi', text: 'Revisi Minor' },
    { id: '3', qty: '1', unit: 'Paket', text: 'File Master Lengkap (.AI, .SVG, .PNG)' }
  ]);
  const [catalogPublishedIds, setCatalogPublishedIds] = useState<Record<string, boolean>>({});
  const [catalogAddonPublishedIds, setCatalogAddonPublishedIds] = useState<Record<string, boolean>>({});
  const [isCatalogPublishedDraft, setIsCatalogPublishedDraft] = useState(false);
  const [autoSyncCatalog, setAutoSyncCatalog] = useState(true);
  const [showBadgeColorPopup, setShowBadgeColorPopup] = useState(false);
  const [pkgDraft, setPkgDraft] = useState<Partial<RateCardPackage>>({
    title: '',
    category: 'Branding',
    badge: '',
    badgeColor: '#6366f1',
    categoryColor: '#6366f1',
    price: 1500000,
    originalPrice: undefined,
    billingPeriod: 'per proyek',
    description: '',
    durationDays: 5,
    revisionLimit: '3x Revisi',
    isPopular: false,
    isActive: false
  });

  // Load packages, studio phone, and catalog sync status
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          savedPkgs, 
          profile, 
          catalogProducts, 
          savedAddons, 
          savedCats, 
          savedBadges, 
          savedCatColors
        ] = await Promise.all([
          storage.getItem('porto_rate_cards', null),
          storage.getItem('porto_business_profile', {}),
          storage.getItem('porto_catalog_products', []),
          storage.getItem('porto_rate_card_addons', null),
          storage.getItem('porto_ratecard_categories', null),
          storage.getItem('porto_ratecard_badges', null),
          storage.getItem('porto_ratecard_category_colors', null)
        ]);

        if (Array.isArray(savedPkgs) && savedPkgs.length > 0) {
          setPackages(savedPkgs);
        } else {
          setPackages(DEFAULT_RATE_CARDS);
          await storage.setItem('porto_rate_cards', DEFAULT_RATE_CARDS);
        }

        if (Array.isArray(savedCats) && savedCats.length > 0) {
          setCategories(savedCats);
        } else {
          setCategories(DEFAULT_RATECARD_CATEGORIES);
        }

        if (Array.isArray(savedBadges) && savedBadges.length > 0) {
          setBadges(savedBadges);
        } else {
          setBadges(DEFAULT_RATECARD_BADGES);
        }

        if (savedCatColors && typeof savedCatColors === 'object') {
          setCategoryColors({ ...DEFAULT_CATEGORY_COLORS, ...savedCatColors });
        } else {
          setCategoryColors(DEFAULT_CATEGORY_COLORS);
        }

        const loadedAddons = Array.isArray(savedAddons) && savedAddons.length > 0 ? savedAddons : DEFAULT_ADDONS;
        setAddons(loadedAddons);

        const phone = profile?.phone || profile?.whatsapp || '';
        setStudioPhone(phone);

        // Check which packages & addons are synced to catalog and their publish status
        if (Array.isArray(catalogProducts)) {
          const syncMap: Record<string, boolean> = {};
          const syncAddonMap: Record<string, boolean> = {};
          const catalogPubMap: Record<string, boolean> = {};
          const catalogAddonPubMap: Record<string, boolean> = {};

          catalogProducts.forEach((p: any) => {
            if (p.rateCardId) {
              syncMap[p.rateCardId] = true;
              catalogPubMap[p.rateCardId] = p.isPublished !== false;
            }
            if (p.rateCardAddonId) {
              syncAddonMap[p.rateCardAddonId] = true;
              catalogAddonPubMap[p.rateCardAddonId] = p.isPublished !== false;
            }
          });
          setSyncedIds(syncMap);
          setSyncedAddonIds(syncAddonMap);
          setCatalogPublishedIds(catalogPubMap);
          setCatalogAddonPublishedIds(catalogAddonPubMap);

          // Auto-sync existing addons so they connect to catalog & transactions immediately
          for (const addon of loadedAddons) {
            if (!syncAddonMap[addon.id]) {
              syncAddonToCatalog(addon, true);
            }
          }

          // Auto-sync existing packages to catalog & transactions (default draft)
          const pkgsToSync = Array.isArray(savedPkgs) && savedPkgs.length > 0 ? savedPkgs : DEFAULT_RATE_CARDS;
          for (const pkg of pkgsToSync) {
            if (!syncMap[pkg.id]) {
              syncToCatalog(pkg, true, false);
            }
          }
        }
      } catch (err) {
        setPackages(DEFAULT_RATE_CARDS);
      }
    };
    loadData();

    // Listen to real-time updates from Catalog or other tabs
    const handleRemoteRateCardsUpdate = async () => {
      try {
        const fresh = await storage.getItem('porto_rate_cards', null);
        if (Array.isArray(fresh) && fresh.length > 0) {
          setPackages(fresh);
        }
      } catch (e) {}
    };
    window.addEventListener('porto_ratecards_updated', handleRemoteRateCardsUpdate);

    return () => {
      window.removeEventListener('porto_ratecards_updated', handleRemoteRateCardsUpdate);
    };
  }, []);

  const savePackages = async (updated: RateCardPackage[]) => {
    setPackages(updated);
    await storage.setItem('porto_rate_cards', updated);
    window.dispatchEvent(new CustomEvent('porto_ratecards_updated'));
  };

  const saveAddons = async (updated: AddonItem[]) => {
    setAddons(updated);
    await storage.setItem('porto_rate_card_addons', updated);
    window.dispatchEvent(new CustomEvent('porto_ratecard_addons_updated', { detail: updated }));
  };

  const handleOpenAddonModal = (addon?: AddonItem) => {
    if (addon) {
      setEditingAddon(addon);
      setAddonDraft({ ...addon });
    } else {
      setEditingAddon(null);
      setAddonDraft({
        name: '',
        desc: '',
        category: 'Layanan',
        priceIdr: 250000,
        priceUsd: 15,
        priceSgd: 20
      });
    }
    setShowAddonModal(true);
  };

  const handleSaveAddon = async () => {
    if (!addonDraft.name?.trim()) {
      notify?.('Nama add-on wajib diisi!', 'error');
      return;
    }
    const finalAddon: AddonItem = {
      id: editingAddon?.id || `addon-${Date.now()}`,
      name: addonDraft.name.trim(),
      desc: addonDraft.desc?.trim() || '',
      category: addonDraft.category?.trim() || 'Umum',
      priceIdr: Number(addonDraft.priceIdr) || 0,
      priceUsd: Number(addonDraft.priceUsd) || 0,
      priceSgd: Number(addonDraft.priceSgd) || 0,
      isSyncedCatalog: true
    };

    let updated: AddonItem[];
    if (editingAddon) {
      updated = addons.map(a => a.id === editingAddon.id ? finalAddon : a);
      notify?.('Add-on berhasil diperbarui!', 'success');
    } else {
      updated = [...addons, finalAddon];
      notify?.('Add-on baru berhasil ditambahkan!', 'success');
    }
    await saveAddons(updated);
    
    // Auto-sync into porto_catalog_products and transactions!
    await syncAddonToCatalog(finalAddon, true);

    setShowAddonModal(false);
    setEditingAddon(null);
  };

  const handleDeleteAddon = async (id: string, name: string) => {
    const doDelete = async () => {
      const updated = addons.filter(a => a.id !== id);
      await saveAddons(updated);
      
      // Also clean up from porto_catalog_products
      try {
        const existingProducts = await storage.getItem('porto_catalog_products', []);
        if (Array.isArray(existingProducts)) {
          const filtered = existingProducts.filter((p: any) => p.rateCardAddonId !== id && p.id !== `addon_${id}`);
          await storage.setItem('porto_catalog_products', filtered);
          await storage.setItem('porto_catalog', filtered);
          window.dispatchEvent(new CustomEvent('porto_catalog_updated', { detail: filtered }));
        }
      } catch (e) {}

      notify?.(`Add-on "${name}" berhasil dihapus.`, 'info');
    };
    if (confirm) {
      confirm({
        title: 'Hapus Add-on?',
        message: `Apakah Anda yakin ingin menghapus add-on "${name}"?`,
        isDestructive: true,
        onConfirm: doDelete
      });
    } else if (window.confirm(`Hapus add-on "${name}"?`)) {
      doDelete();
    }
  };

  const handleResetAddons = async () => {
    const doReset = async () => {
      await saveAddons(DEFAULT_ADDONS);
      for (const addon of DEFAULT_ADDONS) {
        await syncAddonToCatalog(addon, true);
      }
      notify?.('Add-on berhasil di-reset ke template default studio dan terhubung ke katalog!', 'success');
    };
    if (confirm) {
      confirm({
        title: 'Reset Template Add-on?',
        message: 'Kembalikan seluruh daftar add-on ke template bawaan studio?',
        isDestructive: true,
        onConfirm: doReset
      });
    } else if (window.confirm('Reset template add-on ke bawaan?')) {
      doReset();
    }
  };

  // ── Sync Addon to Catalog & Transactions ──
  const syncAddonToCatalog = async (addon: AddonItem, silent = false) => {
    try {
      const existingProducts = await storage.getItem('porto_catalog_products', []);
      const list = Array.isArray(existingProducts) ? [...existingProducts] : [];
      const code = `ADD-${addon.id.replace(/\D/g, '').slice(-4) || 'ON'}`;
      const idx = list.findIndex((p: any) => p.rateCardAddonId === addon.id || p.id === `addon_${addon.id}`);
      
      const catalogItem = {
        id: idx >= 0 ? list[idx].id : `addon_${addon.id}`,
        productCode: code,
        sku: code,
        name: addon.name,
        category: addon.category ? `Add-on (${addon.category})` : 'Add-on Layanan',
        type: 'Add-on',
        price: addon.priceIdr,
        originalPrice: addon.priceIdr,
        stock: 999,
        description: addon.desc || 'Fitur dan layanan tambahan studio.',
        isPublished: true,
        rateCardAddonId: addon.id,
        isAddon: true
      };

      if (idx >= 0) {
        list[idx] = { ...list[idx], ...catalogItem };
      } else {
        list.unshift(catalogItem);
      }

      await storage.setItem('porto_catalog_products', list);
      await storage.setItem('porto_catalog', list);
      window.dispatchEvent(new CustomEvent('porto_catalog_updated', { detail: list }));

      setSyncedAddonIds(prev => ({ ...prev, [addon.id]: true }));
      if (!silent) {
        notify?.(`✓ Add-on "${addon.name}" terhubung ke Katalog Toko & Transaksi!`, 'success');
      }
    } catch (err) {
      console.error('Failed to sync addon to catalog:', err);
    }
  };

  // ── Create Draft Transaction for Addon ──
  const handleCreateAddonTransaction = async (addon: AddonItem) => {
    try {
      await syncAddonToCatalog(addon, true);

      const existingTrx = await storage.getItem('porto_transactions', []);
      const trxList = Array.isArray(existingTrx) ? [...existingTrx] : [];
      const now = new Date();
      const invoiceNo = `INV-ADD-${Date.now().toString().slice(-6)}`;

      const newTrx = {
        id: `trx-${Date.now()}`,
        invoiceNumber: invoiceNo,
        date: now.toISOString().split('T')[0],
        customerName: 'Klien Add-on Studio',
        customerPhone: '',
        customerEmail: '',
        items: [
          {
            id: `addon_${addon.id}`,
            name: addon.name,
            qty: 1,
            price: addon.priceIdr,
            category: `Add-on (${addon.category})`,
            type: 'Add-on'
          }
        ],
        subtotal: addon.priceIdr,
        tax: 0,
        discount: 0,
        total: addon.priceIdr,
        paymentStatus: 'pending',
        paymentMethod: 'Transfer Bank',
        notes: `Add-on Layanan: ${addon.name} (${addon.category})`,
        createdAt: now.toISOString()
      };

      trxList.unshift(newTrx);
      await storage.setItem('porto_transactions', trxList);
      window.dispatchEvent(new CustomEvent('porto_transactions_updated', { detail: trxList }));
      
      notify?.(`✓ Invoice #${invoiceNo} berhasil dibuat untuk Add-on "${addon.name}"!`, 'success');
      
      if (confirm) {
        confirm({
          title: 'Transaksi Berhasil Dibuat!',
          message: `Draft invoice #${invoiceNo} telah masuk ke data transaksi. Apakah ingin membuka halaman Transaksi sekarang?`,
          onConfirm: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/admin/transactions';
            }
          }
        });
      }
    } catch (err: any) {
      notify?.('Gagal membuat transaksi: ' + err.message, 'error');
    }
  };

  // ── Sync All Addons to Catalog & Transactions Shortcut ──
  const handleSyncAllAddonsToCatalog = async () => {
    try {
      for (const addon of addons) {
        await syncAddonToCatalog(addon, true);
      }
      notify?.(`✓ Semua (${addons.length}) Add-on berhasil disinkronkan ke Katalog Toko & Transaksi!`, 'success');
    } catch (err: any) {
      notify?.('Gagal sinkronisasi add-on: ' + err.message, 'error');
    }
  };

  // ── Category & Badge Management ──
  const handleAddCategory = async (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updated = [...categories, trimmed];
    setCategories(updated);
    await storage.setItem('porto_ratecard_categories', updated);
    if (!categoryColors[trimmed]) {
      const palette = ['#6366f1', '#10b981', '#ec4899', '#f59e0b', '#0284c7', '#8b5cf6', '#f43f5e', '#06b6d4'];
      const assigned = palette[updated.length % palette.length];
      const updatedColors = { ...categoryColors, [trimmed]: assigned };
      setCategoryColors(updatedColors);
      await storage.setItem('porto_ratecard_category_colors', updatedColors);
    }
    notify?.(`Kategori "${trimmed}" berhasil ditambahkan!`, 'success');
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const doDelete = async () => {
      const updated = categories.filter(c => c !== catToDelete);
      setCategories(updated);
      await storage.setItem('porto_ratecard_categories', updated);
      notify?.(`Kategori "${catToDelete}" dihapus dari daftar.`, 'info');
    };
    if (confirm) {
      confirm({
        title: 'Hapus Kategori?',
        message: `Hapus kategori "${catToDelete}" dari daftar pilihan?`,
        isDestructive: true,
        onConfirm: doDelete
      });
    } else {
      doDelete();
    }
  };

  const handleUpdateCategoryColor = async (cat: string, newColor: string) => {
    const updated = { ...categoryColors, [cat]: newColor };
    setCategoryColors(updated);
    await storage.setItem('porto_ratecard_category_colors', updated);
    if (pkgDraft.category === cat) {
      setPkgDraft(prev => ({ 
        ...prev, 
        categoryColor: newColor, 
        badgeColor: prev.badgeColor || newColor 
      }));
    }
    notify?.(`Warna kategori "${cat}" diperbarui!`, 'success');
  };

  const handleAddBadge = async (newBadge: string) => {
    const trimmed = newBadge.trim();
    if (!trimmed || badges.includes(trimmed)) return;
    const updated = [...badges, trimmed];
    setBadges(updated);
    await storage.setItem('porto_ratecard_badges', updated);
    notify?.(`Badge "${trimmed}" berhasil ditambahkan!`, 'success');
  };

  const handleDeleteBadge = async (badgeToDelete: string) => {
    const doDelete = async () => {
      const updated = badges.filter(b => b !== badgeToDelete);
      setBadges(updated);
      await storage.setItem('porto_ratecard_badges', updated);
      notify?.(`Badge "${badgeToDelete}" dihapus dari daftar.`, 'info');
    };
    if (confirm) {
      confirm({
        title: 'Hapus Badge?',
        message: `Hapus badge "${badgeToDelete}" dari daftar pilihan?`,
        isDestructive: true,
        onConfirm: doDelete
      });
    } else {
      doDelete();
    }
  };

  // Deliverable row management helpers
  const handleAddDeliverableRow = (preset?: { text: string; qty?: string; unit?: string }) => {
    const newRow: DeliverableRow = {
      id: `deliv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: preset?.text || '',
      qty: preset?.qty || '1',
      unit: preset?.unit || ''
    };
    setDeliverableRows(prev => [...prev, newRow]);
  };

  const handleUpdateDeliverableRow = (id: string, field: keyof DeliverableRow, val: string) => {
    setDeliverableRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleDeleteDeliverableRow = (id: string) => {
    setDeliverableRows(prev => {
      const filtered = prev.filter(r => r.id !== id);
      return filtered.length > 0 ? filtered : [{ id: `deliv-${Date.now()}`, text: '', qty: '', unit: '' }];
    });
  };

  const handleMoveDeliverableRow = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= deliverableRows.length) return;
    setDeliverableRows(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Sync package to porto_catalog_products and porto_catalog
  const syncToCatalog = async (pkg: RateCardPackage, silent = false, overridePublished?: boolean) => {
    try {
      const existingProducts = await storage.getItem('porto_catalog_products', []);
      const list = Array.isArray(existingProducts) ? [...existingProducts] : [];
      const code = `SRV-${pkg.id.replace(/\D/g, '').slice(-4) || 'PKG'}`;
      const idx = list.findIndex((p: any) => p.rateCardId === pkg.id || p.id === `rc_${pkg.id}`);
      
      const isPub = overridePublished !== undefined
        ? overridePublished
        : (idx >= 0 ? list[idx].isPublished !== false : false);

      const existingItem = idx >= 0 ? list[idx] : null;
      const formattedDesc = (pkg.description ? pkg.description + '\n\n' : '') + 'Deliverables:\n' + (pkg.deliverables || []).map(d => `• ${d}`).join('\n');

      const catalogItem = {
        id: existingItem ? existingItem.id : `rc_${pkg.id}`,
        productCode: existingItem?.productCode || code,
        name: pkg.title,
        category: pkg.category || 'Layanan Studio',
        type: existingItem?.type || 'Layanan',
        price: pkg.price,
        originalPrice: pkg.originalPrice || pkg.price,
        stock: existingItem?.stock ?? 999,
        description: existingItem?.description || formattedDesc,
        // PRESERVE ALL CATALOG-SPECIFIC ASSETS (Images, digital downloads, variants)
        gallery: existingItem?.gallery || [],
        variants: existingItem?.variants || [],
        isDigitalAsset: existingItem?.isDigitalAsset || false,
        downloadUrl: existingItem?.downloadUrl || '',
        fileFormat: existingItem?.fileFormat || 'ZIP',
        fileSize: existingItem?.fileSize || '',
        instantDeliveryMessage: existingItem?.instantDeliveryMessage || '',
        seoTitle: existingItem?.seoTitle || '',
        seoDesc: existingItem?.seoDesc || '',
        // SYNCHRONIZED RATE CARD METADATA
        isPublished: isPub,
        rateCardId: pkg.id,
        badge: pkg.badge,
        badgeColor: pkg.badgeColor,
        categoryColor: pkg.categoryColor,
        billingPeriod: pkg.billingPeriod,
        deliverables: pkg.deliverables,
        durationDays: pkg.durationDays,
        revisionLimit: pkg.revisionLimit
      };

      if (idx >= 0) {
        list[idx] = { ...list[idx], ...catalogItem };
      } else {
        list.unshift(catalogItem);
      }

      await storage.setItem('porto_catalog_products', list);
      await storage.setItem('porto_catalog', list);
      window.dispatchEvent(new CustomEvent('porto_catalog_updated', { detail: list }));

      setSyncedIds(prev => ({ ...prev, [pkg.id]: true }));
      setCatalogPublishedIds(prev => ({ ...prev, [pkg.id]: isPub }));
      if (!silent) {
        notify?.(`✓ Paket "${pkg.title}" terhubung ke Katalog Toko & Transaksi!`, 'success');
      }
    } catch (err) {
      console.error('Failed to sync to catalog:', err);
    }
  };

  const handleTogglePricingPublish = async (pkg: RateCardPackage) => {
    const nextState = pkg.isActive === false ? true : false;
    const updated = packages.map(p => p.id === pkg.id ? { ...p, isActive: nextState } : p);
    await savePackages(updated);
    notify?.(
      nextState
        ? `✓ Paket "${pkg.title}" aktif tayang di Pricing Rate Card!`
        : `Paket "${pkg.title}" kini Draft (Mata Tertutup) di Pricing.`,
      'info'
    );
  };

  const handleToggleCatalogPublish = async (pkg: RateCardPackage) => {
    try {
      const existingProducts = await storage.getItem('porto_catalog_products', []);
      const list = Array.isArray(existingProducts) ? [...existingProducts] : [];
      const idx = list.findIndex((p: any) => p.rateCardId === pkg.id || p.id === `rc_${pkg.id}`);
      
      let nextPublished = true;
      if (idx >= 0) {
        nextPublished = list[idx].isPublished === false ? true : false;
        list[idx] = { ...list[idx], isPublished: nextPublished };
      } else {
        nextPublished = true;
        const code = `SRV-${pkg.id.replace(/\D/g, '').slice(-4) || 'PKG'}`;
        list.unshift({
          id: `rc_${pkg.id}`,
          productCode: code,
          name: pkg.title,
          category: pkg.category || 'Layanan Studio',
          type: 'Layanan',
          price: pkg.price,
          originalPrice: pkg.originalPrice || pkg.price,
          stock: 999,
          description: (pkg.description ? pkg.description + '\n\n' : '') + 'Deliverables:\n' + (pkg.deliverables || []).map(d => `• ${d}`).join('\n'),
          isPublished: true,
          rateCardId: pkg.id,
          durationDays: pkg.durationDays,
          revisionLimit: pkg.revisionLimit
        });
      }

      await storage.setItem('porto_catalog_products', list);
      await storage.setItem('porto_catalog', list);
      window.dispatchEvent(new CustomEvent('porto_catalog_updated', { detail: list }));

      setCatalogPublishedIds(prev => ({ ...prev, [pkg.id]: nextPublished }));
      setSyncedIds(prev => ({ ...prev, [pkg.id]: true }));
      notify?.(
        nextPublished
          ? `✓ Produk "${pkg.title}" aktif tayang di Katalog Toko!`
          : `Produk "${pkg.title}" kini Draft (Mata Tertutup) di Katalog.`,
        'info'
      );
    } catch (err) {
      console.error('Failed to toggle catalog publish:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingPkg(null);
    setDeliverableRows([
      { id: `d-1`, qty: '2', unit: 'Konsep', text: 'Desain Logo Primer & Sekunder' },
      { id: `d-2`, qty: '1', unit: 'Panduan', text: 'Palet Warna & Tipografi' },
      { id: `d-3`, qty: '1', unit: 'Halaman', text: 'Landing Page Responsif' },
      { id: `d-4`, qty: '3', unit: 'x Revisi', text: 'Revisi Minor Fleksibel' },
      { id: `d-5`, qty: '1', unit: 'Paket', text: 'File Master Lengkap (.AI, .SVG, .PNG)' }
    ]);
    const defaultCat = categories[0] || 'Branding';
    const defaultCatColor = categoryColors[defaultCat] || '#6366f1';
    setPkgDraft({
      title: '',
      category: defaultCat,
      badge: '',
      badgeColor: defaultCatColor,
      categoryColor: defaultCatColor,
      price: 1500000,
      originalPrice: undefined,
      billingPeriod: 'per proyek',
      description: '',
      durationDays: 5,
      revisionLimit: '3x Revisi',
      isPopular: false,
      isActive: false // Default mata tertutup (Draft) for pricing
    });
    setIsCatalogPublishedDraft(false); // Default mata tertutup (Draft) for catalog
    setAutoSyncCatalog(true);
    setShowBadgeColorPopup(false);
    setShowModal(true);
  };

  const handleOpenEdit = (pkg: RateCardPackage) => {
    setEditingPkg(pkg);
    const rows = (pkg.deliverables && pkg.deliverables.length > 0)
      ? pkg.deliverables.map((d, i) => parseDeliverableString(d, i))
      : [{ id: `d-${Date.now()}-1`, qty: '', unit: '', text: '' }];
    setDeliverableRows(rows);
    const catColor = (pkg.category && categoryColors[pkg.category]) || '#6366f1';
    setPkgDraft({ 
      ...pkg,
      badgeColor: pkg.badgeColor || catColor,
      categoryColor: pkg.categoryColor || catColor,
      isActive: pkg.isActive !== false
    });
    setIsCatalogPublishedDraft(catalogPublishedIds[pkg.id] ?? false);
    setAutoSyncCatalog(true);
    setShowBadgeColorPopup(false);
    setShowModal(true);
  };

  const handleSavePackage = async () => {
    if (!pkgDraft.title?.trim() || !pkgDraft.price) {
      notify?.('Nama paket dan harga wajib diisi', 'error');
      return;
    }

    const delivList = deliverableRows
      .map(formatDeliverableRow)
      .map(s => s.trim())
      .filter(Boolean);

    let savedPkg: RateCardPackage;

    if (editingPkg) {
      savedPkg = {
        ...editingPkg,
        ...pkgDraft,
        title: pkgDraft.title.trim(),
        price: Number(pkgDraft.price),
        originalPrice: pkgDraft.originalPrice ? Number(pkgDraft.originalPrice) : undefined,
        deliverables: delivList,
        billingPeriod: pkgDraft.billingPeriod || 'per proyek',
        badgeColor: pkgDraft.badgeColor?.trim() || undefined,
        categoryColor: pkgDraft.categoryColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : undefined),
        isActive: !!pkgDraft.isActive
      } as RateCardPackage;

      const updated = packages.map(p => p.id === editingPkg.id ? savedPkg : p);
      await savePackages(updated);
      notify?.('Paket layanan diperbarui!', 'success');
    } else {
      const catColor = pkgDraft.categoryColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : undefined);
      savedPkg = {
        id: `pkg-${Date.now()}`,
        title: pkgDraft.title.trim(),
        category: pkgDraft.category?.trim() || 'Umum',
        badge: pkgDraft.badge?.trim() || undefined,
        badgeColor: pkgDraft.badgeColor?.trim() || catColor,
        categoryColor: catColor,
        price: Number(pkgDraft.price),
        originalPrice: pkgDraft.originalPrice ? Number(pkgDraft.originalPrice) : undefined,
        billingPeriod: pkgDraft.billingPeriod || 'per proyek',
        description: pkgDraft.description?.trim() || '',
        deliverables: delivList,
        durationDays: pkgDraft.durationDays ? Number(pkgDraft.durationDays) : 5,
        revisionLimit: pkgDraft.revisionLimit?.trim() || '3x Revisi',
        isPopular: !!pkgDraft.isPopular,
        isActive: !!pkgDraft.isActive // obeys toggle, defaults to false (draft)
      };
      await savePackages([...packages, savedPkg]);
      notify?.('Paket layanan baru disimpan (Draft)!', 'success');
    }

    if (autoSyncCatalog) {
      await syncToCatalog(savedPkg, true, isCatalogPublishedDraft);
    }

    setShowBadgeColorPopup(false);
    setShowModal(false);
    setEditingPkg(null);
  };

  const handleDeletePackage = (id: string, title: string) => {
    const action = async () => {
      const updated = packages.filter(p => p.id !== id);
      await savePackages(updated);
      notify?.(`Paket "${title}" dihapus.`, 'info');
    };

    if (confirm) {
      confirm({
        title: 'Hapus Paket?',
        message: `Hapus paket layanan "${title}" dari Rate Card?`,
        isDestructive: true,
        onConfirm: action
      });
    } else {
      if (window.confirm(`Hapus paket "${title}"?`)) action();
    }
  };

  const handleOrderWhatsApp = (pkg: RateCardPackage) => {
    const cleanPhone = studioPhone.replace(/\D/g, '');
    const priceStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pkg.price);
    const msg = `Halo studio, saya ingin berkonsultasi dan memesan paket layanan *${pkg.title}* (${priceStr} / ${pkg.billingPeriod || 'per proyek'}). Apakah ada slot pengerjaan tersedia?`;
    const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const url = targetPhone ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Create Transaction Shortcut
  const handleCreateTransaction = async (pkg: RateCardPackage) => {
    try {
      const currentTx = await storage.getItem('porto_transactions', []);
      const newTx = {
        id: `tx-${Date.now()}`,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        customerName: 'Klien Baru (Draft)',
        customerPhone: '',
        items: [{
          name: pkg.title,
          price: pkg.price,
          qty: 1,
          category: pkg.category
        }],
        totalAmount: pkg.price,
        status: 'draft',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        notes: `Paket Layanan Rate Card: ${pkg.title}`
      };
      const updated = [newTx, ...(Array.isArray(currentTx) ? currentTx : [])];
      await storage.setItem('porto_transactions', updated);
      notify?.(`Invoice draft "${pkg.title}" dibuat di Transaksi!`, 'success');
    } catch (err) {
      console.error('Failed to create transaction:', err);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // ── EXPORT BLANK TEMPLATE EXCEL (TIDAK MEMBAWA ISI PAKET LAMA) ──
  const handleExportTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = [
        'Nama Paket *',
        'Kategori *',
        'Badge (Opsional)',
        'Harga (IDR) *',
        'Harga Coret (IDR)',
        'Periode Penagihan',
        'Durasi (Hari Kerja)',
        'Ketentuan Revisi',
        'Deskripsi Singkat',
        'Fitur / Deliverables (Gunakan titik-koma ; untuk pisahkan fitur)'
      ];

      // Baris panduan format (tidak memasukkan data paket lama sesuai instruksi)
      const sampleRow = [
        'Contoh Paket Desain Brand',
        'Branding',
        'Paling Populer',
        '2500000',
        '3000000',
        'per proyek',
        '5',
        '3x Revisi Minor',
        'Solusi visual branding UMKM & kreator',
        '2 Konsep Logo Primer; 1 Panduan Palet Warna; 1 Halaman Landing Page; File Master Lengkap'
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

      ws['!cols'] = [
        { wch: 30 }, // Nama Paket
        { wch: 18 }, // Kategori
        { wch: 18 }, // Badge
        { wch: 16 }, // Harga
        { wch: 16 }, // Harga Coret
        { wch: 18 }, // Periode
        { wch: 18 }, // Durasi
        { wch: 18 }, // Revisi
        { wch: 38 }, // Deskripsi
        { wch: 55 }  // Deliverables
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Template Input Paket');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Template_Input_Paket_RateCard.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notify?.('✓ Template Excel kosong berhasil diunduh. Silakan isi baris baru!', 'success');
    } catch (err: any) {
      console.error('Export template error:', err);
      notify?.('Gagal mengunduh template: ' + err.message, 'error');
    }
  };

  // ── IMPORT PAKET DARI TEMPLATE EXCEL ──
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) {
        notify?.('Berkas Excel kosong atau format tidak valid!', 'error');
        return;
      }
      const ws = wb.Sheets[firstSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (rawRows.length <= 1) {
        notify?.('Tidak ada baris data baru untuk diimpor!', 'error');
        return;
      }

      const dataRows = rawRows.slice(1);
      const importedPackages: RateCardPackage[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) continue;

        const title = String(row[0] || '').trim();
        // Lewati jika kosong atau jika baris contoh dibiarkan
        if (!title || title.toLowerCase().includes('contoh paket desain')) continue;

        const category = String(row[1] || 'Layanan').trim();
        const badge = String(row[2] || '').trim();
        const price = Number(String(row[3] || '0').replace(/\D/g, '')) || 0;
        const originalPriceRaw = Number(String(row[4] || '0').replace(/\D/g, '')) || 0;
        const originalPrice = originalPriceRaw > price ? originalPriceRaw : undefined;
        const billingPeriod = String(row[5] || 'per proyek').trim();
        const durationDays = parseInt(String(row[6] || '5').replace(/\D/g, ''), 10) || 5;
        const revisionLimit = String(row[7] || '3x Revisi Minor').trim();
        const description = String(row[8] || '').trim();

        const rawDeliverables = String(row[9] || '').trim();
        const deliverables = rawDeliverables
          ? rawDeliverables.split(/[;\n\r]+/).map(s => s.trim()).filter(Boolean)
          : ['Fitur Utama Layanan'];

        const catColor = categoryColors[category] || '#6366f1';

        const newPkg: RateCardPackage = {
          id: `pkg-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          title,
          category,
          badge: badge || undefined,
          badgeColor: catColor,
          categoryColor: catColor,
          price: price || 1000000,
          originalPrice,
          billingPeriod: billingPeriod || 'per proyek',
          description,
          deliverables,
          durationDays,
          revisionLimit: revisionLimit || '3x Revisi',
          isPopular: !!(badge && badge.toLowerCase().includes('populer')),
          isActive: false // Default mata tertutup (Draft)
        };

        importedPackages.push(newPkg);
      }

      if (importedPackages.length === 0) {
        notify?.('Tidak ada data paket baru yang valid di dalam file Excel.', 'error');
        return;
      }

      const updatedPackages = [...packages, ...importedPackages];
      await savePackages(updatedPackages);

      // Auto-sync setiap paket yang diimpor ke katalog produk & keuangan (sebagai draft)
      for (const p of importedPackages) {
        await syncToCatalog(p, true, false);
      }

      notify?.(`✓ Berhasil mengimpor ${importedPackages.length} paket baru dari Excel (Status: Draft)!`, 'success');
    } catch (err: any) {
      console.error('Import excel error:', err);
      notify?.('Gagal membaca file Excel: ' + err.message, 'error');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const categoryFilterList = Array.from(new Set(['all', ...categories, ...packages.map(p => p.category).filter(Boolean)]));

  const filteredPackages = packages.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const groupedCategories = useMemo(() => {
    const map: Record<string, RateCardPackage[]> = {};
    filteredPackages.forEach(pkg => {
      const cat = pkg.category || 'Layanan';
      if (!map[cat]) map[cat] = [];
      map[cat].push(pkg);
    });
    return map;
  }, [filteredPackages]);

  const activePackages = packages.filter(p => p.isActive !== false);
  const totalPipeline = activePackages.reduce((acc, p) => acc + (p.price || 0), 0);
  const avgDeal = activePackages.length > 0 ? Math.round(totalPipeline / activePackages.length) : 0;
  const highestPkg = activePackages.reduce((prev, curr) => (curr.price > prev.price ? curr : prev), activePackages[0] || { price: 0, title: '-' });

  const publicUrl = `${window.location.origin}/pricing`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    notify?.('Tautan publik Rate Card berhasil disalin!', 'success');
  };

  return (
    <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── HEADER BANNER ── */}
      <div style={{
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
        borderRadius: 20,
        padding: '14px 20px',
        boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Kembali"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                color: 'var(--cms-text, currentColor)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Receipt size={18} strokeWidth={2.4} />
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
            Tarif
          </h2>
        </div>

        {/* Action Header Buttons (Icon Only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={async () => {
              try {
                const { syncRateCards } = await import('../../../utils/googleSync');
                await syncRateCards(notify);
              } catch (err: any) {
                notify?.('Gagal sinkronisasi: ' + err.message, 'error');
              }
            }}
            title="Sinkronkan ke Google Sheets"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: '#10b981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Cloud size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            title="Bagikan"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: '#10b981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Share2 size={16} />
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'admin' ? 'client' : 'admin')}
            title={viewMode === 'client' ? 'Admin' : 'Klien'}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
              background: viewMode === 'client' ? '#10b981' : 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              color: viewMode === 'client' ? '#ffffff' : 'var(--cms-text, currentColor)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Eye size={16} />
          </button>

          {viewMode === 'admin' && (
            <button
              type="button"
              onClick={handleOpenCreate}
              title="Tambah"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── SUB-TAB SWITCHER: PAKET TARIF vs ADD-ON ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--cms-card-bg, #ffffff)',
        border: '1.5px solid var(--cms-border, rgba(255,255,255,0.1))',
        borderRadius: 100,
        padding: 4,
        width: 'fit-content'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 100,
            border: 'none',
            background: activeTab === 'packages' ? '#10b981' : 'transparent',
            color: activeTab === 'packages' ? '#ffffff' : 'var(--cms-text-muted)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Receipt size={15} />
          <span>Paket Layanan ({packages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addons')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 100,
            border: 'none',
            background: activeTab === 'addons' ? '#10b981' : 'transparent',
            color: activeTab === 'addons' ? '#ffffff' : 'var(--cms-text-muted)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Zap size={15} />
          <span>Add-on Ekstra ({addons.length})</span>
        </button>
      </div>

      {activeTab === 'packages' && (
        <>
          {/* ── PIPELINE & REVENUE INTELLIGENCE STATS ── */}
      {viewMode === 'admin' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14
        }}>
          {/* Card 1 */}
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
            borderRadius: 18,
            padding: '16px 20px',
            boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted, #64748b)', textTransform: 'uppercase' }}>
                Potensi
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
                {formatRupiah(totalPipeline)}
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
            borderRadius: 18,
            padding: '16px 20px',
            boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted, #64748b)', textTransform: 'uppercase' }}>
                Rata-rata
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
                {formatRupiah(avgDeal)}
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
            borderRadius: 18,
            padding: '16px 20px',
            boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted, #64748b)', textTransform: 'uppercase' }}>
                Utama
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                {highestPkg.title}
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
            borderRadius: 18,
            padding: '16px 20px',
            boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(139, 92, 246, 0.12)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted, #64748b)', textTransform: 'uppercase' }}>
                Toko
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Check size={14} strokeWidth={3} />
                <span>{activePackages.length} Aktif</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOOLBAR: CATEGORY FILTER, SEARCH & DISPLAY SWITCHER (GRID vs TABLE) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'var(--cms-card-bg, #ffffff)',
        padding: '10px 16px',
        borderRadius: 16,
        border: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categoryFilterList.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: '1px solid',
                borderColor: activeCategory === cat ? '#10b981' : 'var(--cms-border, rgba(255,255,255,0.1))',
                background: activeCategory === cat ? '#10b981' : 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                color: activeCategory === cat ? '#ffffff' : 'var(--cms-text-muted)',
                fontWeight: activeCategory === cat ? 800 : 600,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'all' ? 'Semua' : cat}
            </button>
          ))}
        </div>

        {/* Search & Grid/Table Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 100,
              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
              color: 'var(--cms-text, currentColor)',
              fontSize: 12.5,
              outline: 'none',
              width: 140
            }}
          />

          {/* Export & Import Template Excel (Icon-only, no label) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={handleExportTemplate}
              title="Unduh Template Excel Kosong (Siap Diisi)"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
                color: '#10b981',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--cms-switcher-bg, rgba(255,255,255,0.05))'}
            >
              <Download size={14} />
            </button>

            <label
              title="Impor Paket dari File Excel"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
                color: '#6366f1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--cms-switcher-bg, rgba(255,255,255,0.05))'}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportExcel}
                style={{ display: 'none' }}
              />
              <Upload size={14} />
            </label>
          </div>

          {/* Grid vs Table Switcher (Icon-only) */}
          <div style={{
            display: 'flex',
            background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
            borderRadius: 100,
            padding: 3,
            border: '1px solid var(--cms-border, rgba(255,255,255,0.1))'
          }}>
            <button
              type="button"
              onClick={() => setDisplayMode('grid')}
              title="Grid"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: displayMode === 'grid' ? '#10b981' : 'transparent',
                color: displayMode === 'grid' ? '#ffffff' : 'var(--cms-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('table')}
              title="Tabel"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: displayMode === 'table' ? '#10b981' : 'transparent',
                color: displayMode === 'table' ? '#ffffff' : 'var(--cms-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <Table size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── PACKAGES DISPLAY ── */}
      {filteredPackages.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--cms-card-bg, #ffffff)',
          borderRadius: 22,
          border: '1px dashed var(--cms-border)'
        }}>
          <p style={{ margin: 0, color: 'var(--cms-text-muted)', fontSize: 14 }}>
            Tidak ada paket layanan yang cocok dengan filter saat ini.
          </p>
        </div>
      ) : displayMode === 'grid' ? (
        /* ── 1. GRID CARDS VIEW (GROUPED BY CATEGORY) ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {Object.entries(groupedCategories).map(([catName, pkgs]) => (
            <div key={catName} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                    {catName}
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                    {pkgs.length}
                  </span>
                </div>
                {viewMode === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPkg(null);
                      setPkgDraft({
                        title: '',
                        category: catName === 'Layanan' ? '' : catName,
                        price: 1500000,
                        billingPeriod: 'per proyek',
                        deliverables: [''],
                        isActive: true
                      });
                      setShowModal(true);
                    }}
                    title={`Tambah paket di ${catName}`}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                      background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                      color: '#10b981',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20
              }}>
                {pkgs.map(pkg => {
                  const isSynced = !!syncedIds[pkg.id];

                  return (
                    <div
                      key={pkg.id}
                      style={{
                        background: 'var(--cms-card-bg, #ffffff)',
                        border: pkg.isPopular ? '2px solid #10b981' : '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                        borderRadius: 22,
                        padding: '24px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        boxShadow: pkg.isPopular ? '0 10px 25px rgba(16, 185, 129, 0.12)' : 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Popular / Custom Badge */}
                      {pkg.badge && (
                        <div style={{
                          position: 'absolute',
                          top: -11,
                          right: 20,
                          background: pkg.badgeColor || (pkg.isPopular ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)'),
                          color: '#ffffff',
                          fontSize: 11,
                          fontWeight: 850,
                          padding: '3px 12px',
                          borderRadius: 100,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                          letterSpacing: '0.04em'
                        }}>
                          {pkg.badge}
                        </div>
                      )}

                      {/* Category & Status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ 
                          fontSize: 11.5, 
                          fontWeight: 800, 
                          color: (pkg.category && categoryColors[pkg.category]) || '#10b981', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em' 
                        }}>
                          {pkg.category || 'Layanan Studio'}
                        </span>

                        {viewMode === 'admin' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {/* Eye Toggle Pricing */}
                            <button
                              type="button"
                              onClick={() => handleTogglePricingPublish(pkg)}
                              style={{
                                background: pkg.isActive !== false ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                                border: `1px solid ${pkg.isActive !== false ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                                color: pkg.isActive !== false ? '#10b981' : '#ef4444',
                                cursor: 'pointer',
                                padding: '3px 8px',
                                borderRadius: 100,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 10.5,
                                fontWeight: 800,
                                transition: 'all 0.15s ease'
                              }}
                              title={pkg.isActive !== false ? "Pricing: Tayang di /pricing (Klik untuk Draft)" : "Pricing: Draft / Mata Tertutup (Klik untuk Tayang)"}
                            >
                              {pkg.isActive !== false ? <Eye size={11} /> : <EyeOff size={11} />}
                              <span>{pkg.isActive !== false ? 'Pricing' : 'P-Draft'}</span>
                            </button>

                            {/* Eye Toggle Katalog */}
                            <button
                              type="button"
                              onClick={() => handleToggleCatalogPublish(pkg)}
                              style={{
                                background: catalogPublishedIds[pkg.id] ? 'rgba(99, 102, 241, 0.12)' : 'rgba(100, 116, 139, 0.1)',
                                border: `1px solid ${catalogPublishedIds[pkg.id] ? 'rgba(99, 102, 241, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                                color: catalogPublishedIds[pkg.id] ? '#6366f1' : 'var(--cms-text-muted)',
                                cursor: 'pointer',
                                padding: '3px 8px',
                                borderRadius: 100,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 10.5,
                                fontWeight: 800,
                                transition: 'all 0.15s ease'
                              }}
                              title={catalogPublishedIds[pkg.id] ? "Katalog: Tayang di /katalog (Klik untuk Draft)" : "Katalog: Draft / Mata Tertutup (Klik untuk Tayang)"}
                            >
                              {catalogPublishedIds[pkg.id] ? <Eye size={11} /> : <EyeOff size={11} />}
                              <span>{catalogPublishedIds[pkg.id] ? 'Katalog' : 'K-Draft'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 850, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
                        {pkg.title}
                      </h3>

                      {/* Description */}
                      {pkg.description && (
                        <p style={{ margin: '6px 0 14px', fontSize: 13, color: 'var(--cms-text-muted, #64748b)', lineHeight: 1.5 }}>
                          {pkg.description}
                        </p>
                      )}

                      {/* Price Box */}
                      <div style={{
                        background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                        borderRadius: 14,
                        padding: '14px 16px',
                        margin: '10px 0 16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--cms-text, currentColor)', fontFamily: "'Outfit', sans-serif" }}>
                            {formatRupiah(pkg.price)}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', fontWeight: 600 }}>
                            / {pkg.billingPeriod || 'per proyek'}
                          </span>
                        </div>

                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <div style={{ fontSize: 11.5, color: '#ef4444', textDecoration: 'line-through', marginTop: 2, fontWeight: 700 }}>
                            {formatRupiah(pkg.originalPrice)}
                          </div>
                        )}
                      </div>

                      {/* Specs: Duration & Revision */}
                      <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: 'var(--cms-text-muted)', marginBottom: 16 }}>
                        {pkg.durationDays && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} color="#10b981" />
                            <span>{pkg.durationDays} Hari Kerja</span>
                          </div>
                        )}
                        {pkg.revisionLimit && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RotateCcw size={12} color="#10b981" />
                            <span>{pkg.revisionLimit}</span>
                          </div>
                        )}
                      </div>

                      {/* Deliverables Checklist */}
                      <div style={{ flex: 1, marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                          Fitur
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(pkg.deliverables || []).map((deliv, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'var(--cms-text)' }}>
                              <div style={{ width: 15, height: 15, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                <Check size={9} strokeWidth={3} />
                              </div>
                              <span style={{ lineHeight: 1.4 }}>{deliv}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* WhatsApp Action Button (Icon Only) */}
                      <button
                        type="button"
                        onClick={() => handleOrderWhatsApp(pkg)}
                        title="Pesan via WhatsApp"
                        style={{
                          width: '100%',
                          height: 40,
                          borderRadius: 100,
                          border: 'none',
                          background: pkg.isPopular ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--cms-switcher-bg, rgba(255,255,255,0.08))',
                          color: pkg.isPopular ? '#ffffff' : 'var(--cms-text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: pkg.isPopular ? '0 4px 14px rgba(16, 185, 129, 0.25)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <MessageCircle size={17} />
                      </button>

                      {/* Admin Management Buttons (Icon-only) */}
                      {viewMode === 'admin' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(pkg)}
                            title="Edit"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                              background: 'transparent',
                              color: 'var(--cms-text)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => syncToCatalog(pkg)}
                            title={isSynced ? 'Terhubung ke Toko' : 'Sinkronkan ke Toko'}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                              background: isSynced ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                              color: isSynced ? '#10b981' : 'var(--cms-text)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ShoppingBag size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCreateTransaction(pkg)}
                            title="Buat Transaksi"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                              background: 'transparent',
                              color: '#6366f1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <DollarSign size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                            title="Hapus"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── 2. ADVANCED FULL COMPARISON TABLE VIEW (GROUPED BY CATEGORY) ── */
        <div style={{
          background: 'var(--cms-card-bg, #ffffff)',
          borderRadius: 20,
          border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
          overflow: 'hidden',
          boxShadow: 'var(--cms-shadow-sm, 0 4px 20px rgba(0,0,0,0.03))'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 940 }}>
              <thead>
                <tr style={{ background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))', borderBottom: '1.5px solid var(--cms-border, rgba(255,255,255,0.08))' }}>
                  <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: '28%' }}>Paket & Detail</th>
                  <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: '11%' }}>Kategori</th>
                  <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: '16%' }}>Harga</th>
                  <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: '13%' }}>Estimasi</th>
                  <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: '18%' }}>Fitur / Deliverables</th>
                  {viewMode === 'admin' && (
                    <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: '14%' }}>Status Tayang</th>
                  )}
                  <th style={{ padding: '14px 18px', fontSize: 11, fontWeight: 850, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right', whiteSpace: 'nowrap' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedCategories).map(([catName, pkgs]) => {
                  const catColor = categoryColors[catName] || '#10b981';
                  return (
                  <React.Fragment key={catName}>
                    {/* Category Divider Row */}
                    <tr style={{ background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))', borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))', borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.05))' }}>
                      <td colSpan={viewMode === 'admin' ? 7 : 6} style={{ padding: '10px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: catColor, boxShadow: `0 0 8px ${catColor}66` }} />
                            <span style={{ fontSize: 12.5, fontWeight: 900, color: catColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {catName}
                            </span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: `${catColor}1a`, color: catColor }}>
                              {pkgs.length} Paket
                            </span>
                          </div>
                          {viewMode === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPkg(null);
                                setDeliverableRows([
                                  { id: '1', qty: '1', unit: 'Paket', text: 'Fitur Utama Layanan' }
                                ]);
                                setPkgDraft({
                                  title: '',
                                  category: catName === 'Layanan' ? '' : catName,
                                  price: 1500000,
                                  billingPeriod: 'per proyek',
                                  deliverables: [''],
                                  isActive: false
                                });
                                setShowModal(true);
                              }}
                              title={`Tambah paket di kategori ${catName}`}
                              style={{
                                height: 26,
                                padding: '0 10px',
                                borderRadius: 100,
                                border: `1px solid ${catColor}40`,
                                background: 'transparent',
                                color: catColor,
                                fontSize: 11,
                                fontWeight: 750,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = `${catColor}18`}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <Plus size={12} />
                              <span>Tambah Paket</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {pkgs.map((pkg, idx) => {
                      const isPricingPub = pkg.isActive !== false;
                      const isCatalogPub = !!catalogPublishedIds[pkg.id];
                      const pkgCatColor = (pkg.category && categoryColors[pkg.category]) || catColor;

                      return (
                        <tr
                          key={pkg.id}
                          style={{
                            borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.05))',
                            background: idx % 2 === 0 ? 'transparent' : 'var(--cms-switcher-bg, rgba(255,255,255,0.015))',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--cms-switcher-bg, rgba(255,255,255,0.04))'}
                          onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--cms-switcher-bg, rgba(255,255,255,0.015))'}
                        >
                          {/* Col 1: Paket & Deskripsi */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 850, fontSize: 14.5, color: 'var(--cms-text)', letterSpacing: '-0.01em' }}>
                                {pkg.title}
                              </span>
                              {pkg.badge && (
                                <span style={{ 
                                  fontSize: 10.5, 
                                  fontWeight: 800, 
                                  color: pkg.badgeColor || '#10b981', 
                                  background: pkg.badgeColor ? `${pkg.badgeColor}18` : 'rgba(16,185,129,0.12)', 
                                  border: `1px solid ${pkg.badgeColor ? `${pkg.badgeColor}38` : 'rgba(16,185,129,0.25)'}`,
                                  padding: '2px 8px', 
                                  borderRadius: 100,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                            {pkg.description && (
                              <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 4, maxWidth: 300, lineHeight: 1.45 }}>
                                {pkg.description}
                              </div>
                            )}
                          </td>

                          {/* Col 2: Kategori */}
                          <td style={{ padding: '16px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '3px 10px',
                              borderRadius: 100,
                              background: `${pkgCatColor}14`,
                              color: pkgCatColor,
                              fontWeight: 800,
                              fontSize: 12
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: pkgCatColor }} />
                              <span>{pkg.category || '-'}</span>
                            </div>
                          </td>

                          {/* Col 3: Harga (Strict No-Wrap) */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                              <div style={{ fontSize: 11, textDecoration: 'line-through', color: '#ef4444', marginBottom: 1 }}>
                                {formatRupiah(pkg.originalPrice)}
                              </div>
                            )}
                            <div style={{ fontWeight: 900, fontSize: 15.5, color: '#10b981', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                              {formatRupiah(pkg.price)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 2, whiteSpace: 'nowrap' }}>
                              / {pkg.billingPeriod || 'per proyek'}
                            </div>
                          </td>

                          {/* Col 4: Estimasi Durasi & Revisi */}
                          <td style={{ padding: '16px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 750, color: 'var(--cms-text)' }}>
                              <Clock size={12} color="#10b981" />
                              <span>{pkg.durationDays ? `${pkg.durationDays} Hari Kerja` : '-'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 3 }}>
                              <RotateCcw size={11} />
                              <span>{pkg.revisionLimit || '-'}</span>
                            </div>
                          </td>

                          {/* Col 5: Deliverables / Fitur */}
                          <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {(pkg.deliverables || []).map((d, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--cms-text)', lineHeight: 1.4 }}>
                                  <Check size={12} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                                  <span>{d}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Col 6: Status Tayang (Pricing & Katalog) */}
                          {viewMode === 'admin' && (
                            <td style={{ padding: '16px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {/* Pricing Pill */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePricingPublish(pkg)}
                                  title={isPricingPub ? "Pricing: Tayang (/pricing) - Klik untuk Draft" : "Pricing: Draft - Klik untuk Tayangkan"}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '3px 8px',
                                    borderRadius: 100,
                                    border: `1px solid ${isPricingPub ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.25)'}`,
                                    background: isPricingPub ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                                    color: isPricingPub ? '#10b981' : '#ef4444',
                                    fontSize: 10.5,
                                    fontWeight: 750,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    width: 'fit-content'
                                  }}
                                >
                                  {isPricingPub ? <Eye size={11} strokeWidth={2.5} /> : <EyeOff size={11} strokeWidth={2.5} />}
                                  <span>Pricing: {isPricingPub ? 'Tayang' : 'Draft'}</span>
                                </button>

                                {/* Katalog Pill */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleCatalogPublish(pkg)}
                                  title={isCatalogPub ? "Katalog: Tayang (/katalog) - Klik untuk Draft" : "Katalog: Draft - Klik untuk Tayangkan"}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '3px 8px',
                                    borderRadius: 100,
                                    border: `1px solid ${isCatalogPub ? 'rgba(99, 102, 241, 0.35)' : 'rgba(100, 116, 139, 0.25)'}`,
                                    background: isCatalogPub ? 'rgba(99, 102, 241, 0.1)' : 'rgba(100, 116, 139, 0.08)',
                                    color: isCatalogPub ? '#6366f1' : 'var(--cms-text-muted)',
                                    fontSize: 10.5,
                                    fontWeight: 750,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    width: 'fit-content'
                                  }}
                                >
                                  <ShoppingBag size={11} strokeWidth={2.5} />
                                  <span>Katalog: {isCatalogPub ? 'Tayang' : 'Draft'}</span>
                                </button>
                              </div>
                            </td>
                          )}

                          {/* Col 7: Aksi */}
                          <td style={{ padding: '16px 18px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <button
                                type="button"
                                onClick={() => handleOrderWhatsApp(pkg)}
                                title="Pesan / Konsultasi via WhatsApp"
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 8,
                                  border: 'none',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.color = '#10b981'; }}
                              >
                                <MessageCircle size={14} />
                              </button>

                              {viewMode === 'admin' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCreateTransaction(pkg)}
                                    title="Buat Draft Invoice Keuangan"
                                    style={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: 8,
                                      border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                                      background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                                      color: 'var(--cms-text)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    <Receipt size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(pkg)}
                                    style={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: 8,
                                      border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                                      background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                                      color: 'var(--cms-text)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s'
                                    }}
                                    title="Edit Paket"
                                  >
                                    <Edit3 size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeletePackage(pkg.id, pkg.title)}
                                    style={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: 8,
                                      border: 'none',
                                      background: 'rgba(239,68,68,0.1)',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s'
                                    }}
                                    title="Hapus Paket"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Quick Add Row */}
          {viewMode === 'admin' && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))', display: 'flex', justifyContent: 'center', background: 'var(--cms-switcher-bg, rgba(255,255,255,0.02))' }}>
              <button
                type="button"
                onClick={handleOpenCreate}
                style={{
                  height: 36,
                  padding: '0 20px',
                  borderRadius: 100,
                  border: '1px dashed #10b981',
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: '#10b981',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={14} />
                <span>Tambah Paket</span>
              </button>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* ── ADD-ON MANAGER VIEW ── */}
      {activeTab === 'addons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Bar for Add-ons */}
          <div style={{
            background: 'var(--cms-card-bg, #ffffff)',
            border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
            borderRadius: 20,
            padding: '16px 20px',
            boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>
                  Katalog Add-on Layanan
                </h3>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--cms-text-muted)' }}>
                Fitur tambahan dan penyesuaian khusus yang dapat dipilih klien saat memesan paket di Rate Card
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleResetAddons}
                title="Reset ke Template Default Studio"
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 100,
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                  background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                  color: 'var(--cms-text-muted)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <RotateCcw size={13} />
                <span>Reset Template</span>
              </button>

              <button
                type="button"
                onClick={handleSyncAllAddonsToCatalog}
                title="Sinkronkan semua add-on ke katalog toko dan transaksi sekaligus"
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 100,
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <ShoppingBag size={13} />
                <span>Sync Semua ke Katalog</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddonModal()}
                style={{
                  height: 36,
                  padding: '0 18px',
                  borderRadius: 100,
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                }}
              >
                <Plus size={15} />
                <span>Tambah Add-on</span>
              </button>
            </div>
          </div>

          {/* Add-ons Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16
          }}>
            {addons.map((addon) => (
              <div
                key={addon.id}
                style={{
                  background: 'var(--cms-card-bg, #ffffff)',
                  border: '1.5px solid var(--cms-border, rgba(255,255,255,0.08))',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: 'var(--cms-shadow-sm, 0 4px 14px rgba(0,0,0,0.04))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 850,
                        color: categoryColors[addon.category] || '#10b981',
                        background: categoryColors[addon.category] ? `${categoryColors[addon.category]}1a` : 'rgba(16,185,129,0.12)',
                        border: `1px solid ${categoryColors[addon.category] ? `${categoryColors[addon.category]}33` : 'transparent'}`,
                        padding: '3px 10px',
                        borderRadius: 100,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {addon.category || 'Umum'}
                      </span>

                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: syncedAddonIds[addon.id] ? '#10b981' : '#f59e0b',
                        background: syncedAddonIds[addon.id] ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                        border: `1px solid ${syncedAddonIds[addon.id] ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        padding: '2px 8px',
                        borderRadius: 100,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {syncedAddonIds[addon.id] ? <Check size={10} strokeWidth={3} /> : <Clock size={10} />}
                        <span>{syncedAddonIds[addon.id] ? 'Katalog & Trx' : 'Belum Sync'}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenAddonModal(addon)}
                        title="Edit Add-on"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                          background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                          color: 'var(--cms-text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAddon(addon.id, addon.name)}
                        title="Hapus Add-on"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          border: '1px solid rgba(239,68,68,0.2)',
                          background: 'rgba(239,68,68,0.08)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                    {addon.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--cms-text-muted)' }}>
                    {addon.desc}
                  </p>
                </div>

                {/* Price Display */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 14,
                  borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.06))',
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>
                    {formatRupiah(addon.priceIdr)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted)' }}>
                    {addon.priceUsd > 0 && <span>${addon.priceUsd} USD</span>}
                    {addon.priceUsd > 0 && addon.priceSgd > 0 && <span>•</span>}
                    {addon.priceSgd > 0 && <span>S${addon.priceSgd} SGD</span>}
                  </div>
                </div>

                {/* Direct Action Buttons: Connect to Catalog & Create Transaction */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  paddingTop: 10,
                  marginTop: 4,
                  borderTop: '1px dashed var(--cms-border, rgba(255,255,255,0.08))',
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  <button
                    type="button"
                    onClick={() => syncAddonToCatalog(addon)}
                    title="Sinkronkan add-on ini ke katalog produk studio"
                    style={{
                      flex: 1,
                      minWidth: 120,
                      height: 32,
                      borderRadius: 10,
                      border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                      background: 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
                      color: 'var(--cms-text)',
                      fontSize: 11.5,
                      fontWeight: 750,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <ShoppingBag size={12} color="#10b981" />
                    <span>{syncedAddonIds[addon.id] ? 'Update Katalog' : 'Hubungkan Katalog'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateAddonTransaction(addon)}
                    title="Buat invoice / transaksi langsung untuk add-on ini"
                    style={{
                      flex: 1,
                      minWidth: 120,
                      height: 32,
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#ffffff',
                      fontSize: 11.5,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Receipt size={12} />
                    <span>Buat Transaksi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL CREATE / EDIT ADD-ON (NO DIM, NO BLUR, SOFT FLOATING SHADOW) ── */}
      {showAddonModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setShowAddonModal(false)}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: 'var(--cms-card-bg, #1e293b)',
            border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 25px 70px rgba(0,0,0,0.35)',
            position: 'relative',
            animation: 'cmsPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--cms-text)' }}>
                  {editingAddon ? 'Edit Add-on Layanan' : 'Tambah Add-on Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddonModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Nama Add-on *
                </label>
                <input
                  type="text"
                  value={addonDraft.name || ''}
                  onChange={e => setAddonDraft({ ...addonDraft, name: e.target.value })}
                  placeholder="Cth: Pengiriman Kilat 24 Jam"
                  className="cms-input"
                  style={{ width: '100%', height: 40, borderRadius: 12, fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <ManageableSelect
                  label="Kategori Add-on"
                  value={addonDraft.category || 'Waktu'}
                  onChange={val => setAddonDraft({ ...addonDraft, category: val })}
                  options={categories}
                  onAddOption={handleAddCategory}
                  onDeleteOption={handleDeleteCategory}
                  placeholder="Pilih Kategori Add-on..."
                  colorMap={categoryColors}
                  onColorChange={handleUpdateCategoryColor}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={addonDraft.desc || ''}
                  onChange={e => setAddonDraft({ ...addonDraft, desc: e.target.value })}
                  placeholder="Penjelasan ringkas manfaat add-on..."
                  className="cms-input"
                  style={{ width: '100%', borderRadius: 12, fontSize: 12.5, padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Tarif (IDR) *
                  </label>
                  <input
                    type="number"
                    value={addonDraft.priceIdr || ''}
                    onChange={e => setAddonDraft({ ...addonDraft, priceIdr: Number(e.target.value) })}
                    placeholder="250000"
                    className="cms-input"
                    style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Tarif (USD)
                  </label>
                  <input
                    type="number"
                    value={addonDraft.priceUsd || ''}
                    onChange={e => setAddonDraft({ ...addonDraft, priceUsd: Number(e.target.value) })}
                    placeholder="18"
                    className="cms-input"
                    style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Tarif (SGD)
                  </label>
                  <input
                    type="number"
                    value={addonDraft.priceSgd || ''}
                    onChange={e => setAddonDraft({ ...addonDraft, priceSgd: Number(e.target.value) })}
                    placeholder="24"
                    className="cms-input"
                    style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 12.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddonModal(false)}
                  style={{
                    height: 38,
                    padding: '0 16px',
                    borderRadius: 100,
                    border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                    background: 'transparent',
                    color: 'var(--cms-text)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveAddon}
                  style={{
                    height: 38,
                    padding: '0 22px',
                    borderRadius: 100,
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                  }}
                >
                  Simpan Add-on
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SHARE TO CLIENT ── */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }} onClick={() => setShowShareModal(false)}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: 22,
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 850, color: 'var(--cms-text)' }}>
                Bagikan Rate Card ke Klien
              </h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: 'var(--cms-text-muted)', lineHeight: 1.5 }}>
              Klien dapat langsung melihat seluruh daftar harga, membandingkan rincian paket, dan menekan tombol pesan langsung ke WhatsApp studio Anda.
            </p>

            {/* Public Link Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
              border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
              borderRadius: 14,
              padding: '6px 8px 6px 14px'
            }}>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--cms-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {publicUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyShareLink}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  window.open(publicUrl, '_blank');
                  setShowShareModal(false);
                }}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 12,
                  border: '1px solid var(--cms-border)',
                  background: 'transparent',
                  color: 'var(--cms-text)',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <ExternalLink size={14} />
                <span>Buka di Tab Baru</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = `Halo, berikut daftar harga resmi dan paket layanan studio kami:\n${publicUrl}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 12,
                  border: 'none',
                  background: '#25D366',
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
                <MessageCircle size={14} />
                <span>Kirim via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TAMBAH/EDIT RATE CARD (FIXED CONSISTENT DIMENSIONS) ── */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.72)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }} onClick={() => setShowModal(false)}>
          <div style={{
            width: 680,
            maxWidth: 'calc(100vw - 32px)',
            height: '82vh',
            minHeight: 540,
            maxHeight: 740,
            background: 'var(--cms-card-bg, #ffffff)',
            borderRadius: 22,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            border: '1.5px solid var(--cms-border, rgba(255,255,255,0.15))',
            boxSizing: 'border-box'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, paddingBottom: 10, borderBottom: '1px solid var(--cms-border, rgba(255,255,255,0.08))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Receipt size={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 850, color: 'var(--cms-text)' }}>
                  {editingPkg ? 'Edit Paket' : 'Paket Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                title="Tutup"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                  background: 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
                  color: 'var(--cms-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              {/* Title (Paket) */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Receipt size={12} color="#10b981" />
                  <span>Paket</span>
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={pkgDraft.title || ''}
                  onChange={e => setPkgDraft({ ...pkgDraft, title: e.target.value })}
                  placeholder="Nama paket layanan..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              {/* Category & Badge (ROUNDED DROPDOWNS WITH ADD/DELETE LIST) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <ManageableSelect
                    label="Kategori"
                    value={pkgDraft.category || 'Branding'}
                    onChange={val => {
                      const defaultCatColor = categoryColors[val] || '#6366f1';
                      setPkgDraft({
                        ...pkgDraft,
                        category: val,
                        categoryColor: defaultCatColor,
                        badgeColor: pkgDraft.badgeColor || defaultCatColor
                      });
                    }}
                    options={categories}
                    onAddOption={handleAddCategory}
                    onDeleteOption={handleDeleteCategory}
                    placeholder="Pilih Kategori..."
                    colorMap={categoryColors}
                    onColorChange={handleUpdateCategoryColor}
                  />
                </div>
                {/* Badge Dropdown + 1 Tombol Pop Up Warna */}
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <ManageableSelect
                        label="Badge"
                        value={pkgDraft.badge || ''}
                        onChange={val => setPkgDraft({ ...pkgDraft, badge: val })}
                        options={badges}
                        onAddOption={handleAddBadge}
                        onDeleteOption={handleDeleteBadge}
                        placeholder="Pilih Badge..."
                        allowClear
                        clearLabel="(Tanpa Badge)"
                        badgePreviewColor={pkgDraft.badgeColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : '#10b981')}
                      />
                    </div>

                    {/* 1 Tombol Pop Up Warna Badge */}
                    <button
                      type="button"
                      onClick={() => setShowBadgeColorPopup(!showBadgeColorPopup)}
                      title="Atur Warna Badge"
                      style={{
                        height: 42,
                        width: 42,
                        borderRadius: 14,
                        border: showBadgeColorPopup ? '2px solid #10b981' : '1.5px solid var(--cms-border, rgba(255,255,255,0.15))',
                        background: 'var(--cms-switcher-bg, rgba(255,255,255,0.06))',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                        boxShadow: showBadgeColorPopup ? '0 0 12px rgba(16,185,129,0.3)' : 'none'
                      }}
                    >
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: pkgDraft.badgeColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : '#10b981'),
                        border: '2px solid #ffffff',
                        boxShadow: `0 0 6px ${(pkgDraft.badgeColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : '#10b981'))}99`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Palette size={10} color="#ffffff" />
                      </div>
                    </button>
                  </div>

                  {/* Pop up Warna Badge (No Dim, No Blur, Soft Floating Shadow) */}
                  {showBadgeColorPopup && (
                    <>
                      <div
                        onClick={() => setShowBadgeColorPopup(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 999998, background: 'transparent' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          right: 0,
                          zIndex: 999999,
                          width: 290,
                          background: 'var(--cms-card-bg, #1e293b)',
                          border: '1.5px solid var(--cms-border, rgba(255,255,255,0.18))',
                          borderRadius: 16,
                          padding: '12px 14px',
                          boxShadow: '0 16px 36px rgba(0,0,0,0.35)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10
                        }}
                      >
                        {/* Header with live badge preview and close button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Warna Badge
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {pkgDraft.badge ? (
                              <span style={{
                                padding: '2px 9px',
                                borderRadius: 100,
                                background: pkgDraft.badgeColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : '#10b981'),
                                color: '#ffffff',
                                fontSize: 10,
                                fontWeight: 850,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                              }}>
                                {pkgDraft.badge}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', fontStyle: 'italic' }}>
                                (Preview)
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowBadgeColorPopup(false)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--cms-text-muted)',
                                cursor: 'pointer',
                                padding: 2,
                                display: 'flex'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Button: Ikuti Warna Kategori */}
                        <button
                          type="button"
                          onClick={() => {
                            const catColor = (pkgDraft.category && categoryColors[pkgDraft.category]) || '#6366f1';
                            setPkgDraft({ ...pkgDraft, badgeColor: catColor });
                          }}
                          title="Samakan warna badge dengan warna kategori layanan"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: 10,
                            border: '1px solid var(--cms-border, rgba(255,255,255,0.12))',
                            background: 'var(--cms-switcher-bg, rgba(255,255,255,0.05))',
                            color: 'var(--cms-text)',
                            fontSize: 11.5,
                            fontWeight: 750,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: (pkgDraft.category && categoryColors[pkgDraft.category]) || '#6366f1',
                            boxShadow: `0 0 6px ${(pkgDraft.category && categoryColors[pkgDraft.category]) || '#6366f1'}`
                          }} />
                          <span>Ikuti Warna Kategori</span>
                        </button>

                        {/* Color Presets */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {[
                            { name: 'Emerald', color: '#10b981' },
                            { name: 'Indigo', color: '#6366f1' },
                            { name: 'Purple', color: '#8b5cf6' },
                            { name: 'Pink', color: '#ec4899' },
                            { name: 'Amber', color: '#f59e0b' },
                            { name: 'Rose', color: '#f43f5e' },
                            { name: 'Sky', color: '#0284c7' },
                            { name: 'Cyan', color: '#06b6d4' },
                            { name: 'Slate', color: '#475569' }
                          ].map(p => {
                            const activeCol = pkgDraft.badgeColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : '#10b981');
                            const isSelected = activeCol.toLowerCase() === p.color.toLowerCase();
                            return (
                              <button
                                key={p.color}
                                type="button"
                                onClick={() => setPkgDraft({ ...pkgDraft, badgeColor: p.color })}
                                title={p.name}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  background: p.color,
                                  border: isSelected ? '2.5px solid #ffffff' : '1px solid rgba(0,0,0,0.15)',
                                  boxShadow: isSelected ? '0 0 0 2px var(--cms-accent, #10b981)' : 'none',
                                  cursor: 'pointer',
                                  transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                  transition: 'transform 0.15s ease'
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* Custom Color Picker & Hex Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))' }}>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }} title="Pilih dari roda warna">
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              background: pkgDraft.badgeColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : '#10b981'),
                              border: '1.5px solid rgba(255,255,255,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Palette size={12} color="#ffffff" />
                            </div>
                            <input
                              type="color"
                              value={pkgDraft.badgeColor || (pkgDraft.category ? categoryColors[pkgDraft.category] : '#10b981')}
                              onChange={e => setPkgDraft({ ...pkgDraft, badgeColor: e.target.value })}
                              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                            />
                          </label>
                          <input
                            type="text"
                            value={pkgDraft.badgeColor || ''}
                            placeholder="#10b981"
                            onChange={e => setPkgDraft({ ...pkgDraft, badgeColor: e.target.value })}
                            style={{
                              flex: 1,
                              height: 30,
                              borderRadius: 8,
                              border: '1px solid var(--cms-border, rgba(255,255,255,0.15))',
                              background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                              color: 'var(--cms-text)',
                              fontSize: 12,
                              fontFamily: 'monospace',
                              padding: '0 8px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Price & Billing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <DollarSign size={12} color="#10b981" />
                    <span>Harga</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={pkgDraft.price || ''}
                    onChange={e => setPkgDraft({ ...pkgDraft, price: Number(e.target.value) })}
                    placeholder="2500000"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <RoundedSelect
                    label="Periode"
                    value={pkgDraft.billingPeriod || 'per proyek'}
                    onChange={(val) => setPkgDraft({ ...pkgDraft, billingPeriod: val as any })}
                    options={BILLING_OPTIONS}
                  />
                </div>
              </div>

              {/* Duration and revisions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={12} color="#10b981" />
                    <span>Durasi</span>
                  </label>
                  <input
                    type="number"
                    value={pkgDraft.durationDays || 5}
                    onChange={e => setPkgDraft({ ...pkgDraft, durationDays: Number(e.target.value) })}
                    placeholder="5 (Hari kerja)"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <RotateCcw size={12} color="#10b981" />
                    <span>Revisi</span>
                  </label>
                  <input
                    type="text"
                    value={pkgDraft.revisionLimit || ''}
                    onChange={e => setPkgDraft({ ...pkgDraft, revisionLimit: e.target.value })}
                    placeholder="3x Revisi"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Edit3 size={12} color="#10b981" />
                  <span>Deskripsi</span>
                </label>
                <textarea
                  rows={2}
                  value={pkgDraft.description || ''}
                  onChange={e => setPkgDraft({ ...pkgDraft, description: e.target.value })}
                  placeholder="Ringkasan singkat paket..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--cms-border)', background: 'var(--cms-switcher-bg)', color: 'var(--cms-text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Deliverables Row-by-Row Editor */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={12} color="#10b981" />
                    <span>Fitur</span>
                  </label>

                  {/* Icon-only + Tambah Baris Button */}
                  <button
                    type="button"
                    onClick={() => handleAddDeliverableRow()}
                    title="Tambah Baris"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      background: '#10b981',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Datalist for unit suggestions */}
                <datalist id="deliverable-unit-options">
                  <option value="Konsep" />
                  <option value="Halaman" />
                  <option value="x Revisi" />
                  <option value="Paket" />
                  <option value="Varian" />
                  <option value="Hari" />
                  <option value="Akun" />
                  <option value="Item" />
                </datalist>

                {/* Rows Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto', paddingRight: 4 }}>
                  {deliverableRows.map((row, idx) => (
                    <div
                      key={row.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'var(--cms-switcher-bg, rgba(255,255,255,0.03))',
                        border: '1px solid var(--cms-border, rgba(255,255,255,0.08))',
                        borderRadius: 12,
                        padding: '5px 8px'
                      }}
                    >
                      {/* Row Index Indicator */}
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', width: 14, textAlign: 'center' }}>
                        {idx + 1}
                      </span>

                      {/* Jumlah / Qty */}
                      <input
                        type="text"
                        value={row.qty}
                        onChange={e => handleUpdateDeliverableRow(row.id, 'qty', e.target.value)}
                        placeholder="Jml"
                        title="Jumlah"
                        style={{
                          width: 58,
                          padding: '6px 6px',
                          borderRadius: 8,
                          border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                          background: 'var(--cms-card-bg, rgba(0,0,0,0.15))',
                          color: 'var(--cms-text)',
                          fontSize: 12,
                          textAlign: 'center',
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Satuan / Opsi */}
                      <input
                        type="text"
                        list="deliverable-unit-options"
                        value={row.unit}
                        onChange={e => handleUpdateDeliverableRow(row.id, 'unit', e.target.value)}
                        placeholder="Satuan"
                        title="Satuan"
                        style={{
                          width: 92,
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                          background: 'var(--cms-card-bg, rgba(0,0,0,0.15))',
                          color: 'var(--cms-text)',
                          fontSize: 12,
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Tulisan / Nama Fitur */}
                      <input
                        type="text"
                        value={row.text}
                        onChange={e => handleUpdateDeliverableRow(row.id, 'text', e.target.value)}
                        placeholder="Nama fitur..."
                        title="Fitur"
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--cms-border, rgba(255,255,255,0.1))',
                          background: 'var(--cms-card-bg, rgba(0,0,0,0.15))',
                          color: 'var(--cms-text)',
                          fontSize: 12,
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Move Up Button (Icon only) */}
                      <button
                        type="button"
                        onClick={() => handleMoveDeliverableRow(idx, -1)}
                        disabled={idx === 0}
                        title="Naik"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: idx === 0 ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                          opacity: idx === 0 ? 0.3 : 1,
                          cursor: idx === 0 ? 'default' : 'pointer',
                          padding: 3,
                          display: 'flex'
                        }}
                      >
                        <ChevronUp size={14} />
                      </button>

                      {/* Move Down Button (Icon only) */}
                      <button
                        type="button"
                        onClick={() => handleMoveDeliverableRow(idx, 1)}
                        disabled={idx === deliverableRows.length - 1}
                        title="Turun"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: idx === deliverableRows.length - 1 ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                          opacity: idx === deliverableRows.length - 1 ? 0.3 : 1,
                          cursor: idx === deliverableRows.length - 1 ? 'default' : 'pointer',
                          padding: 3,
                          display: 'flex'
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>

                      {/* Delete Button (Icon only) */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDeliverableRow(row.id)}
                        title="Hapus"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: 3,
                          display: 'flex'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status: 4 Icon + 1-Word Toggle Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6,
                background: 'var(--cms-switcher-bg, rgba(255,255,255,0.04))',
                padding: '8px',
                borderRadius: 14,
                border: '1px solid var(--cms-border, rgba(255,255,255,0.08))'
              }}>
                {/* 1. Pricing Toggle */}
                <button
                  type="button"
                  onClick={() => setPkgDraft(prev => ({ ...prev, isActive: !prev.isActive }))}
                  title={pkgDraft.isActive ? "Pricing: Tayang (/pricing)" : "Pricing: Draft (/pricing)"}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 10,
                    border: `1px solid ${pkgDraft.isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.25)'}`,
                    background: pkgDraft.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                    color: pkgDraft.isActive ? '#10b981' : '#ef4444',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pkgDraft.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>Pricing</span>
                </button>

                {/* 2. Katalog Toggle */}
                <button
                  type="button"
                  onClick={() => setIsCatalogPublishedDraft(prev => !prev)}
                  title={isCatalogPublishedDraft ? "Katalog: Tayang (/katalog)" : "Katalog: Draft (/katalog)"}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 10,
                    border: `1px solid ${isCatalogPublishedDraft ? 'rgba(99, 102, 241, 0.4)' : 'rgba(100, 116, 139, 0.25)'}`,
                    background: isCatalogPublishedDraft ? 'rgba(99, 102, 241, 0.12)' : 'rgba(100, 116, 139, 0.08)',
                    color: isCatalogPublishedDraft ? '#6366f1' : 'var(--cms-text-muted)',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isCatalogPublishedDraft ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>Katalog</span>
                </button>

                {/* 3. Unggulan Toggle */}
                <button
                  type="button"
                  onClick={() => setPkgDraft(prev => ({ ...prev, isPopular: !prev.isPopular }))}
                  title={pkgDraft.isPopular ? "Unggulan Aktif" : "Bukan Unggulan"}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 10,
                    border: `1px solid ${pkgDraft.isPopular ? 'rgba(245, 158, 11, 0.4)' : 'var(--cms-border, rgba(255,255,255,0.1))'}`,
                    background: pkgDraft.isPopular ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                    color: pkgDraft.isPopular ? '#f59e0b' : 'var(--cms-text-muted)',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Sparkles size={13} />
                  <span>Unggulan</span>
                </button>

                {/* 4. Sinkron Toggle */}
                <button
                  type="button"
                  onClick={() => setAutoSyncCatalog(prev => !prev)}
                  title={autoSyncCatalog ? "Sinkron Toko & Keuangan Aktif" : "Sinkron Dimatikan"}
                  style={{
                    padding: '7px 4px',
                    borderRadius: 10,
                    border: `1px solid ${autoSyncCatalog ? 'rgba(16, 185, 129, 0.4)' : 'var(--cms-border, rgba(255,255,255,0.1))'}`,
                    background: autoSyncCatalog ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    color: autoSyncCatalog ? '#10b981' : 'var(--cms-text-muted)',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Link2 size={13} />
                  <span>Sinkron</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid var(--cms-border, rgba(255,255,255,0.08))', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                title="Batal"
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 100,
                  border: '1px solid var(--cms-border)',
                  background: 'transparent',
                  color: 'var(--cms-text)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <X size={14} />
                <span>Batal</span>
              </button>
              <button
                type="button"
                onClick={handleSavePackage}
                title="Simpan"
                style={{
                  height: 38,
                  padding: '0 20px',
                  borderRadius: 100,
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: 'none'
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateCardManager;
