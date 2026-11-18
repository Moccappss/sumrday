import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck, Plus, Search, Copy, Check, MessageSquare,
  Trash2, Layers, Phone, Eye, Lock, KeyRound, ArrowLeft,
  Upload, X, RefreshCw, Link as LinkIcon, Sparkles, ExternalLink
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import {
  CARD_3D_ANIMATION_CONFIG,
  computeCard3dTilt,
  getCard3dGlareBackground,
  getCard3dHoverShadow,
  getCard3dTransform,
  getCard3dTransition,
} from '../../utils/card3dAnimationConfig';

export interface ProofingItem {
  id: string;
  title: string;
  client: string;
  clientPhone?: string;
  status: 'progress' | 'review' | 'done' | 'pending_acc';
  isApproved?: boolean;
  approvedAt?: string;
  signerName?: string;
  coverImage?: string;
  proofingImages?: string[];
  proofingWatermarkStyle?: 'grid' | 'center' | 'bottom';
  proofingWatermarkTheme?: 'frosted' | 'gold' | 'crimson';
  createdAt: string;
  isPaid?: boolean;
  isPasswordProtected?: boolean;
  password?: string;
}

interface ProofingManagerProps {
  notify?: (msg: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  confirm?: (msg: string) => Promise<boolean>;
}

// Generate secure & unique ID for each file (e.g. PRF-m4k9a-7X2P)
const generateUniqueFileId = () => {
  const timePart = Date.now().toString(36).slice(-5).toUpperCase();
  const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PRF-${timePart}-${randPart}`;
};

/**
 * Interactive 3D Tilt Card Component for Proofing Klien
 * Minimalist, classy 3D hover physics with subtle specular light
 */
interface Interactive3DCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Interactive3DCard: React.FC<Interactive3DCardProps> = ({ children, className, style }) => {
  return (
    <div
      className={className}
      data-no-3d="true"
      style={{
        position: 'relative',
        borderRadius: 20,
        boxShadow: CARD_3D_ANIMATION_CONFIG.shadows.restDefault,
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const ProofingManager: React.FC<ProofingManagerProps> = ({ notify, confirm }) => {
  const [items, setItems] = useState<ProofingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'draft' | 'approved' | 'locked'>('all');
  
  // View Mode: 'list' (tabel/grid daftar) or 'editor' (layar penuh pembuatan/pengeditan)
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editor State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formFileId, setFormFileId] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formUrlInput, setFormUrlInput] = useState('');
  const [formIsPaid, setFormIsPaid] = useState(false);
  const [formWatermarkStyle, setFormWatermarkStyle] = useState<'grid' | 'center' | 'bottom'>('grid');
  const [formIsProtected, setFormIsProtected] = useState(false);
  const [formPassword, setFormPassword] = useState('');
  const [formSplitMode, setFormSplitMode] = useState<'carousel' | 'separate'>('carousel');
  const [copiedFileKey, setCopiedFileKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load items from porto_projects
  const loadItems = async () => {
    try {
      const stored = (await storage.getItem<any[]>('porto_projects', [])) || [];
      const valid = stored.filter(p => !p.isDeleted && !p.isTrash);
      setItems(valid);
    } catch (err) {
      console.error('Error loading proofing items:', err);
    }
  };

  useEffect(() => {
    loadItems();
    const unsub = storage.listenItem('porto_projects', () => {
      loadItems();
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchSearch = (item.title || '').toLowerCase().includes(q) ||
                          (item.client || '').toLowerCase().includes(q) ||
                          (item.id || '').toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (filterTab === 'draft') return !item.isApproved && item.status !== 'done';
      if (filterTab === 'approved') return item.isApproved || item.status === 'done';
      if (filterTab === 'locked') return item.isPasswordProtected === true;
      return true;
    });
  }, [items, searchQuery, filterTab]);

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const approved = items.filter(i => i.isApproved || i.status === 'done').length;
    const draft = total - approved;
    const locked = items.filter(i => i.isPasswordProtected === true).length;
    return { total, approved, draft, locked };
  }, [items]);

  // Generate 4-digit PIN
  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormPassword(pin);
    notify?.(`PIN acak digenerate: ${pin}`, 'info');
  };

  // Switch to Full Screen Editor (Bukan Pop Up)
  const handleOpenEditor = (itemToEdit?: ProofingItem) => {
    if (itemToEdit) {
      setEditingItemId(itemToEdit.id);
      setFormFileId(itemToEdit.id);
      setFormClient(itemToEdit.client || '');
      setFormPhone(itemToEdit.clientPhone || '');
      setFormTitle(itemToEdit.title || '');
      const imgs = itemToEdit.proofingImages && itemToEdit.proofingImages.length > 0
        ? itemToEdit.proofingImages
        : (itemToEdit.coverImage ? [itemToEdit.coverImage] : []);
      setFormImages(imgs);
      setFormIsPaid(itemToEdit.isPaid ?? (itemToEdit.status === 'done'));
      setFormWatermarkStyle(itemToEdit.proofingWatermarkStyle || 'grid');
      setFormIsProtected(Boolean(itemToEdit.isPasswordProtected));
      setFormPassword(itemToEdit.password || '');
      setFormSplitMode('carousel');
    } else {
      const newUniqueId = generateUniqueFileId();
      setEditingItemId(null);
      setFormFileId(newUniqueId);
      setFormClient('');
      setFormPhone('');
      setFormTitle('');
      setFormImages([]);
      setFormIsPaid(false);
      setFormWatermarkStyle('grid');
      setFormIsProtected(false);
      setFormPassword('');
      setFormSplitMode('carousel');
    }
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Upload files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    notify?.('Mengunggah gambar preview...', 'info');

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let uploadedUrl = '';
        try {
          uploadedUrl = await uploadToCloudinary(file);
        } catch {
          uploadedUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        if (uploadedUrl) newUrls.push(uploadedUrl);
      }

      if (newUrls.length > 0) {
        setFormImages(prev => [...prev, ...newUrls]);
        notify?.(`✨ ${newUrls.length} gambar berhasil ditambahkan!`, 'success');
      }
    } catch (err: any) {
      notify?.('Gagal unggah: ' + (err?.message || 'Error'), 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    if (!formUrlInput.trim()) return;
    setFormImages(prev => [...prev, formUrlInput.trim()]);
    setFormUrlInput('');
  };

  const handleRemoveFormImage = (idx: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      notify?.('Judul desain atau proyek wajib diisi!', 'warning');
      return;
    }

    if (formIsProtected && !formPassword.trim()) {
      notify?.('Masukkan PIN atau kata sandi proteksi!', 'warning');
      return;
    }

    const currentImages = formImages.length > 0
      ? formImages
      : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85'];

    if (editingItemId) {
      const updated = items.map(p => {
        if (p.id === editingItemId) {
          return {
            ...p,
            title: formTitle.trim(),
            client: formClient.trim() || 'Klien',
            clientPhone: formPhone.trim(),
            coverImage: currentImages[0],
            proofingImages: currentImages,
            proofingWatermarkStyle: formWatermarkStyle,
            isPaid: formIsPaid,
            isPasswordProtected: formIsProtected,
            password: formIsProtected ? formPassword.trim() : undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      setItems(updated);
      await storage.setItem('porto_projects', updated);
      notify?.('Perubahan berhasil disimpan!', 'success');
    } else {
      if (formSplitMode === 'separate' && currentImages.length > 1) {
        // Mode: Pisahkan jadi berkas mandiri (setiap file punya link unik sendiri)
        const newItems: ProofingItem[] = currentImages.map((img, idx) => ({
          id: generateUniqueFileId(),
          title: `${formTitle.trim()} (File ${idx + 1})`,
          client: formClient.trim() || 'Klien',
          clientPhone: formPhone.trim(),
          status: formIsPaid ? 'done' : 'progress',
          isPaid: formIsPaid,
          coverImage: img,
          proofingImages: [img],
          proofingWatermarkStyle: formWatermarkStyle,
          isPasswordProtected: formIsProtected,
          password: formIsProtected ? formPassword.trim() : undefined,
          createdAt: new Date().toISOString()
        }));
        const updated = [...newItems, ...items];
        setItems(updated);
        await storage.setItem('porto_projects', updated);
        notify?.(`✨ ${newItems.length} berkas proofing berhasil dibuat dengan link unik masing-masing!`, 'success');
      } else {
        const newItem: ProofingItem = {
          id: formFileId || generateUniqueFileId(),
          title: formTitle.trim(),
          client: formClient.trim() || 'Klien',
          clientPhone: formPhone.trim(),
          status: formIsPaid ? 'done' : 'progress',
          isPaid: formIsPaid,
          coverImage: currentImages[0],
          proofingImages: currentImages,
          proofingWatermarkStyle: formWatermarkStyle,
          isPasswordProtected: formIsProtected,
          password: formIsProtected ? formPassword.trim() : undefined,
          createdAt: new Date().toISOString()
        };
        const updated = [newItem, ...items];
        setItems(updated);
        await storage.setItem('porto_projects', updated);
        notify?.('✨ Berkas proofing baru berhasil dibuat!', 'success');
      }
    }

    setViewMode('list');
  };

  const handleDeleteItem = async (id: string) => {
    const ok = confirm ? await confirm('Hapus file proofing ini dari daftar?') : window.confirm('Hapus file proofing ini?');
    if (!ok) return;

    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    await storage.setItem('porto_projects', updated);
    notify?.('File proofing berhasil dihapus.', 'info');
  };

  const handleCopyLink = (item: ProofingItem) => {
    const link = `${window.location.origin}/proofing?id=${encodeURIComponent(item.id)}`;
    navigator.clipboard.writeText(link);
    setCopiedId(item.id);
    notify?.('Link unik berhasil disalin!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (item: ProofingItem) => {
    const link = `${window.location.origin}/proofing?id=${encodeURIComponent(item.id)}`;
    const clientName = item.client || 'Klien';
    const slideCount = Array.isArray(item.proofingImages) && item.proofingImages.length > 0 ? item.proofingImages.length : 1;
    
    let message = `Halo ${clientName}, preview desain untuk proyek *${item.title}* telah siap Anda tinjau!\n\nSilakan klik tautan unik berikut untuk melihat desain, menandai revisi, atau menyetujui (ACC):\n${link}`;
    
    if (slideCount > 1) {
      message += `\n*(Tautan memuat total ${slideCount} file/slide desain)*`;
    }

    // Auto-attach PIN if password protected
    if (item.isPasswordProtected && item.password) {
      message += `\n\n🔒 *PIN Akses Kanvas:* ${item.password}\n*(Gunakan PIN ini untuk membuka berkas)*`;
    }

    message += `\n\nTerima kasih! ✨`;

    const cleanPhone = (item.clientPhone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // ─────────────────────────────────────────────────────────────
  // 1. TAMPILAN FULL SCREEN STUDIO EDITOR (BUKAN POP UP)
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'editor') {
    const uniqueLink = `${window.location.origin}/proofing?id=${encodeURIComponent(formFileId)}`;

    return (
      <div 
        className="proofing-manager-root"
        style={{
          width: '100%',
          height: '100vh',
          maxHeight: '100vh',
          boxSizing: 'border-box',
          color: 'var(--cms-text)',
          background: 'var(--cms-bg, #070913)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Top Navigation Bar: FIXED AT TOP (TIDAK IKUT KE SCROLL) */}
        <div style={{
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--cms-bg, #070913)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '16px 36px',
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.08))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                color: 'var(--cms-text)',
                fontSize: 12.5,
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowLeft size={16} />
              <span>Kembali</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--cms-text)' }}>
                  {editingItemId ? 'Edit Berkas Proofing' : 'Kirim Desain Baru ke Klien'}
                </h1>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  LINK UNIK: {formFileId}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--cms-text-muted)' }}>
                Setiap berkas memiliki link unik tersendiri untuk klien yang berbeda
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid var(--glass-border)',
                background: 'transparent',
                color: 'var(--cms-text-muted)',
                fontSize: 12.5,
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={(e) => {
                const form = document.getElementById('proofing-editor-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 22px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 850,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)'
              }}
            >
              <span>Simpan & Siapkan Link</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body (Outer page gabisa di scroll) */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px 36px 36px',
          boxSizing: 'border-box'
        }}>
          {/* Live Unique Link Preview Banner */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: 14,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <LinkIcon size={16} color="#06b6d4" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#06b6d4' }}>
                  Tautan Unik Klien (Bebas Login 100%)
                </div>
                <div style={{ fontSize: 12.5, color: '#e2e8f0', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {uniqueLink}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(uniqueLink);
                notify?.('Link unik disalin!', 'success');
              }}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: '1px solid rgba(6, 182, 212, 0.4)',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Copy size={12} />
              <span>Salin Link</span>
            </button>
          </div>

          {/* 2-Column Full Screen Form */}
          <form id="proofing-editor-form" onSubmit={handleSaveItem}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28, alignItems: 'start' }}>
              
              {/* ── SISI KIRI: DATA KLIEN & KEAMANAN ── */}
              <div style={{
                background: 'var(--cms-card-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: 18,
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: 'var(--cms-shadow-sm)'
              }}>
                <div style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--cms-text)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
                  1. Data Klien & Proyek
                </div>

                {/* Client Name & Phone side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 5 }}>
                      Nama Klien *
                    </label>
                    <input
                      type="text"
                      required
                      value={formClient}
                      onChange={e => setFormClient(e.target.value)}
                      placeholder="Contoh: PT Harapan Jaya / Andi"
                      style={{
                        width: '100%',
                        height: 38,
                        borderRadius: 9,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--cms-input-bg)',
                        color: 'var(--cms-text)',
                        fontSize: 12.5,
                        padding: '0 12px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 5 }}>
                      Nomor WhatsApp Klien
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      style={{
                        width: '100%',
                        height: 38,
                        borderRadius: 9,
                        border: '1px solid var(--glass-border)',
                        background: 'var(--cms-input-bg)',
                        color: 'var(--cms-text)',
                        fontSize: 12.5,
                        padding: '0 12px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

              {/* Project Title */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--cms-text)', marginBottom: 6 }}>
                  Judul Desain / Proyek *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Contoh: Logo Branding & Brand Guideline"
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 10,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    padding: '0 14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 🔒 FITUR PROTEKSI PIN / SANDI */}
              <div style={{
                padding: 16,
                borderRadius: 14,
                background: formIsProtected ? 'rgba(236, 72, 153, 0.08)' : 'rgba(255,255,255,0.02)',
                border: formIsProtected ? '1.5px solid rgba(236, 72, 153, 0.4)' : '1px solid var(--glass-border)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Lock size={18} color={formIsProtected ? '#ec4899' : 'var(--cms-text-muted)'} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 850, color: formIsProtected ? '#ec4899' : 'var(--cms-text)' }}>
                        Kunci File dengan PIN / Sandi
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                        Hanya klien yang memiliki PIN yang dapat melihat kanvas
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !formIsProtected;
                      setFormIsProtected(next);
                      if (next && !formPassword) {
                        generateRandomPin();
                      }
                    }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 100,
                      border: 'none',
                      background: formIsProtected ? '#ec4899' : 'var(--cms-input-bg)',
                      color: formIsProtected ? '#fff' : 'var(--cms-text-muted)',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {formIsProtected ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {formIsProtected && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input
                      type="text"
                      required
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="Masukkan PIN / Sandi..."
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: 8,
                        border: '1px solid rgba(236, 72, 153, 0.4)',
                        background: '#090a14',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 850,
                        padding: '0 12px',
                        letterSpacing: '0.08em'
                      }}
                    />
                    <button
                      type="button"
                      onClick={generateRandomPin}
                      style={{
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(236, 72, 153, 0.4)',
                        background: 'rgba(236, 72, 153, 0.15)',
                        color: '#ec4899',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                      title="Generate PIN 4 Angka Acak"
                    >
                      <KeyRound size={13} />
                      <span>Acak PIN</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Status Pembayaran & Watermark */}
              <div style={{
                padding: 16,
                borderRadius: 14,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>Status Pembayaran</div>
                    <div style={{ fontSize: 11, color: 'var(--cms-text-muted)' }}>
                      {formIsPaid ? 'Lunas: Watermark otomatis dinonaktifkan' : 'Belum Lunas: Watermark aktif otomatis'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsPaid(!formIsPaid)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 100,
                      border: 'none',
                      background: formIsPaid ? '#10b981' : 'rgba(245, 158, 11, 0.2)',
                      color: formIsPaid ? '#fff' : '#f59e0b',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {formIsPaid ? '✓ Lunas' : '🛡️ Draft Belum Lunas'}
                  </button>
                </div>

                {!formIsPaid && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, marginTop: 10 }}>
                    <span style={{ color: 'var(--cms-text-muted)' }}>Gaya Watermark:</span>
                    {(['grid', 'center', 'bottom'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFormWatermarkStyle(st)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: formWatermarkStyle === st ? 'var(--cms-accent)' : 'var(--cms-card-bg)',
                          color: formWatermarkStyle === st ? '#fff' : 'var(--cms-text)',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {st === 'grid' ? 'Grid Diagonal' : st === 'center' ? 'Center Stamp' : 'Bottom Banner'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── SISI KANAN: UNGGAH GAMBAR MULTI-SLIDE & PREVIEW BESAR ── */}
            <div style={{
              background: 'var(--cms-card-bg)',
              border: '1.5px solid var(--glass-border)',
              borderRadius: 20,
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              boxShadow: 'var(--cms-shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--cms-text)' }}>
                  2. Gambar Visual ({formImages.length} Slide / File)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Pilihan Mode Simpan Jika Banyak File */}
              {formImages.length > 1 && !editingItemId && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1.5px solid rgba(6, 182, 212, 0.3)',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.1)'
                }}>
                  <div style={{ fontSize: 12.5, fontWeight: 850, color: '#06b6d4', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} />
                    <span>Format Pengiriman ({formImages.length} File Dipilih)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setFormSplitMode('carousel')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: formSplitMode === 'carousel' ? '2px solid #06b6d4' : '1px solid var(--glass-border)',
                        background: formSplitMode === 'carousel' ? 'rgba(6, 182, 212, 0.18)' : 'var(--cms-input-bg)',
                        color: formSplitMode === 'carousel' ? '#fff' : 'var(--cms-text-muted)',
                        fontSize: 12,
                        fontWeight: 750,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 850, color: formSplitMode === 'carousel' ? '#06b6d4' : 'var(--cms-text)' }}>
                        1 Proyek Carousel
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                        1 Link proyek memuat {formImages.length} slide
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormSplitMode('separate')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: formSplitMode === 'separate' ? '2px solid #06b6d4' : '1px solid var(--glass-border)',
                        background: formSplitMode === 'separate' ? 'rgba(6, 182, 212, 0.18)' : 'var(--cms-input-bg)',
                        color: formSplitMode === 'separate' ? '#fff' : 'var(--cms-text-muted)',
                        fontSize: 12,
                        fontWeight: 750,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 850, color: formSplitMode === 'separate' ? '#06b6d4' : 'var(--cms-text)' }}>
                        Link Unik Tiap File
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                        Buat {formImages.length} berkas terpisah ({formImages.length} link unik)
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Big Drag & Dropzone Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--glass-border)',
                  borderRadius: 16,
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Upload size={36} color="#06b6d4" style={{ margin: '0 auto 10px', opacity: 0.9 }} />
                <div style={{ fontSize: 14.5, fontWeight: 850, color: 'var(--cms-text)' }}>
                  {isUploading ? 'Sedang Mengunggah...' : 'Klik untuk Unggah Gambar dari Komputer'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                  Pilih 1 atau banyak gambar sekaligus (PNG, JPG, WebP)
                </div>
              </div>

              {/* Alternative URL Input */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="url"
                  value={formUrlInput}
                  onChange={e => setFormUrlInput(e.target.value)}
                  placeholder="Atau tempel link URL gambar langsung..."
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 10,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)',
                    color: 'var(--cms-text)',
                    fontSize: 12.5,
                    padding: '0 12px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  style={{
                    height: 40,
                    padding: '0 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--cms-accent)',
                    color: '#fff',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Tambah
                </button>
              </div>

              {/* Carousel Thumbnails Grid Preview (Lega & Besar) */}
              <div style={{
                borderRadius: 14,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)',
                padding: 16,
                minHeight: 180,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: 12,
                overflowY: 'auto',
                maxHeight: 360
              }}>
                {formImages.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)' }}>
                    <Layers size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <span style={{ fontSize: 12.5 }}>Belum ada gambar yang dipilih</span>
                  </div>
                ) : (
                  formImages.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        height: 110,
                        borderRadius: 10,
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1.5px solid var(--glass-border)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.35)'
                      }}
                    >
                      <img src={img} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveFormImage(idx)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.95)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                        title="Hapus Slide Ini"
                      >
                        <X size={12} />
                      </button>
                      <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 10, fontWeight: 900, background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const slideLink = `${window.location.origin}/proofing?id=${encodeURIComponent(formFileId)}&file=${idx + 1}`;
                          navigator.clipboard.writeText(slideLink);
                          notify?.(`Link unik File #${idx + 1} disalin!`, 'success');
                        }}
                        style={{
                          position: 'absolute',
                          bottom: 4,
                          right: 4,
                          height: 20,
                          padding: '0 6px',
                          borderRadius: 4,
                          background: 'rgba(6, 182, 212, 0.9)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 9.5,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                        title={`Salin tautan unik langsung ke File #${idx + 1}`}
                      >
                        <Copy size={10} />
                        <span>Link</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </form>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TAMPILAN LIST / DAFTAR BERKAS (STUDIO HUB PRO)
  // ─────────────────────────────────────────────────────────────
  return (
    <div 
      className="proofing-manager-root"
      style={{
        width: '100%',
        height: '100vh',
        maxHeight: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: 'var(--cms-text)',
        background: 'var(--cms-bg, #070913)'
      }}
    >
      <style>{`
        .proofing-top-header {
          flex-shrink: 0;
          background: var(--cms-bg, #070913);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 28px;
          border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.08));
        }
        .proofing-body-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 18px 28px 80px;
          box-sizing: border-box;
        }
        .proofing-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .proofing-card-thumb {
          height: 144px;
        }
        @media (max-width: 768px) {
          .proofing-top-header {
            display: none !important;
          }
          .proofing-body-scroll {
            padding: 12px 14px 96px !important;
          }
          .proofing-cards-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
            gap: 12px !important;
          }
          .proofing-card-thumb {
            height: 128px !important;
          }
          .proofing-mobile-add-btn {
            display: inline-flex !important;
          }
        }
        @media (min-width: 769px) {
          .proofing-mobile-add-btn {
            display: none !important;
          }
        }
      `}</style>

      {/* ── TOP HEADER (DESKTOP ONLY - DI MOBILE SUDAH ADA NAVBAR CMSDASHBOARD) ── */}
      <div className="proofing-top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))',
            border: '1.5px solid rgba(6, 182, 212, 0.4)',
            color: '#06b6d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--cms-text)', whiteSpace: 'nowrap' }}>
                Proofing Klien
              </h1>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.3)', whiteSpace: 'nowrap' }}>
                PRO
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--cms-text-muted)' }}>
              Link unik klien, PIN keamanan & watermark
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenEditor()}
          title="Kirim Desain"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 850,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
            transition: 'all 0.18s ease'
          }}
        >
          <Plus size={15} strokeWidth={2.8} />
          <span>Desain</span>
        </button>
      </div>

      {/* ── SCROLLABLE INTERNAL CONTENT BODY ── */}
      <div className="proofing-body-scroll">

      {/* ── STATS COUNTER BAR ── */}
      <div className="cms-stats-grid-compact" style={{ marginBottom: 20 }}>
        <div style={{
          background: 'var(--cms-card-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--cms-shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text-muted)', whiteSpace: 'nowrap' }}>Total Berkas</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--cms-text)', marginTop: 2 }}>{stats.total}</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layers size={18} color="var(--cms-text)" style={{ opacity: 0.7 }} />
          </div>
        </div>

        <div style={{
          background: 'var(--cms-card-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--cms-shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: '#f59e0b', whiteSpace: 'nowrap' }}>Draft</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b', marginTop: 2 }}>{stats.draft}</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={18} color="#f59e0b" />
          </div>
        </div>

        <div style={{
          background: 'var(--cms-card-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--cms-shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: '#10b981', whiteSpace: 'nowrap' }}>Disetujui</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', marginTop: 2 }}>{stats.approved}</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check size={18} color="#10b981" />
          </div>
        </div>

        <div style={{
          background: 'var(--cms-card-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--cms-shadow-sm)'
        }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 750, color: '#ec4899', whiteSpace: 'nowrap' }}>Terkunci</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ec4899', marginTop: 2 }}>{stats.locked}</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={18} color="#ec4899" />
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16
      }}>
        {/* Filter Tabs + Mobile Add CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 300px', minWidth: 0 }}>
          <div
            className="cms-segmented-tabs"
            style={{
              background: 'var(--cms-input-bg)',
              border: '1px solid var(--glass-border)',
              flex: 1,
              height: 40,
              boxSizing: 'border-box',
              padding: 4
            }}
          >
            {([
              { id: 'all', label: 'Semua', icon: Layers },
              { id: 'draft', label: 'Draft', icon: ShieldCheck },
              { id: 'approved', label: 'ACC', icon: Check },
              { id: 'locked', label: 'PIN', icon: Lock }
            ] as const).map(tab => {
              const IconComp = tab.icon;
              const isActive = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  title={tab.label}
                  style={{
                    flex: 1,
                    height: '100%',
                    padding: '0 8px',
                    borderRadius: 8,
                    border: 'none',
                    background: isActive ? 'var(--cms-card-bg)' : 'transparent',
                    color: isActive ? 'var(--cms-text)' : 'var(--cms-text-muted)',
                    fontSize: 11.5,
                    fontWeight: 750,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? 'var(--cms-shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComp size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleOpenEditor()}
            title="Tambah Desain"
            className="proofing-mobile-add-btn"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)'
            }}
          >
            <Plus size={17} strokeWidth={2.8} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{
          position: 'relative',
          flex: '1 1 240px',
          minWidth: 220,
          width: '100%'
        }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama klien, judul, atau ID..."
            style={{
              width: '100%',
              height: 40,
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'var(--cms-input-bg)',
              color: 'var(--cms-text)',
              fontSize: 12.5,
              padding: '0 14px 0 38px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ── CARDS GRID ── */}
      {filteredItems.length === 0 ? (
        <div style={{
          background: 'var(--cms-card-bg)',
          border: '1px dashed var(--glass-border)',
          borderRadius: 20,
          padding: '80px 20px',
          textAlign: 'center',
          color: 'var(--cms-text-muted)'
        }}>
          <ShieldCheck size={52} style={{ margin: '0 auto 14px', opacity: 0.3, color: '#06b6d4' }} />
          <div style={{ fontSize: 17, fontWeight: 850, color: 'var(--cms-text)' }}>
            Belum Ada File Proofing
          </div>
          <p style={{ margin: '8px 0 20px', fontSize: 13, color: 'var(--cms-text-muted)' }}>
            Mulai kirimkan desain pertama Anda dengan link unik dan proteksi watermark.
          </p>
          <button
            type="button"
            onClick={() => handleOpenEditor()}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--cms-accent)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            + Buat Kiriman Pertama
          </button>
        </div>
      ) : (
        <div className="proofing-cards-grid">
          {filteredItems.map(item => {
            const isApproved = item.isApproved || item.status === 'done';
            const slideCount = Array.isArray(item.proofingImages) && item.proofingImages.length > 0 
              ? item.proofingImages.length 
              : 1;
            const thumbUrl = (item.proofingImages && item.proofingImages[0]) || item.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85';

            return (
              <Interactive3DCard
                key={item.id}
                style={{
                  background: 'var(--cms-card-bg)',
                  border: '1px solid var(--glass-border, rgba(255,255,255,0.09))',
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Image Preview Header */}
                <div
                  className="proofing-card-thumb"
                  style={{
                    position: 'relative',
                    background: '#090a11',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={thumbUrl}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.9
                    }}
                  />

                  {/* Badges on preview */}
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: isApproved ? 'rgba(16, 185, 129, 0.95)' : 'rgba(245, 158, 11, 0.95)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}>
                      {isApproved ? '✓ ACC' : 'Draft'}
                    </span>

                    {item.isPasswordProtected && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 9px',
                        borderRadius: 8,
                        background: 'rgba(236, 72, 153, 0.95)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                      }}>
                        <Lock size={12} /> {item.password ? `PIN ${item.password}` : 'Kunci'}
                      </span>
                    )}

                    {slideCount > 1 && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 9px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.75)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Layers size={12} /> {slideCount} Slide
                      </span>
                    )}
                  </div>

                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.75)',
                      color: '#cbd5e1'
                    }}>
                      {item.id}
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 16, fontWeight: 850, color: 'var(--cms-text)', lineHeight: 1.35, marginBottom: 6 }}>
                    {item.title}
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--cms-text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span>Klien: <strong style={{ color: 'var(--cms-text)' }}>{item.client || 'Klien Studio'}</strong></span>
                    {item.clientPhone && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#38bdf8' }}>
                          <Phone size={12} /> {item.clientPhone}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Direct Link Preview Bar */}
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'rgba(6, 182, 212, 0.06)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <LinkIcon size={12} color="#06b6d4" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: '#38bdf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        /proofing?id={item.id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item)}
                      style={{
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: 'none',
                        borderRadius: 6,
                        color: copiedId === item.id ? '#10b981' : '#06b6d4',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: 10.5,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0
                      }}
                      title="Salin Tautan Unik Utama"
                    >
                      {copiedId === item.id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      <span>{copiedId === item.id ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>

                  {/* Multi-Slide Per-File Direct Links */}
                  {slideCount > 1 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 750, color: 'var(--cms-text-muted)', marginBottom: 6 }}>
                        Tautan Langsung per File ({slideCount} file):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(item.proofingImages || []).map((_, slideIdx) => {
                          const slideKey = `${item.id}_${slideIdx + 1}`;
                          const isThisCopied = copiedFileKey === slideKey;
                          return (
                            <button
                              key={slideIdx}
                              type="button"
                              onClick={() => {
                                const slideLink = `${window.location.origin}/proofing?id=${encodeURIComponent(item.id)}&file=${slideIdx + 1}`;
                                navigator.clipboard.writeText(slideLink);
                                setCopiedFileKey(slideKey);
                                notify?.(`Tautan File #${slideIdx + 1} tersalin!`, 'success');
                                setTimeout(() => setCopiedFileKey(null), 2000);
                              }}
                              style={{
                                padding: '4px 9px',
                                borderRadius: 6,
                                border: isThisCopied ? '1px solid #10b981' : '1px solid var(--glass-border)',
                                background: isThisCopied ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-input-bg)',
                                color: isThisCopied ? '#10b981' : 'var(--cms-text)',
                                fontSize: 11,
                                fontWeight: 750,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.15s ease'
                              }}
                              title={`Salin tautan unik untuk File #${slideIdx + 1}`}
                            >
                              {isThisCopied ? <Check size={11} color="#10b981" /> : <LinkIcon size={11} />}
                              <span>File #{slideIdx + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions Grid */}
                  <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item)}
                        style={{
                          height: 36,
                          padding: '0 12px',
                          borderRadius: 8,
                          border: '1px solid var(--glass-border)',
                          background: 'var(--cms-input-bg)',
                          color: copiedId === item.id ? '#10b981' : 'var(--cms-text)',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        title="Salin Link Kanvas Klien"
                      >
                        {copiedId === item.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copiedId === item.id ? 'Tersalin' : 'Salin'}</span>
                      </button>

                      {/* WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(item)}
                        style={{
                          height: 36,
                          padding: '0 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#25D366',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 10px rgba(37, 211, 102, 0.35)'
                        }}
                        title="Kirim link ke WhatsApp klien"
                      >
                        <MessageSquare size={14} />
                        <span>WA</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Open Fullscreen Canvas */}
                      <button
                        type="button"
                        onClick={() => {
                          const link = `/proofing?id=${encodeURIComponent(item.id)}`;
                          window.open(link, '_blank');
                        }}
                        style={{
                          height: 36,
                          width: 36,
                          borderRadius: 8,
                          border: '1px solid var(--glass-border)',
                          background: 'var(--cms-input-bg)',
                          color: 'var(--cms-text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Buka Kanvas Review Klien"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Edit Button (Buka Layar Penuh) */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditor(item)}
                        style={{
                          height: 36,
                          width: 36,
                          borderRadius: 8,
                          border: '1px solid var(--glass-border)',
                          background: 'var(--cms-input-bg)',
                          color: 'var(--cms-text)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Edit Berkas / Tambah Gambar / Atur Sandi"
                      >
                        <Layers size={15} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        style={{
                          height: 36,
                          width: 36,
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Hapus File"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </Interactive3DCard>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default ProofingManager;
