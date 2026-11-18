import React, { useState, useEffect } from 'react';
import { 
  X, Palette, FolderKanban, Upload, Link2, Check, Lock, Unlock, 
  Sparkles, Save, MessageCircle, ExternalLink, Plus, Trash2,
  FileText, ShieldCheck, Eye, Layers, Type, RefreshCw, Droplets
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import { BrandVaultData, BrandColor } from '../client/ClientBrandVault';
import GlassColorPicker from './GlassColorPicker';

interface ClientVaultFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    cleanPhone?: string;
    company?: string;
  } | null;
  notify?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const DEFAULT_COLORS: BrandColor[] = [
  { name: 'Primary Skena', hex: '#D95629', cmyk: 'C:0 M:75 Y:85 K:10', role: 'Primary' },
  { name: 'Dark Slate', hex: '#0F172A', cmyk: 'C:80 M:60 Y:40 K:70', role: 'Secondary' },
  { name: 'Warm Cream', hex: '#FDFBF7', cmyk: 'C:0 M:2 Y:4 K:0', role: 'Background' },
  { name: 'Cyber Violet', hex: '#7C3AED', cmyk: 'C:70 M:80 Y:0 K:0', role: 'Accent' },
];

export const ClientVaultFileManagerModal: React.FC<ClientVaultFileManagerModalProps> = ({
  isOpen,
  onClose,
  contact,
  notify
}) => {
  const [vaultId, setVaultId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [industry, setIndustry] = useState('Creative & Digital');
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState('');
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState('');
  const [markLogoUrl, setMarkLogoUrl] = useState('');
  const [guidelinePdfUrl, setGuidelinePdfUrl] = useState('');
  const [masterDriveUrl, setMasterDriveUrl] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'dp' | 'lunas'>('lunas');
  const [primaryFont, setPrimaryFont] = useState('Outfit');
  const [secondaryFont, setSecondaryFont] = useState('Inter');
  const [fontNotes, setFontNotes] = useState('Outfit untuk Headings & Logo, Inter untuk Body copy');
  const [colors, setColors] = useState<BrandColor[]>(DEFAULT_COLORS);
  const [activeTab, setActiveTab] = useState<'brand' | 'files' | 'colors' | 'access'>('files');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing vault for contact
  useEffect(() => {
    if (!isOpen || !contact) return;

    const loadContactVault = async () => {
      const allVaults = await storage.getItem<BrandVaultData[]>('porto_brand_vaults', []);
      const cEmail = (contact.email || '').toLowerCase().trim();
      const cPhone = (contact.cleanPhone || contact.phone || '').replace(/\D/g, '');

      const found = (Array.isArray(allVaults) ? allVaults : []).find(v => {
        if (!v) return false;
        if (contact.id && v.clientId === contact.id) return true;
        if (cEmail && v.clientEmail && v.clientEmail.toLowerCase().trim() === cEmail) return true;
        if (cPhone && v.clientPhone && v.clientPhone.replace(/\D/g, '') === cPhone) return true;
        return false;
      });

      if (found) {
        setVaultId(found.id);
        setBrandName(found.brandName || contact.company || contact.name || '');
        setTagline(found.tagline || '');
        setIndustry(found.industry || 'Creative & Digital');
        setPrimaryLogoUrl(found.primaryLogoUrl || '');
        setSecondaryLogoUrl(found.secondaryLogoUrl || '');
        setMarkLogoUrl(found.markLogoUrl || '');
        setGuidelinePdfUrl(found.guidelinePdfUrl || '');
        setMasterDriveUrl(found.masterDriveUrl || '');
        setIsUnlocked(found.isUnlocked ?? true);
        setPaymentStatus(found.paymentStatus || 'lunas');
        setColors(found.colors && found.colors.length > 0 ? found.colors : DEFAULT_COLORS);
        setPrimaryFont(found.typography?.primaryFont || 'Outfit');
        setSecondaryFont(found.typography?.secondaryFont || 'Inter');
        setFontNotes(found.typography?.notes || '');
      } else {
        // Prefill new vault
        setVaultId(`VAULT-${Date.now().toString(36).toUpperCase()}`);
        setBrandName(contact.company || contact.name || 'Brand Klien');
        setTagline('');
        setIndustry('Creative Studio Project');
        setPrimaryLogoUrl('');
        setSecondaryLogoUrl('');
        setMarkLogoUrl('');
        setGuidelinePdfUrl('');
        setMasterDriveUrl('');
        setIsUnlocked(true);
        setPaymentStatus('lunas');
        setColors(DEFAULT_COLORS);
        setPrimaryFont('Outfit');
        setSecondaryFont('Inter');
        setFontNotes('');
      }
    };

    loadContactVault();
  }, [isOpen, contact]);

  if (!isOpen || !contact) return null;

  // Handle Local File Upload (converts to base64 data-uri for instant availability)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    maxSizeMb = 12
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      notify?.(`Ukuran file melebihi ${maxSizeMb}MB. Untuk berkas besar, gunakan link Google Drive.`, 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        notify?.(`✅ Berkas ${file.name} berhasil diunggah!`, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddColor = () => {
    setColors(prev => [
      ...prev,
      { name: `Warna ${prev.length + 1}`, hex: '#3B82F6', role: 'Secondary' }
    ]);
  };

  const handleRemoveColor = (index: number) => {
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const handleColorChange = (index: number, field: keyof BrandColor, value: string) => {
    setColors(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveVault = async () => {
    setIsSaving(true);
    try {
      const allVaults = await storage.getItem<BrandVaultData[]>('porto_brand_vaults', []);
      const vaultsList = Array.isArray(allVaults) ? allVaults : [];

      const payload: BrandVaultData = {
        id: vaultId || `VAULT-${Date.now().toString(36).toUpperCase()}`,
        clientId: contact.id,
        clientEmail: contact.email,
        clientPhone: contact.cleanPhone || contact.phone,
        brandName: brandName.trim() || contact.company || contact.name || 'Brand Klien',
        tagline: tagline.trim(),
        industry: industry.trim(),
        primaryLogoUrl: primaryLogoUrl.trim(),
        secondaryLogoUrl: secondaryLogoUrl.trim(),
        markLogoUrl: markLogoUrl.trim(),
        guidelinePdfUrl: guidelinePdfUrl.trim(),
        masterDriveUrl: masterDriveUrl.trim(),
        isUnlocked: paymentStatus === 'lunas' || isUnlocked,
        paymentStatus,
        colors,
        typography: {
          primaryFont: primaryFont.trim(),
          secondaryFont: secondaryFont.trim(),
          notes: fontNotes.trim()
        },
        updatedAt: new Date().toISOString()
      };

      const existingIdx = vaultsList.findIndex(v => v.id === payload.id || (contact.id && v.clientId === contact.id));
      let updatedVaults: BrandVaultData[];
      if (existingIdx >= 0) {
        updatedVaults = [...vaultsList];
        updatedVaults[existingIdx] = payload;
      } else {
        updatedVaults = [payload, ...vaultsList];
      }

      await storage.setItem('porto_brand_vaults', updatedVaults);

      // Also sync to projects if matching project exists
      const allProjects = await storage.getItem<any[]>('porto_projects', []);
      if (Array.isArray(allProjects)) {
        const cPhone = (contact.cleanPhone || contact.phone || '').replace(/\D/g, '');
        const updatedProjects = allProjects.map(p => {
          const match = (contact.id && p.clientId === contact.id) ||
                        (contact.email && p.clientEmail && p.clientEmail.toLowerCase() === contact.email.toLowerCase()) ||
                        (cPhone && p.clientPhone && p.clientPhone.replace(/\D/g, '') === cPhone);
          if (match) {
            return {
              ...p,
              clientDriveUrl: masterDriveUrl || p.clientDriveUrl,
              figmaUrl: figmaUrl || p.figmaUrl,
              paymentStatus: paymentStatus
            };
          }
          return p;
        });
        await storage.setItem('porto_projects', updatedProjects);
      }

      window.dispatchEvent(new CustomEvent('porto_brand_vault_updated', { detail: payload }));
      notify?.(`✅ Brand Vault & Berkas untuk "${payload.brandName}" berhasil disimpan & terhubung ke portal klien!`, 'success');
      haptic.medium();
      onClose();
    } catch (err: any) {
      console.error('Error saving brand vault:', err);
      notify?.('Gagal menyimpan Brand Vault: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareToWhatsApp = () => {
    const rawPhone = contact.cleanPhone || contact.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const clientLink = `${window.location.origin}/akun?tab=vault`;
    const message = encodeURIComponent(
      `Halo *${contact.name}*!\n\n` +
      `Berkas identitas & Brand Vault untuk brand *${brandName || contact.company || contact.name}* telah kami siapkan di sumr.day Studio Portal.\n\n` +
      `Anda dapat mengakses logo master, kode hex warna, tipografi, dan Google Drive master file di link berikut:\n` +
      `🔗 ${clientLink}\n\n` +
      `Status Berkas: *${paymentStatus === 'lunas' ? 'Lunas (Semua File Siap Unduh)' : 'DP 50% (Preview Terbuka)'}*\n\n` +
      `Terima kasih telah berkarya bersama sumr.day Creative Studio!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          zIndex: 999998,
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={onClose}
      />

      {/* Modal Dialog (Flat Design & Fixed Height across all tabs) */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: 720,
          height: 'min(90vh, 680px)', // Ukuran selalu tetap sama tiap mode
          maxHeight: 'min(90vh, 680px)',
          background: 'var(--cms-card-bg, #12121a)',
          borderRadius: 20,
          border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--cms-text, #f8fafc)',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Header (Flat Clean Style) */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          background: 'var(--cms-panel-bg, #181824)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#D95629',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <FolderKanban size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#D95629' }}>
                  Kirim & Kelola Berkas Klien
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                  Sinkron Portal Klien
                </span>
              </div>
              <h2 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 900, color: 'var(--cms-text)', fontFamily: "'Outfit', sans-serif" }}>
                Brand Vault: {contact.name} {contact.company ? `(${contact.company})` : ''}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--cms-input-bg, rgba(255,255,255,0.06))',
              color: 'var(--cms-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation (Icon Saja - Harmonized Flat Palette) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          background: 'var(--cms-panel-bg, #181824)',
          borderBottom: '1px solid var(--glass-border)',
          gap: 12
        }}>
          {/* Circular Icon-Only Switch Buttons (Flat Harmonized) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--cms-switcher-bg, rgba(0,0,0,0.06))',
            padding: '3px 4px',
            borderRadius: 100,
            border: '1px solid var(--glass-border)'
          }}>
            {[
              { id: 'files', label: '1. Master Berkas & Cloud', icon: FolderKanban },
              { id: 'brand', label: '2. Logo & Guideline', icon: Palette },
              { id: 'colors', label: '3. Palet Warna & Font', icon: Droplets },
              { id: 'access', label: '4. Hak Akses (DP / Lunas)', icon: ShieldCheck }
            ].map(t => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setActiveTab(t.id as any);
                  }}
                  title={t.label}
                  aria-label={t.label}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: isActive ? 'var(--cms-accent, #D95629)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--cms-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--cms-text)';
                      e.currentTarget.style.background = 'var(--cms-card-bg, rgba(255,255,255,0.7))';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--cms-text-muted)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={17} strokeWidth={isActive ? 2.4 : 1.8} />
                </button>
              );
            })}
          </div>

          {/* Active Tab Label Indicator (Flat Text) */}
          <div style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: 'var(--cms-text)',
            fontFamily: "'Outfit', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 7
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cms-accent, #D95629)' }} />
            <span>
              {
                activeTab === 'files' ? 'Master Berkas & Cloud' :
                activeTab === 'brand' ? 'Logo & Guideline' :
                activeTab === 'colors' ? 'Palet Warna & Font' :
                'Hak Akses (DP / Lunas)'
              }
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          {/* TAB 1: MASTER BERKAS & DRIVE */}
          {activeTab === 'files' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                padding: '14px 18px',
                borderRadius: 16,
                background: 'rgba(217, 86, 41, 0.08)',
                border: '1px solid rgba(217, 86, 41, 0.25)',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start'
              }}>
                <FolderKanban size={20} color="#D95629" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--cms-text)' }}>
                  <strong>Alur Serah Terima Studio:</strong> Masukkan link folder Google Drive, Dropbox, atau Figma tempat Anda menyimpan file master resolusi tinggi (.AI, .EPS, .SVG, Font, .FIG).
                  Klien dapat mengakses link ini langsung dari portal <code>/akun/brand-vault</code> mereka.
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 6 }}>
                  Link Folder Master File (Google Drive / Dropbox / Cloud Storage)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="url"
                    value={masterDriveUrl}
                    onChange={e => setMasterDriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    style={{
                      flex: 1,
                      height: 42,
                      padding: '0 14px',
                      borderRadius: 12,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13
                    }}
                  />
                  {masterDriveUrl && (
                    <a
                      href={masterDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0 14px',
                        height: 42,
                        borderRadius: 12,
                        background: 'rgba(124, 58, 237, 0.15)',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        color: 'var(--cms-accent, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none'
                      }}
                      title="Buka Drive"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                  Pastikan akses link Google Drive telah diset ke "Anyone with the link can view".
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 6 }}>
                  Link Figma File / Project Canvas (Opsional untuk UI/UX & Web)
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="url"
                    value={figmaUrl}
                    onChange={e => setFigmaUrl(e.target.value)}
                    placeholder="https://figma.com/design/..."
                    style={{
                      flex: 1,
                      height: 42,
                      padding: '0 14px',
                      borderRadius: 12,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13
                    }}
                  />
                  {figmaUrl && (
                    <a
                      href={figmaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0 14px',
                        height: 42,
                        borderRadius: 12,
                        background: 'rgba(14, 165, 233, 0.15)',
                        border: '1px solid rgba(14, 165, 233, 0.3)',
                        color: '#0ea5e9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none'
                      }}
                      title="Buka Figma"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGO & GUIDELINE */}
          {activeTab === 'brand' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Nama Brand Klien
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    placeholder="Contoh: Kopi Kembara"
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 10,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>
                    Slogan / Tagline Brand
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    placeholder="Contoh: Authentic Artisan Roastery"
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 10,
                      background: 'var(--cms-input-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Primary Logo */}
              <div style={{
                padding: 16,
                borderRadius: 16,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>
                    Logo Utama (Primary Logo - PNG Transparan / SVG)
                  </label>
                  {primaryLogoUrl && (
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>✓ Terpasang</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {primaryLogoUrl ? (
                    <div style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 12px 12px',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <img src={primaryLogoUrl} alt="Logo Preview" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px dashed var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cms-text-muted)',
                      flexShrink: 0
                    }}>
                      <Palette size={20} opacity={0.4} />
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="url"
                      value={primaryLogoUrl}
                      onChange={e => setPrimaryLogoUrl(e.target.value)}
                      placeholder="Tempel URL Logo atau unggah file di samping..."
                      style={{
                        width: '100%',
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 8,
                        background: 'var(--cms-card-bg, #ffffff)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{
                        padding: '5px 12px',
                        borderRadius: 8,
                        background: 'var(--cms-accent, #7c3aed)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}>
                        <Upload size={12} /> Unggah File Logo
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/webp,image/jpeg"
                          style={{ display: 'none' }}
                          onChange={e => handleFileUpload(e, setPrimaryLogoUrl)}
                        />
                      </label>
                      {primaryLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setPrimaryLogoUrl('')}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 8,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444',
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary / Mark Logo */}
              <div style={{
                padding: 16,
                borderRadius: 16,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text)' }}>
                    Logo Mark / Favicon / Icon Mark (Opsional)
                  </label>
                  {markLogoUrl && (
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>✓ Terpasang</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {markLogoUrl ? (
                    <div style={{
                      width: 50,
                      height: 50,
                      borderRadius: 12,
                      background: 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 10px 10px',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <img src={markLogoUrl} alt="Mark Preview" style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} />
                    </div>
                  ) : null}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="url"
                      value={markLogoUrl}
                      onChange={e => setMarkLogoUrl(e.target.value)}
                      placeholder="URL Logo Mark..."
                      style={{
                        width: '100%',
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 8,
                        background: 'var(--cms-card-bg, #ffffff)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        boxSizing: 'border-box'
                      }}
                    />
                    <label style={{
                      alignSelf: 'flex-start',
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--cms-text)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Upload size={11} /> Unggah Mark
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/webp,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(e, setMarkLogoUrl)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Brand Guideline PDF */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 6 }}>
                  Brand Guideline PDF URL
                </label>
                <input
                  type="url"
                  value={guidelinePdfUrl}
                  onChange={e => setGuidelinePdfUrl(e.target.value)}
                  placeholder="https://drive.google.com/.../brand-guideline.pdf"
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 12px',
                    borderRadius: 10,
                    background: 'var(--cms-input-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--cms-text)',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: PALET WARNA & TIPOGRAFI */}
          {activeTab === 'colors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Colors List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                    Palet Warna Resmi Brand ({colors.length} Warna)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 100,
                      background: 'rgba(124, 58, 237, 0.15)',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      color: 'var(--cms-accent, #7c3aed)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={13} /> Tambah Warna
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {colors.map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 100,
                        background: 'var(--cms-input-bg)',
                        border: '1px solid var(--glass-border)',
                        display: 'grid',
                        gridTemplateColumns: '40px 1.5fr 1fr 1fr 34px',
                        gap: 10,
                        alignItems: 'center'
                      }}
                    >
                      {/* Tool Warna Rounded (GlassColorPicker Persis Seperti di Settings) */}
                      <GlassColorPicker
                        value={c.hex}
                        onChange={(newHex: string) => handleColorChange(idx, 'hex', newHex)}
                        customTrigger={(toggle: () => void) => (
                          <button
                            type="button"
                            onClick={toggle}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: c.hex,
                              border: '2.5px solid rgba(255, 255, 255, 0.35)',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              outline: 'none',
                              transition: 'transform 0.15s ease'
                            }}
                            title="Klik untuk memilih warna (Palet Rounded Glass)"
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        )}
                      />

                      {/* Nama Warna (Rounded Pill) */}
                      <input
                        type="text"
                        value={c.name}
                        onChange={e => handleColorChange(idx, 'name', e.target.value)}
                        placeholder="Nama Warna"
                        style={{
                          height: 36,
                          padding: '0 14px',
                          borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
                          fontSize: 12.5,
                          fontWeight: 600
                        }}
                      />

                      {/* Kode HEX (Rounded Pill) */}
                      <input
                        type="text"
                        value={c.hex}
                        onChange={e => handleColorChange(idx, 'hex', e.target.value)}
                        placeholder="#HEX"
                        style={{
                          height: 36,
                          padding: '0 14px',
                          borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
                          fontSize: 12.5,
                          fontFamily: 'monospace',
                          fontWeight: 700
                        }}
                      />

                      {/* Role Select (Rounded Pill) */}
                      <select
                        value={c.role || 'Secondary'}
                        onChange={e => handleColorChange(idx, 'role', e.target.value as any)}
                        style={{
                          height: 36,
                          padding: '0 12px',
                          borderRadius: 100,
                          background: 'var(--cms-card-bg, #ffffff)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cms-text)',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Accent">Accent</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Background">Background</option>
                      </select>

                      {/* Delete Button (Circular Rounded) */}
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        title="Hapus Warna"
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div style={{
                padding: 16,
                borderRadius: 16,
                background: 'var(--cms-input-bg)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>
                  Tipografi & Panduan Huruf
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>Font Utama (Heading)</span>
                    <input
                      type="text"
                      value={primaryFont}
                      onChange={e => setPrimaryFont(e.target.value)}
                      placeholder="Misal: Outfit, Clash Display, Syne"
                      style={{
                        width: '100%',
                        height: 36,
                        padding: '0 10px',
                        borderRadius: 8,
                        background: 'var(--cms-card-bg, #ffffff)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>Font Sekunder (Body Text)</span>
                    <input
                      type="text"
                      value={secondaryFont}
                      onChange={e => setSecondaryFont(e.target.value)}
                      placeholder="Misal: Inter, Plus Jakarta Sans"
                      style={{
                        width: '100%',
                        height: 36,
                        padding: '0 10px',
                        borderRadius: 8,
                        background: 'var(--cms-card-bg, #ffffff)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cms-text)',
                        fontSize: 12,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--cms-text-muted)', display: 'block', marginBottom: 4 }}>Catatan Penggunaan Tipografi</span>
                  <input
                    type="text"
                    value={fontNotes}
                    onChange={e => setFontNotes(e.target.value)}
                    placeholder="Contoh: Gunakan Outfit Bold untuk judul kemasan..."
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 10px',
                      borderRadius: 8,
                      background: 'var(--cms-card-bg, #ffffff)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cms-text)',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HAK AKSES & STATUS PEMBAYARAN */}
          {activeTab === 'access' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                padding: 18,
                borderRadius: 18,
                background: paymentStatus === 'lunas' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1.5px solid ${paymentStatus === 'lunas' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                display: 'flex',
                gap: 14,
                alignItems: 'center'
              }}>
                {paymentStatus === 'lunas' ? (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                    <Unlock size={22} />
                  </div>
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                    <Lock size={22} />
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--cms-text)' }}>
                    {paymentStatus === 'lunas' ? 'Status: Lunas (Terbuka Penuh)' : 'Status: DP 50% (Master File Digembok)'}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--cms-text-muted)', lineHeight: 1.4 }}>
                    {paymentStatus === 'lunas' 
                      ? 'Klien dapat langsung mengunduh semua master file vector, logo transparansi tinggi, dan folder Google Drive.'
                      : 'Klien dapat melihat pratinjau logo dan kode warna di portal, namun tombol Google Drive dan download vector dikunci dengan banner instruksi pelunasan.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('lunas');
                    setIsUnlocked(true);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: paymentStatus === 'lunas' ? 'rgba(16, 185, 129, 0.15)' : 'var(--cms-input-bg)',
                    border: `1.5px solid ${paymentStatus === 'lunas' ? '#10b981' : 'var(--glass-border)'}`,
                    color: paymentStatus === 'lunas' ? '#10b981' : 'var(--cms-text)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
                    <Unlock size={16} /> Lunas / Serah Terima
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                    Buka semua akses unduhan master file untuk klien.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('dp');
                    setIsUnlocked(false);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: paymentStatus === 'dp' ? 'rgba(245, 158, 11, 0.15)' : 'var(--cms-input-bg)',
                    border: `1.5px solid ${paymentStatus === 'dp' ? '#f59e0b' : 'var(--glass-border)'}`,
                    color: paymentStatus === 'dp' ? '#f59e0b' : 'var(--cms-text)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
                    <Lock size={16} /> Termin DP 50%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cms-text-muted)', marginTop: 4 }}>
                    Gembok link master file hingga pembayaran lunas.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--glass-border)',
          background: 'var(--cms-panel-bg, #181824)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          {contact.cleanPhone ? (
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 100,
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              title="Kirim Link Brand Vault ke WhatsApp Klien"
            >
              <MessageCircle size={15} />
              <span>Beri Tahu Klien via WA</span>
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 38,
                padding: '0 18px',
                borderRadius: 100,
                border: '1px solid var(--glass-border)',
                background: 'var(--cms-input-bg)',
                color: 'var(--cms-text-muted)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveVault}
              style={{
                height: 38,
                padding: '0 20px',
                borderRadius: 100,
                border: 'none',
                background: '#D95629',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Simpan & Sinkronkan ke Klien</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientVaultFileManagerModal;
