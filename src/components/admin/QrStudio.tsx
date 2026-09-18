import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  QrCode, Download, Copy, Check, Globe, MessageCircle, Wifi, 
  Type, User, Phone, Mail, Sparkles, Image, Upload, RefreshCw, 
  ExternalLink, Layers, Palette, Eye, Sliders, ShieldCheck, Share2,
  FileDown, Printer, Smartphone, CreditCard, Tag, Loader2, CheckCheck, Trash2
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { uploadToCloudinary } from '../../utils/cloudinary';
import MediaGalleryModal from './MediaGalleryModal';

const QR_BG_PRESETS = [
  { label: 'Putih Bersih', fg: '#000000', bg: '#ffffff' },
  { label: 'Dark Onyx', fg: '#ffffff', bg: '#12121a' },
  { label: 'Cyber Blue', fg: '#38bdf8', bg: '#030712' },
  { label: 'Emerald Green', fg: '#10b981', bg: '#022c22' },
  { label: 'Velvet Violet', fg: '#c084fc', bg: '#1e1136' },
  { label: 'Sunset Amber', fg: '#f97316', bg: '#1c0a00' },
  { label: 'Brand Indigo', fg: '#ffffff', bg: '#4f46e5' },
];

export const QrStudio: React.FC<{ notify?: (msg: string, type?: string) => void }> = ({ notify }) => {
  // Source State
  const [sourceMode, setSourceMode] = useState<'page' | 'custom'>('custom');
  const [bioPages, setBioPages] = useState<any[]>([]);
  const [selectedBioSlug, setSelectedBioSlug] = useState('main');
  
  // Custom Data Presets
  const [presetType, setPresetType] = useState<'url' | 'wa' | 'wifi' | 'vcard' | 'text' | 'email'>('url');
  const [customUrl, setCustomUrl] = useState('https://sumrday.web.app');
  const [customText, setCustomText] = useState('');
  const [waNumber, setWaNumber] = useState('6281234567890');
  const [waMessage, setWaMessage] = useState('Halo sumr.day! ☀️ Saya tertarik dengan portofolio & layanan Anda.');
  const [wifiSsid, setWifiSsid] = useState('sumrday-WiFi');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [vcardName, setVcardName] = useState('sumr.day');
  const [vcardPhone, setVcardPhone] = useState('6281234567890');
  const [vcardEmail, setVcardEmail] = useState('hi.sumrday@gmail.com');
  const [vcardCompany, setVcardCompany] = useState('sumr.day | Creative Digital Studio');
  const [emailTo, setEmailTo] = useState('hi.sumrday@gmail.com');
  const [emailSubject, setEmailSubject] = useState('Inquiry Kolaborasi');
  const [emailBody, setEmailBody] = useState('Halo sumr.day, saya ingin berdiskusi mengenai proyek...');

  // QR Design Settings
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isTransparentBg, setIsTransparentBg] = useState(false);
  const [frameStyle, setFrameStyle] = useState<'none' | 'badge' | 'card' | 'polaroid'>('badge');
  const [frameHeader, setFrameHeader] = useState('SCAN ME');
  const [frameSubtext, setFrameSubtext] = useState('Pindai untuk membuka info');
  const [resolution, setResolution] = useState(1200);
  const [margin, setMargin] = useState(2);
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [previewMockup, setPreviewMockup] = useState<'card' | 'phone' | 'sticker'>('card');
  const [copied, setCopied] = useState(false);

  const logoFileRef = useRef<HTMLInputElement>(null);

  // Load existing bio pages
  useEffect(() => {
    storage.getItem('porto_bio_pages', []).then(pages => {
      if (pages && Array.isArray(pages) && pages.length > 0) {
        setBioPages(pages);
        const defaultPage = pages.find(p => p.isDefault) || pages[0];
        setSelectedBioSlug(defaultPage.slug || 'main');
      }
    });
  }, []);

  // Compute final QR content string
  const qrDataContent = useMemo(() => {
    if (sourceMode === 'page') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sumrday.web.app';
      if (selectedBioSlug === 'main') return `${origin}/links`;
      return `${origin}/links/${selectedBioSlug}`;
    }

    switch (presetType) {
      case 'url':
        return customUrl || 'https://sumrday.web.app';
      case 'wa': {
        const clean = waNumber.replace(/[^0-9]/g, '');
        return `https://wa.me/${clean}?text=${encodeURIComponent(waMessage)}`;
      }
      case 'wifi':
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPassword};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName}\nFN:${vcardName}\nORG:${vcardCompany}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'text':
        return customText || 'Teks Desain Kustom';
      default:
        return 'https://sumrday.web.app';
    }
  }, [sourceMode, selectedBioSlug, presetType, customUrl, waNumber, waMessage, wifiType, wifiSsid, wifiPassword, vcardName, vcardCompany, vcardPhone, vcardEmail, emailTo, emailSubject, emailBody, customText]);

  // QR URL
  const cleanFg = fgColor.replace('#', '');
  const cleanBg = isTransparentBg ? 'ffffff00' : bgColor.replace('#', '');
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${resolution}x${resolution}&data=${encodeURIComponent(qrDataContent)}&color=${cleanFg}&bgcolor=${cleanBg}&qzone=${margin}&margin=0`;
  const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrDataContent)}&color=${cleanFg}&bgcolor=${cleanBg}&qzone=${margin}&margin=0`;

  const handleCopyData = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(qrDataContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (notify) notify('Data QR Code disalin ke clipboard');
    }
  };

  const handleUploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const res = await uploadToCloudinary(file);
      setLogoUrl(res.url);
      if (notify) notify('Logo berhasil diupload');
    } catch (err: any) {
      if (notify) notify('Upload logo gagal: ' + err.message, 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: isMobile ? '16px 16px 90px' : '24px 24px 80px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'cmsFadeIn 0.25s ease', maxWidth: 1280, margin: '0 auto' }}>
      
      {/* ── HEADER TITLE BAR ── */}
      <div className="cms-card" style={{ padding: '16px 20px', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))', color: 'var(--cms-accent, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QrCode size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--cms-text)' }}>Link Space</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)' }}>
                QR Generator
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--cms-text-muted)', marginTop: 2 }}>
              Desain dan unduh QR Code resolusi tinggi untuk kebutuhan cetak, kartu nama, poster, stiker, dan Bio Link.
            </div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={handleCopyData}
            className="cms-btn cms-btn-secondary"
            style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title={copied ? 'Tersalin' : 'Salin Data / URL'}
            aria-label="Salin Data"
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
          </button>

          <a
            href={qrApiUrl}
            download="qrcode-design-hd.png"
            target="_blank"
            rel="noopener noreferrer"
            className="cms-btn cms-btn-primary"
            style={{ height: 36, padding: '0 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            title={`Unduh QR Code HD (${resolution}px)`}
          >
            <Download size={14} /> Unduh
          </a>
        </div>
      </div>

      {/* ── 2-COLUMN MAIN WORKSPACE (SETTINGS & LIVE DESIGN MOCKUP) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 440px)', gap: 20, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: CONTROLS & FORMS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 1. SOURCE SELECTOR CARD */}
          <div className="cms-card" style={{ padding: 18, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>Sumber Data QR</span>
              
              <div style={{ display: 'flex', padding: 3, background: 'var(--cms-switcher-bg)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                <button
                  type="button"
                  onClick={() => setSourceMode('custom')}
                  style={{
                    padding: '5px 12px', borderRadius: 8, border: 'none',
                    background: sourceMode === 'custom' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                    color: sourceMode === 'custom' ? '#ffffff' : 'var(--cms-text-muted)',
                    fontSize: 11.5, fontWeight: 850, cursor: 'pointer'
                  }}
                >
                  Bahan Desain Bebas
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('page')}
                  style={{
                    padding: '5px 12px', borderRadius: 8, border: 'none',
                    background: sourceMode === 'page' ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                    color: sourceMode === 'page' ? '#ffffff' : 'var(--cms-text-muted)',
                    fontSize: 11.5, fontWeight: 850, cursor: 'pointer'
                  }}
                >
                  Bio Link Page
                </button>
              </div>
            </div>

            {/* Mode A: Bio Link Page Picker */}
            {sourceMode === 'page' ? (
              <div>
                <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Pilih Halaman Bio Link Tujuan</label>
                <select
                  className="cms-input"
                  value={selectedBioSlug}
                  onChange={e => setSelectedBioSlug(e.target.value)}
                  style={{ height: 38, fontSize: 12.5 }}
                >
                  {bioPages.map(p => (
                    <option key={p.id || p.slug} value={p.slug}>
                      {p.title} (/links{p.isDefault || p.slug === 'main' ? '' : `/${p.slug}`})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Mode B: Custom Presets */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Preset Chips */}
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                  {[
                    { id: 'url', label: 'URL / Web', icon: Globe },
                    { id: 'wa', label: 'WhatsApp', icon: MessageCircle },
                    { id: 'wifi', label: 'WiFi', icon: Wifi },
                    { id: 'vcard', label: 'Kontak (vCard)', icon: User },
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'text', label: 'Teks Bebas', icon: Type },
                  ].map(pst => (
                    <button
                      key={pst.id}
                      type="button"
                      onClick={() => setPresetType(pst.id as any)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: 'none',
                        background: presetType === pst.id ? 'var(--cms-accent-soft, rgba(124,58,237,0.15))' : 'var(--cms-switcher-bg)',
                        color: presetType === pst.id ? 'var(--cms-accent, #7c3aed)' : 'var(--cms-text-muted)',
                        fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap'
                      }}
                    >
                      <pst.icon size={13} /> {pst.label}
                    </button>
                  ))}
                </div>

                {/* Forms for each preset */}
                {presetType === 'url' && (
                  <div>
                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>URL / Tautan Website</label>
                    <input
                      type="url"
                      className="cms-input"
                      placeholder="https://portofolio-anda.com"
                      value={customUrl}
                      onChange={e => setCustomUrl(e.target.value)}
                      style={{ height: 38, fontSize: 12.5 }}
                    />
                  </div>
                )}

                {presetType === 'wa' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Nomor WhatsApp</label>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="6281234567890"
                        value={waNumber}
                        onChange={e => setWaNumber(e.target.value)}
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Pesan Pembuka Otomatis</label>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="Halo, saya ingin memesan desain..."
                        value={waMessage}
                        onChange={e => setWaMessage(e.target.value)}
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>
                  </div>
                )}

                {presetType === 'wifi' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: 10 }}>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Nama WiFi (SSID)</label>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="Studio_Guest"
                        value={wifiSsid}
                        onChange={e => setWifiSsid(e.target.value)}
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Password WiFi</label>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="Password123"
                        value={wifiPassword}
                        onChange={e => setWifiPassword(e.target.value)}
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Keamanan</label>
                      <select
                        className="cms-input"
                        value={wifiType}
                        onChange={e => setWifiType(e.target.value as any)}
                        style={{ height: 38, fontSize: 12 }}
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Tanpa Password</option>
                      </select>
                    </div>
                  </div>
                )}

                {presetType === 'vcard' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Nama Lengkap</label>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="Arif Saifularif"
                        value={vcardName}
                        onChange={e => setVcardName(e.target.value)}
                        style={{ height: 36, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Perusahaan / Brand</label>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="sumr.day"
                        value={vcardCompany}
                        onChange={e => setVcardCompany(e.target.value)}
                        style={{ height: 36, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Nomor Telepon</label>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="6281234567890"
                        value={vcardPhone}
                        onChange={e => setVcardPhone(e.target.value)}
                        style={{ height: 36, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Email</label>
                      <input
                        type="email"
                        className="cms-input"
                        placeholder="hi.sumrday@gmail.com"
                        value={vcardEmail}
                        onChange={e => setVcardEmail(e.target.value)}
                        style={{ height: 36, fontSize: 12 }}
                      />
                    </div>
                  </div>
                )}

                {presetType === 'email' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Tujuan Email</label>
                      <input
                        type="email"
                        className="cms-input"
                        placeholder="kontak@studio.com"
                        value={emailTo}
                        onChange={e => setEmailTo(e.target.value)}
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Subjek Pesan</label>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="Pemesanan Portofolio"
                        value={emailSubject}
                        onChange={e => setEmailSubject(e.target.value)}
                        style={{ height: 38, fontSize: 12 }}
                      />
                    </div>
                  </div>
                )}

                {presetType === 'text' && (
                  <div>
                    <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Isi Teks</label>
                    <textarea
                      className="cms-input"
                      placeholder="Tulis teks atau catatan desain apa saja..."
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      style={{ height: 70, fontSize: 12, resize: 'none' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. VISUAL STYLING & PALETTE */}
          <div className="cms-card" style={{ padding: 18, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>Palet Warna & Tampilan QR</span>

            {/* Quick Color Presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QR_BG_PRESETS.map((pst, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFgColor(pst.fg);
                    setBgColor(pst.bg);
                    setIsTransparentBg(false);
                  }}
                  style={{
                    padding: '5px 10px', borderRadius: 8,
                    background: 'var(--cms-switcher-bg)',
                    border: '1px solid var(--glass-border)',
                    fontSize: 11, fontWeight: 800, color: 'var(--cms-text)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: pst.fg, border: '1px solid #ccc' }} />
                  <span>{pst.label}</span>
                </button>
              ))}
            </div>

            {/* Manual Color Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Warna Kode QR (Foreground)</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={fgColor}
                    onChange={e => setFgColor(e.target.value)}
                    style={{ width: 38, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="cms-input"
                    value={fgColor}
                    onChange={e => setFgColor(e.target.value)}
                    style={{ height: 36, fontSize: 12 }}
                  />
                </div>
              </div>

              <div>
                <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Warna Latar (Background)</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="color"
                    disabled={isTransparentBg}
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    style={{ width: 38, height: 36, border: 'none', borderRadius: 8, cursor: isTransparentBg ? 'not-allowed' : 'pointer', opacity: isTransparentBg ? 0.3 : 1 }}
                  />
                  <input
                    type="text"
                    disabled={isTransparentBg}
                    className="cms-input"
                    value={isTransparentBg ? 'Transparent' : bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    style={{ height: 36, fontSize: 12, opacity: isTransparentBg ? 0.5 : 1 }}
                  />
                </div>
              </div>

              {/* Transparent background toggle */}
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--cms-switcher-bg)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--cms-text)' }}>Latar Transparan (PNG Alpha untuk Desain Grafis)</span>
                <input
                  type="checkbox"
                  checked={isTransparentBg}
                  onChange={e => setIsTransparentBg(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--cms-accent)' }}
                />
              </div>
            </div>
          </div>

          {/* 3. LOGO & ICON CENTER */}
          <div className="cms-card" style={{ padding: 18, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>Logo / Ikon Tengah QR</span>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  title="Hapus Logo"
                  aria-label="Hapus Logo"
                  style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: 'var(--cms-switcher-bg)',
                border: '1.5px dashed var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0
              }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Image size={20} color="var(--cms-text-muted)" opacity={0.5} />
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--cms-card-bg)', border: '1.5px solid var(--glass-border)', borderRadius: 10, color: 'var(--cms-text)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Upload size={14} /> {isUploadingLogo ? 'Mengunggah...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={isUploadingLogo}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadLogo(f);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowGalleryModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', background: 'var(--cms-accent-soft)', border: '1.5px solid var(--cms-accent-border)', borderRadius: 10, color: 'var(--cms-accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  title="Pilih Logo dari Galeri"
                >
                  <Image size={14} /> <span>Galeri</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. FRAME & LABEL STYLER */}
          <div className="cms-card" style={{ padding: 18, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--cms-text)' }}>Frame, Label & Resolusi Cetak</span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Gaya Frame Kartu</label>
                <select
                  className="cms-input"
                  value={frameStyle}
                  onChange={e => setFrameStyle(e.target.value as any)}
                  style={{ height: 36, fontSize: 12 }}
                >
                  <option value="badge">Badge Modern (Header & Footer)</option>
                  <option value="card">Card Minimalist</option>
                  <option value="polaroid">Polaroid Frame</option>
                  <option value="none">Polos Tanpa Frame</option>
                </select>
              </div>

              <div>
                <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Teks Label Utama</label>
                <input
                  type="text"
                  className="cms-input"
                  placeholder="SCAN ME"
                  value={frameHeader}
                  onChange={e => setFrameHeader(e.target.value)}
                  style={{ height: 36, fontSize: 12 }}
                />
              </div>

              <div>
                <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Subteks Keterangan</label>
                <input
                  type="text"
                  className="cms-input"
                  placeholder="Pindai kamera untuk membuka"
                  value={frameSubtext}
                  onChange={e => setFrameSubtext(e.target.value)}
                  style={{ height: 36, fontSize: 12 }}
                />
              </div>

              <div>
                <label className="cms-label" style={{ fontSize: 11, marginBottom: 4 }}>Resolusi Ekspor Gambar</label>
                <select
                  className="cms-input"
                  value={resolution}
                  onChange={e => setResolution(Number(e.target.value))}
                  style={{ height: 36, fontSize: 12 }}
                >
                  <option value={300}>300 x 300 px (Digital/Mobile)</option>
                  <option value={600}>600 x 600 px (Standar HD)</option>
                  <option value={1200}>1200 x 1200 px (High-Res Cetak)</option>
                  <option value={2400}>2400 x 2400 px (Ultra-HD Poster)</option>
                  <option value={4000}>4000 x 4000 px (Master Print 300 DPI)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE DESIGN MOCKUP & EXPORT */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Mockup Preview Switcher */}
          <div className="cms-card" style={{ padding: 6, borderRadius: 14, display: 'flex', gap: 4 }}>
            {[
              { id: 'card', label: 'Kartu Desain', icon: CreditCard },
              { id: 'phone', label: 'Tampilan Ponsel', icon: Smartphone },
              { id: 'sticker', label: 'Stiker Cetak', icon: Tag },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPreviewMockup(tab.id as any)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 10, border: 'none',
                  background: previewMockup === tab.id ? 'var(--cms-accent, #7c3aed)' : 'transparent',
                  color: previewMockup === tab.id ? '#ffffff' : 'var(--cms-text-muted)',
                  fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                }}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Design Mockup Stage */}
          <div className="cms-card" style={{
            padding: 24,
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 460,
            background: 'var(--cms-card-bg)',
            position: 'relative'
          }}>
            
            {/* MOCKUP 1: BUSINESS CARD / MODERN BADGE */}
            {previewMockup === 'card' && (
              <div style={{
                width: '100%',
                maxWidth: 290,
                background: isTransparentBg ? '#ffffff' : bgColor,
                borderRadius: frameStyle === 'polaroid' ? '12px 12px 24px 24px' : 20,
                padding: frameStyle === 'polaroid' ? '18px 18px 30px' : 18,
                border: '1px solid var(--glass-border)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 12
              }}>
                {frameStyle !== 'none' && frameHeader && (
                  <div style={{ fontSize: 13, fontWeight: 900, color: fgColor, letterSpacing: '0.06em' }}>
                    {frameHeader}
                  </div>
                )}

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={qrPreviewUrl} alt="QR Code" style={{ width: 190, height: 190, display: 'block', borderRadius: 8 }} />
                  {logoUrl && (
                    <div style={{
                      position: 'absolute', width: 44, height: 44, borderRadius: 8,
                      background: '#ffffff', border: '2px solid var(--glass-border)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2
                    }}>
                      <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>

                {frameStyle !== 'none' && frameSubtext && (
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: fgColor, opacity: 0.8, maxWidth: 220, lineHeight: 1.3 }}>
                    {frameSubtext}
                  </div>
                )}
              </div>
            )}

            {/* MOCKUP 2: PHONE SCREEN DISPLAY */}
            {previewMockup === 'phone' && (
              <div style={{
                width: 250, height: 440,
                background: '#090910',
                borderRadius: 36,
                border: '6px solid #27273a',
                padding: '30px 14px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fff',
                boxShadow: '0 25px 60px rgba(0,0,0,0.45)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.6 }}>Tampilan QR Ponsel</div>
                
                <div style={{
                  padding: 12, background: isTransparentBg ? '#fff' : bgColor,
                  borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative'
                }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={qrPreviewUrl} alt="QR" style={{ width: 140, height: 140, display: 'block' }} />
                    {logoUrl && (
                      <div style={{
                        position: 'absolute', width: 34, height: 34, borderRadius: 6,
                        background: '#ffffff', border: '1.5px solid var(--glass-border)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2
                      }}>
                        <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  {frameHeader && <span style={{ fontSize: 9, fontWeight: 900, color: fgColor }}>{frameHeader}</span>}
                </div>

                <div style={{ fontSize: 9.5, opacity: 0.5, textAlign: 'center' }}>{qrDataContent}</div>
              </div>
            )}

            {/* MOCKUP 3: STICKER / ROUNDED STAMP */}
            {previewMockup === 'sticker' && (
              <div style={{
                width: 260, height: 260,
                background: isTransparentBg ? '#ffffff' : bgColor,
                borderRadius: '50%',
                border: `3px dashed ${fgColor}`,
                padding: 20,
                boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                textAlign: 'center'
              }}>
                {frameHeader && <span style={{ fontSize: 11, fontWeight: 900, color: fgColor, letterSpacing: '0.08em' }}>{frameHeader}</span>}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={qrPreviewUrl} alt="QR" style={{ width: 130, height: 130, display: 'block', borderRadius: 6 }} />
                  {logoUrl && (
                    <div style={{
                      position: 'absolute', width: 32, height: 32, borderRadius: 6,
                      background: '#ffffff', border: '1.5px solid var(--glass-border)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2
                    }}>
                      <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
                {frameSubtext && <span style={{ fontSize: 9, fontWeight: 700, color: fgColor, opacity: 0.8 }}>{frameSubtext}</span>}
              </div>
            )}

            {/* Target Data Footer */}
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--cms-text-muted)', textAlign: 'center', maxWidth: 300, wordBreak: 'break-all' }}>
              Target: {qrDataContent}
            </div>

          </div>

          {/* Quick Download Strip */}
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={qrApiUrl}
              download="qrcode-desain.png"
              target="_blank"
              rel="noopener noreferrer"
              className="cms-btn cms-btn-primary"
              style={{ flex: 1, height: 42, borderRadius: 12, fontSize: 12.5, fontWeight: 850, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
            >
              <Download size={15} /> Unduh PNG ({resolution}px)
            </a>
          </div>

        </div>

      </div>

      <MediaGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        onSelect={(url) => {
          setLogoUrl(url);
          if (notify) notify('✅ Logo QR dipilih dari galeri!');
        }}
      />
      </div>
    </div>
  );
};

export default QrStudio;
