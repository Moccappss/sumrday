import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Phone, Mail, Globe, CreditCard, QrCode, Save, CheckCircle2,
  ExternalLink, Plus, Trash2, Sparkles, Image as ImageIcon, Clock, MapPin,
  Share2, AlertCircle, Copy, Check, MessageSquare, ArrowRight, Eye, RefreshCw,
  Upload, Link2, ChevronDown, ChevronUp, Loader2, X, ShieldCheck
} from 'lucide-react';
import { useBusinessProfile, formatWhatsAppNumber, buildSocialUrl } from '../../hooks/useBusinessProfile';
import { BusinessProfile, BankAccount, DEFAULT_BUSINESS_PROFILE } from '../../types/businessProfile';
import { uploadToCloudinary } from '../../utils/cloudinary';
import MediaGalleryModal from './MediaGalleryModal';
import InfoTooltip from './InfoTooltip';
import { useDialog } from './DialogProvider';

const BANK_PRESETS = [
  { name: 'BCA', color: '#003399' },
  { name: 'Mandiri', color: '#002d62' },
  { name: 'BRI', color: '#00529c' },
  { name: 'BNI', color: '#f15a24' },
  { name: 'Bank Jago', color: '#8a2be2' },
  { name: 'SeaBank', color: '#ff5722' },
  { name: 'BSI', color: '#00a39d' },
  { name: 'DANA', color: '#118eea' },
  { name: 'GoPay', color: '#00aa13' },
  { name: 'OVO', color: '#4c2a86' },
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', prefix: '@', placeholder: 'sumrday.studio' },
  { id: 'tiktok', name: 'TikTok', prefix: '@', placeholder: 'sumrday.studio' },
  { id: 'youtube', name: 'YouTube', prefix: '@', placeholder: 'sumrday' },
  { id: 'linkedin', name: 'LinkedIn', prefix: 'in/', placeholder: 'sumrday' },
  { id: 'twitter', name: 'X / Twitter', prefix: '@', placeholder: 'sumrday' },
  { id: 'facebook', name: 'Facebook', prefix: '/', placeholder: 'sumrday' },
  { id: 'github', name: 'GitHub', prefix: '/', placeholder: 'sumrday' },
  { id: 'telegram', name: 'Telegram', prefix: '@', placeholder: 'sumrdayadmin' },
  { id: 'discord', name: 'Discord', prefix: 'gg/', placeholder: 'invite' },
  { id: 'threads', name: 'Threads', prefix: '@', placeholder: 'sumrday.studio' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 🌟 MINIMALIST CLOUDINARY MEDIA PICKER (1-3 WORDS TEXT & TOOLTIPS)
// ─────────────────────────────────────────────────────────────────────────────
interface CloudinaryMediaPickerProps {
  label: string;
  tooltip?: string;
  value: string;
  onChange: (url: string) => void;
  onOpenGallery: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
  aspectRatio?: 'square' | 'auto';
}

function CloudinaryMediaPicker({
  label,
  tooltip,
  value,
  onChange,
  onOpenGallery,
  notify,
  aspectRatio = 'square'
}: CloudinaryMediaPickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Format gambar salah', 'error');
      return;
    }

    setIsUploading(true);
    try {
      notify('Mengunggah gambar...');
      const res = await uploadToCloudinary(file, 'image');
      if (res && res.url) {
        onChange(res.url);
        notify('Gambar berhasil diunggah', 'success');
      } else {
        notify('Gagal unggah gambar', 'error');
      }
    } catch (err: any) {
      console.error('[Cloudinary Upload Error]', err);
      notify('Gagal unggah Cloudinary', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCopyUrl = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isCloudinary = value && (value.includes('cloudinary.com') || value.includes('res.cloudinary.com'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </label>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        {isCloudinary && (
          <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 6px', borderRadius: 6 }}>
            Cloudinary CDN
          </span>
        )}
      </div>

      {value ? (
        <div style={{
          background: 'var(--cms-input-bg)',
          borderRadius: 14,
          border: '1px solid var(--glass-border)',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              width: aspectRatio === 'square' ? 64 : 88,
              height: 64,
              borderRadius: 10,
              background: '#0a0a0f',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <img
                src={value}
                alt={label}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="cms-btn cms-btn-primary"
                  style={{ height: 30, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {isUploading ? <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={11} />}
                  <span>{isUploading ? 'Mengunggah...' : 'Ganti'}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenGallery}
                  className="cms-btn"
                  style={{ height: 30, padding: '0 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <ImageIcon size={11} /> Galeri
                </button>

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="cms-btn"
                  style={{ height: 30, padding: '0 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'transparent', border: '1px solid var(--glass-border)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="cms-btn"
                  style={{ height: 30, padding: '0 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Trash2 size={11} /> Hapus
                </button>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 6 }}>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', fontSize: 10.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, padding: 0, fontWeight: 600 }}
            >
              <Link2 size={10} /> {showUrlInput ? 'Tutup Tautan' : 'Tautan Manual'}
            </button>

            {showUrlInput && (
              <div style={{ marginTop: 6 }}>
                <input
                  type="text"
                  className="cms-input"
                  style={{ height: 32, borderRadius: 8, width: '100%', fontSize: 11, fontFamily: 'monospace' }}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          style={{
            background: isDragging ? 'rgba(var(--cms-accent-rgb, 124, 58, 237), 0.08)' : 'var(--cms-input-bg)',
            borderRadius: 14,
            border: `1.5px dashed ${isDragging ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
            padding: '14px 12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
              fileInputRef.current?.click();
            }
          }}
        >
          {isUploading ? (
            <div style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--cms-accent)' }} />
              <span style={{ fontSize: 11.5, fontWeight: 800 }}>Mengunggah...</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="cms-btn cms-btn-primary"
                  style={{ height: 32, padding: '0 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Upload size={12} /> Unggah File
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGallery();
                  }}
                  className="cms-btn"
                  style={{ height: 32, padding: '0 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, background: 'var(--cms-switcher-bg)', border: '1px solid var(--glass-border)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <ImageIcon size={12} /> Galeri Cloud
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUrlInput(!showUrlInput);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', fontSize: 10.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, padding: 0, fontWeight: 600 }}
                >
                  <Link2 size={10} /> {showUrlInput ? 'Tutup Tautan' : 'Tautan Manual'}
                </button>

                {showUrlInput && (
                  <div style={{ marginTop: 6, width: '100%', maxWidth: 300 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className="cms-input"
                      style={{ height: 30, borderRadius: 8, width: '100%', fontSize: 11 }}
                      placeholder="https://..."
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 🚀 MASTER BUSINESS PROFILE MANAGER
// ─────────────────────────────────────────────────────────────────────────────
interface BusinessProfileManagerProps {
  notify?: (msg: string, type?: 'success' | 'error') => void;
}

export default function BusinessProfileManager({ notify = () => {} }: BusinessProfileManagerProps) {
  const { profile: storedProfile, loading, updateProfile } = useBusinessProfile();
  const { showConfirm } = useDialog();

  const [form, setForm] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [activeCategory, setActiveCategory] = useState<'all' | 'brand' | 'contact' | 'socials' | 'banking'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState<'logo' | 'qris' | null>(null);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);

  useEffect(() => {
    if (storedProfile) {
      setForm(storedProfile);
    }
  }, [storedProfile]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...(prev as any)[keys[0]],
            [keys[1]]: value
          }
        };
      }
      return prev;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(form);
      setHasChanges(false);
      notify('Profil bisnis tersimpan', 'success');
    } catch (err) {
      console.error(err);
      notify('Gagal menyimpan profil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBank = (presetName: string = 'BCA') => {
    const preset = BANK_PRESETS.find(p => p.name === presetName) || BANK_PRESETS[0];
    const newBank: BankAccount = {
      id: `bank_${Date.now()}`,
      bankName: preset.name,
      accountNumber: '',
      accountName: form.brandName || 'ADMIN',
      color: preset.color
    };
    handleChange('bankAccounts', [...(form.bankAccounts || []), newBank]);
  };

  const handleRemoveBank = async (id: string) => {
    if (await showConfirm('Hapus rekening ini?')) {
      handleChange('bankAccounts', (form.bankAccounts || []).filter(b => b.id !== id));
    }
  };

  const updateBank = (id: string, field: keyof BankAccount, val: any) => {
    const updated = (form.bankAccounts || []).map(b => {
      if (b.id !== id) return b;
      const patch = { ...b, [field]: val };
      if (field === 'bankName') {
        const found = BANK_PRESETS.find(p => p.name.toLowerCase() === String(val).toLowerCase());
        if (found) patch.color = found.color;
      }
      return patch;
    });
    handleChange('bankAccounts', updated);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankId(id);
    setTimeout(() => setCopiedBankId(null), 1500);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--cms-text-muted)' }}>
        <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
        <div style={{ fontSize: 12 }}>Memuat Data...</div>
      </div>
    );
  }

  const cleanWa = formatWhatsAppNumber(form.whatsapp);
  const waTestUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(`Halo ${form.brandName || 'Admin'}`)}`;

  return (
    <div className="bpm-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── RESPONSIVE MINIMALIST CSS ── */}
      <style>{`
        .bpm-container {
          width: 100%;
          min-height: 100%;
          box-sizing: border-box;
          padding: 24px 24px 80px;
        }
        @media (max-width: 768px) {
          .bpm-container {
            padding: 16px 16px 90px;
          }
        }
        .bpm-inner-wrap {
          max-width: 1160px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .bpm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          background: var(--cms-panel-bg);
          padding: 16px 20px;
          border-radius: 20px;
          border: 1px solid var(--glass-border);
        }
        .bpm-pills {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .bpm-pills::-webkit-scrollbar {
          display: none;
        }
        .bpm-pill-btn {
          flex-shrink: 0;
          white-space: nowrap;
          height: 36px;
          padding: 0 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bpm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
          gap: 12px;
        }
        .bpm-grid-full {
          grid-column: 1 / -1;
        }
        .bpm-bank-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
          gap: 12px;
        }
        .bpm-qris-box {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 16px;
        }
        .bpm-sticky-save {
          position: fixed;
          bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          left: 12px;
          right: 12px;
          max-width: 440px;
          margin: 0 auto;
          background: var(--cms-panel-bg);
          border: 1.5px solid var(--cms-accent);
          border-radius: 16px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          box-shadow: 0 16px 36px rgba(0,0,0,0.4);
          backdrop-filter: blur(16px);
          z-index: 9999;
          animation: cmsPopIn 0.25s ease;
        }

        @media (max-width: 640px) {
          .bpm-header {
            padding: 14px 16px;
          }
          .bpm-header-btn {
            width: 100%;
            justify-content: center;
          }
          .bpm-qris-box {
            grid-template-columns: 1fr;
          }
          .bpm-sticky-save {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
            padding: 12px;
          }
          .bpm-sticky-save button {
            width: 100%;
            height: 38px;
            justify-content: center;
          }
        }
      `}</style>

      <div className="bpm-inner-wrap">
        {/* ── TOP HEADER (MINIMAL 1-3 WORDS) ── */}
        <div className="bpm-header">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 100, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: 10.5, fontWeight: 800, marginBottom: 6 }}>
            <CheckCircle2 size={12} /> Data Terpusat
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: 'var(--cms-text)', letterSpacing: '-0.02em' }}>
              Bisnis & Kontak
            </h1>
            <InfoTooltip content="Satu data untuk seluruh WhatsApp, Email, Sosmed, Logo, Rekening, dan QRIS yang otomatis terhubung ke Katalog, Checkout, Nota, dan Footer." />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="cms-btn cms-btn-primary bpm-header-btn"
          style={{ borderRadius: 100, padding: '0 20px', height: 38, fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {isSaving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
          <span>{isSaving ? 'Menyimpan...' : (hasChanges ? 'Simpan Data' : 'Tersimpan')}</span>
        </button>
      </div>

      {/* ── CATEGORY PILLS (1-3 WORDS) ── */}
      <div className="bpm-pills">
        {[
          { id: 'all', label: 'Semua', icon: <Sparkles size={13} /> },
          { id: 'brand', label: 'Identitas', icon: <Building2 size={13} /> },
          { id: 'contact', label: 'Kontak', icon: <Phone size={13} /> },
          { id: 'socials', label: 'Sosial Media', icon: <Share2 size={13} /> },
          { id: 'banking', label: 'Rekening & QRIS', icon: <CreditCard size={13} /> },
        ].map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className="bpm-pill-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                border: `1px solid ${isActive ? 'var(--cms-accent)' : 'var(--glass-border)'}`,
                background: isActive ? 'var(--cms-accent)' : 'var(--cms-panel-bg)',
                color: isActive ? '#fff' : 'var(--cms-text)'
              }}
            >
              {cat.icon} {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── CATEGORY 1: IDENTITAS BRAND ── */}
      {(activeCategory === 'all' || activeCategory === 'brand') && (
        <div className="cms-card premium-glass" style={{ padding: 'clamp(14px, 2.5vw, 20px)', borderRadius: 20, border: '1px solid var(--glass-border)', background: 'var(--cms-panel-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' }}>
            <Building2 size={16} color="var(--cms-accent)" />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Identitas Brand</h2>
            <InfoTooltip content="Nama brand dan profil untuk header website, footer, dan nota transaksi." />
          </div>

          <div className="bpm-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Nama Brand</label>
                <InfoTooltip content="Nama resmi toko atau brand usaha Anda." />
              </div>
              <input
                type="text"
                className="cms-input"
                style={{ height: 38, borderRadius: 10, width: '100%', fontSize: 13, fontWeight: 700 }}
                placeholder="sumr.day | Creative Digital Studio"
                value={form.brandName || ''}
                onChange={e => handleChange('brandName', e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Tagline</label>
                <InfoTooltip content="Slogan singkat bisnis Anda." />
              </div>
              <input
                type="text"
                className="cms-input"
                style={{ height: 38, borderRadius: 10, width: '100%', fontSize: 13 }}
                placeholder="Digital Studio & Games"
                value={form.tagline || ''}
                onChange={e => handleChange('tagline', e.target.value)}
              />
            </div>

            <div className="bpm-grid-full">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Deskripsi</label>
                <InfoTooltip content="Deskripsi singkat usaha untuk footer dan bio link." />
              </div>
              <textarea
                className="cms-input"
                rows={2}
                style={{ borderRadius: 10, width: '100%', fontSize: 12.5, padding: 10, resize: 'vertical' }}
                placeholder="Deskripsi singkat usaha..."
                value={form.description || ''}
                onChange={e => handleChange('description', e.target.value)}
              />
            </div>

            <div className="bpm-grid-full">
              <CloudinaryMediaPicker
                label="Logo Brand"
                tooltip="Logo resmi untuk header, favicon, dan nota. Terintegrasi langsung dengan Cloudinary CDN."
                value={form.logoUrl || ''}
                onChange={(url) => handleChange('logoUrl', url)}
                onOpenGallery={() => setShowMediaModal('logo')}
                notify={notify}
                aspectRatio="square"
              />
            </div>

            <div className="bpm-grid-full">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Domain</label>
                <InfoTooltip content="Alamat website utama Anda." />
              </div>
              <input
                type="text"
                className="cms-input"
                style={{ height: 38, borderRadius: 10, width: '100%', fontSize: 13 }}
                placeholder="https://sumrday.web.app"
                value={form.websiteUrl || ''}
                onChange={e => handleChange('websiteUrl', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY 2: KONTAK TERPADU ── */}
      {(activeCategory === 'all' || activeCategory === 'contact') && (
        <div className="cms-card premium-glass" style={{ padding: 'clamp(14px, 2.5vw, 20px)', borderRadius: 20, border: '1px solid var(--glass-border)', background: 'var(--cms-panel-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' }}>
            <Phone size={16} color="#25d366" />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Kontak Terpadu</h2>
            <InfoTooltip content="Nomor WhatsApp dan email untuk menerima pesanan checkout katalog, booking game, dan form kontak." />
          </div>

          <div className="bpm-grid">
            {/* WhatsApp Utama */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>WhatsApp Utama</label>
                  <InfoTooltip content="Nomor WhatsApp penerima order katalog. Format 08xx otomatis diubah ke 628xx." />
                </div>
                {cleanWa && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#25d366' }}>+{cleanWa}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  className="cms-input"
                  style={{ height: 38, borderRadius: 10, flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800 }}
                  placeholder="081234567890"
                  value={form.whatsapp || ''}
                  onChange={e => handleChange('whatsapp', e.target.value)}
                />
                {cleanWa && (
                  <a
                    href={waTestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cms-btn"
                    style={{ height: 38, padding: '0 10px', borderRadius: 10, background: 'rgba(37, 211, 102, 0.15)', color: '#25d366', border: '1px solid rgba(37, 211, 102, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}
                  >
                    <ExternalLink size={12} /> Tes Chat
                  </a>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Email Bisnis</label>
                <InfoTooltip content="Email resmi untuk kontak dan footer." />
              </div>
              <input
                type="email"
                className="cms-input"
                style={{ height: 38, borderRadius: 10, width: '100%', fontSize: 13 }}
                placeholder="hi.sumrday@gmail.com"
                value={form.email || ''}
                onChange={e => handleChange('email', e.target.value)}
              />
            </div>

            {/* WA CS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>WhatsApp CS</label>
                <InfoTooltip content="Nomor alternatif customer service jika WA utama sibuk." />
              </div>
              <input
                type="text"
                className="cms-input"
                style={{ height: 38, borderRadius: 10, width: '100%', fontSize: 13 }}
                placeholder="081987654321"
                value={form.whatsappAlt || ''}
                onChange={e => handleChange('whatsappAlt', e.target.value)}
              />
            </div>

            {/* Jam Operasional */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Jam Buka</label>
                <InfoTooltip content="Jadwal jam buka toko atau kantor." />
              </div>
              <input
                type="text"
                className="cms-input"
                style={{ height: 38, borderRadius: 10, width: '100%', fontSize: 13 }}
                placeholder="08.00 - 21.00 WIB"
                value={form.operatingHours || ''}
                onChange={e => handleChange('operatingHours', e.target.value)}
              />
            </div>

            {/* Alamat */}
            <div className="bpm-grid-full">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Alamat Studio</label>
                <InfoTooltip content="Alamat fisik studio yang tampil di nota dan footer." />
              </div>
              <input
                type="text"
                className="cms-input"
                style={{ height: 38, borderRadius: 10, width: '100%', fontSize: 13 }}
                placeholder="Jl. Pemuda Kreatif No. 88, Jakarta"
                value={form.address || ''}
                onChange={e => handleChange('address', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORY 3: SOSIAL MEDIA ── */}
      {(activeCategory === 'all' || activeCategory === 'socials') && (
        <div className="cms-card premium-glass" style={{ padding: 'clamp(14px, 2.5vw, 20px)', borderRadius: 20, border: '1px solid var(--glass-border)', background: 'var(--cms-panel-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' }}>
            <Share2 size={16} color="#ec4899" />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Sosial Media</h2>
            <InfoTooltip content="Ketik username akun. Tautan lengkap otomatis terpasang di footer dan profil bio." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 10 }}>
            {SOCIAL_PLATFORMS.map(p => {
              const val = (form.socials as any)?.[p.id] || '';
              const testUrl = buildSocialUrl(p.id, val);

              return (
                <div key={p.id} style={{ background: 'var(--cms-input-bg)', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--cms-text)' }}>{p.name}</span>
                    {val && (
                      <a
                        href={testUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 10.5, color: 'var(--cms-accent)', display: 'inline-flex', alignItems: 'center', gap: 2, textDecoration: 'none', fontWeight: 700 }}
                      >
                        <ExternalLink size={10} /> Tes
                      </a>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cms-text-muted)' }}>{p.prefix}</span>
                    <input
                      type="text"
                      className="cms-input"
                      style={{ height: 30, borderRadius: 6, fontSize: 11.5, flex: 1, minWidth: 0, padding: '0 6px' }}
                      placeholder={p.placeholder}
                      value={val}
                      onChange={e => handleChange(`socials.${p.id}`, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CATEGORY 4: REKENING & QRIS ── */}
      {(activeCategory === 'all' || activeCategory === 'banking') && (
        <div className="cms-card premium-glass" style={{ padding: 'clamp(14px, 2.5vw, 20px)', borderRadius: 20, border: '1px solid var(--glass-border)', background: 'var(--cms-panel-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={16} color="#f59e0b" />
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--cms-text)' }}>Rekening & QRIS</h2>
              <InfoTooltip content="Metode pembayaran langsung bebas biaya admin (0% MDR). Pembeli transfer bank atau scan QRIS." />
            </div>

            <button
              type="button"
              onClick={() => handleAddBank('BCA')}
              className="cms-btn"
              style={{ borderRadius: 100, padding: '0 14px', height: 32, fontSize: 11.5, fontWeight: 800, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={13} /> Tambah Rekening
            </button>
          </div>

          {/* Quick Bank Presets */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Pilihan Cepat:</span>
              <InfoTooltip content="Klik nama bank di bawah untuk langsung menambahkan rekening baru." />
            </div>
            <div style={{ display: 'flex', gap: 5, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
              {BANK_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddBank(preset.name)}
                  style={{
                    padding: '4px 10px', borderRadius: 8, border: '1px solid var(--glass-border)',
                    background: 'var(--cms-input-bg)', color: 'var(--cms-text)', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0
                  }}
                >
                  <Plus size={10} color={preset.color} /> {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Bank Cards Grid */}
          <div className="bpm-bank-grid" style={{ marginBottom: 20 }}>
            {(form.bankAccounts || []).map((bank, index) => {
              const isCopied = copiedBankId === bank.id;
              return (
                <div
                  key={bank.id}
                  style={{
                    background: 'var(--cms-input-bg)',
                    borderRadius: 14,
                    padding: 12,
                    border: '1px solid var(--glass-border)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: bank.color || '#4338ca', color: '#fff', fontSize: 10.5, fontWeight: 900 }}>
                        {bank.bankName || 'BANK'}
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--cms-text-muted)' }}>#{index + 1}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBank(bank.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px', gap: 6 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Nama Bank</label>
                        <input
                          type="text"
                          className="cms-input"
                          style={{ height: 32, borderRadius: 8, width: '100%', fontSize: 11.5, fontWeight: 700 }}
                          placeholder="BCA / Mandiri"
                          value={bank.bankName}
                          onChange={e => updateBank(bank.id, 'bankName', e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Warna</label>
                        <input
                          type="color"
                          style={{ height: 32, width: '100%', borderRadius: 8, border: '1px solid var(--glass-border)', padding: 1, background: 'transparent', cursor: 'pointer' }}
                          value={bank.color || '#003399'}
                          onChange={e => updateBank(bank.id, 'color', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <label style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Nomor Rekening</label>
                        {bank.accountNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopy(bank.id, bank.accountNumber)}
                            style={{ background: 'transparent', border: 'none', color: isCopied ? '#10b981' : 'var(--cms-accent)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 700 }}
                          >
                            {isCopied ? <Check size={10} /> : <Copy size={10} />} {isCopied ? 'Tersalin' : 'Salin'}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        className="cms-input"
                        style={{ height: 34, borderRadius: 8, width: '100%', fontSize: 13, fontWeight: 800, fontFamily: 'monospace' }}
                        placeholder="1234567890"
                        value={bank.accountNumber}
                        onChange={e => updateBank(bank.id, 'accountNumber', e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Atas Nama</label>
                      <input
                        type="text"
                        className="cms-input"
                        style={{ height: 32, borderRadius: 8, width: '100%', fontSize: 11.5, fontWeight: 700 }}
                        placeholder="NAMA PEMILIK"
                        value={bank.accountName}
                        onChange={e => updateBank(bank.id, 'accountName', e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── QRIS TOKO SECTION ── */}
          <div className="bpm-qris-box" style={{ background: 'var(--cms-input-bg)', padding: 14, borderRadius: 16, border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <QrCode size={16} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>QRIS Toko</h3>
                <InfoTooltip content="Scan via BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, DANA tanpa biaya MDR." />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <label style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Nama Merchant</label>
                  <InfoTooltip content="Nama merchant resmi yang terdaftar pada QRIS Anda." />
                </div>
                <input
                  type="text"
                  className="cms-input"
                  style={{ height: 34, borderRadius: 8, width: '100%', fontSize: 12, fontWeight: 700 }}
                  placeholder="SUMR.DAY STUDIO"
                  value={form.qris?.merchantName || ''}
                  onChange={e => handleChange('qris.merchantName', e.target.value)}
                />
              </div>

              <div>
                <CloudinaryMediaPicker
                  label="Barcode QRIS"
                  tooltip="Unggah gambar barcode QRIS statis dari m-Banking atau e-Wallet ke Cloudinary."
                  value={form.qris?.imageUrl || ''}
                  onChange={(url) => handleChange('qris.imageUrl', url)}
                  onOpenGallery={() => setShowMediaModal('qris')}
                  notify={notify}
                  aspectRatio="square"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <label style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>Petunjuk Bayar</label>
                  <InfoTooltip content="Panduan langkah pembayaran yang dibaca pembeli saat checkout." />
                </div>
                <textarea
                  className="cms-input"
                  rows={2}
                  style={{ borderRadius: 8, width: '100%', fontSize: 11.5, padding: 8, resize: 'vertical' }}
                  placeholder="Buka m-Banking atau e-Wallet, scan QRIS di atas..."
                  value={form.qris?.instruction || ''}
                  onChange={e => handleChange('qris.instruction', e.target.value)}
                />
              </div>
            </div>

            {/* QRIS Scanner Simulator Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--cms-panel-bg)', borderRadius: 14, padding: 12, border: '1px dashed var(--glass-border)' }}>
              {form.qris?.imageUrl ? (
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ background: '#fff', padding: 8, borderRadius: 12, display: 'inline-block', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <img
                      src={form.qris.imageUrl}
                      alt="QRIS"
                      style={{ width: '100%', maxWidth: 140, height: 'auto', maxHeight: 140, objectFit: 'contain', borderRadius: 6, display: 'block' }}
                    />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 8, color: 'var(--cms-text)' }}>
                    {form.qris.merchantName || 'QRIS TOKO'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#10b981', fontWeight: 700, marginTop: 2 }}>
                    0% Fee • Siap
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '8px 4px' }}>
                  <QrCode size={36} style={{ opacity: 0.3, margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>Belum Ada QRIS</div>
                  <button
                    type="button"
                    onClick={() => setShowMediaModal('qris')}
                    className="cms-btn cms-btn-primary"
                    style={{ borderRadius: 100, padding: '0 12px', height: 28, fontSize: 11, fontWeight: 800, marginTop: 8 }}
                  >
                    Unggah QRIS
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM STICKY SAVE BAR (1-3 WORDS) ── */}
      {hasChanges && (
        <div className="bpm-sticky-save">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 750, color: 'var(--cms-text)' }}>
              Belum Disimpan
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="cms-btn cms-btn-primary"
            style={{ borderRadius: 100, padding: '0 16px', height: 34, fontSize: 12, fontWeight: 800, flexShrink: 0 }}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
      )}
      </div>

      {/* Media Gallery Modal (Pilih dari Cloudinary) */}
      {showMediaModal && (
        <MediaGalleryModal
          isOpen={Boolean(showMediaModal)}
          onClose={() => setShowMediaModal(null)}
          onSelect={(url) => {
            if (showMediaModal === 'logo') handleChange('logoUrl', url);
            if (showMediaModal === 'qris') handleChange('qris.imageUrl', url);
            setShowMediaModal(null);
            notify('Media dipilih', 'success');
          }}
        />
      )}
    </div>
  );
}
