import React, { useState, useEffect } from 'react';
import { 
  FileText, PenTool, MessageCircle, ExternalLink, Calendar, 
  Clock, Zap, Check, Info 
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { normalizeGoogleDocUrl } from '../../utils/serviceOrderSync';

export interface ServiceAddonItem {
  id: string;
  name: string;
  price: number;
  days: number;
  desc: string;
}

export const COMMON_SERVICE_ADDONS: ServiceAddonItem[] = [
  { id: 'pwa', name: 'PWA Offline', price: 400000, days: 2, desc: 'Dapat diinstall di smartphone & offline' },
  { id: 'express', name: 'Express Lane', price: 600000, days: -3, desc: 'Prioritas pengerjaan lembur cepat' },
  { id: 'domain_ssl', name: 'Domain SSL', price: 250000, days: 1, desc: 'Setup custom domain & Cloudflare SSL' },
  { id: 'ecommerce', name: 'Toko Online', price: 850000, days: 4, desc: 'Katalog produk & keranjang belanja' },
  { id: 'cms_panel', name: 'CMS Panel', price: 750000, days: 3, desc: 'Dashboard kelola konten mandiri' },
  { id: 'bilingual', name: 'Multi Bahasa', price: 350000, days: 2, desc: 'Dukungan dwibahasa ID & EN' },
  { id: 'payment_gateway', name: 'Payment Gateway', price: 500000, days: 2, desc: 'Integrasi otomatis transfer & QRIS' },
  { id: 'seo_pack', name: 'Optimasi SEO', price: 300000, days: 1, desc: 'Audit meta tags & Google Search index' },
];

export interface ServiceBriefData {
  briefMode: 'gdoc' | 'text' | 'whatsapp';
  googleDocUrl: string;
  notes: string;
  deadline: string;
  daysUntilDeadline: number;
  selectedAddonIds: string[];
  addonsTotal: number;
  addonsList: ServiceAddonItem[];
}

interface ServiceOrderBriefSectionProps {
  isDark: boolean;
  accentColor: string;
  cardBorder: string;
  textColor: string;
  subTextColor: string;
  onChange: (data: ServiceBriefData) => void;
  formatRp: (n: number) => string;
}

export const ServiceOrderBriefSection: React.FC<ServiceOrderBriefSectionProps> = ({
  isDark,
  accentColor,
  cardBorder,
  textColor,
  subTextColor,
  onChange,
  formatRp
}) => {
  const [briefMode, setBriefMode] = useState<'gdoc' | 'text' | 'whatsapp'>('gdoc');
  const [googleDocUrl, setGoogleDocUrl] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  
  // Default deadline: 7 days from now
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  const cardBg = isDark ? '#090a12' : '#f9fafb';

  // Calculate days until deadline
  const daysUntilDeadline = (() => {
    if (!deadline) return 7;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(deadline);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  })();

  const setPresetDeadline = (days: number) => {
    haptic.selection();
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDeadline(d.toISOString().slice(0, 10));
  };

  const toggleAddon = (id: string) => {
    haptic.selection();
    setSelectedAddonIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const activeAddons = COMMON_SERVICE_ADDONS.filter(a => selectedAddonIds.includes(a.id));
  const addonsTotal = activeAddons.reduce((sum, a) => sum + a.price, 0);

  // Propagate to parent form
  useEffect(() => {
    onChange({
      briefMode,
      googleDocUrl: normalizeGoogleDocUrl(googleDocUrl),
      notes: serviceNotes.trim(),
      deadline,
      daysUntilDeadline,
      selectedAddonIds,
      addonsTotal,
      addonsList: activeAddons
    });
  }, [briefMode, googleDocUrl, serviceNotes, deadline, selectedAddonIds]);

  return (
    <div
      style={{
        padding: '14px',
        borderRadius: 16,
        border: `1.5px solid ${accentColor}40`,
        background: isDark ? 'rgba(37,99,235,0.04)' : 'rgba(37,99,235,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}
    >
      {/* Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={15} color={accentColor} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 900, color: textColor, fontFamily: "'Outfit', sans-serif" }}>
            Kebutuhan Jasa
          </span>
          <span title="Informasi brief dan deadline untuk tim studio" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <Info size={12} color={subTextColor} style={{ flexShrink: 0 }} />
          </span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: `${accentColor}15`, color: accentColor }}>
          Info Proyek
        </span>
      </div>

      {/* 1. Format Brief */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>
            Format Brief
          </label>
          <Info size={11} color={subTextColor} title="Pilih cara penyampaian konsep proyek" style={{ flexShrink: 0 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setBriefMode('gdoc');
            }}
            style={{
              padding: '7px 8px',
              borderRadius: 8,
              border: briefMode === 'gdoc' ? `1.5px solid ${accentColor}` : `1px solid ${cardBorder}`,
              background: briefMode === 'gdoc' ? (isDark ? `${accentColor}20` : `${accentColor}08`) : cardBg,
              color: briefMode === 'gdoc' ? accentColor : textColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11.5,
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            <FileText size={13} color={briefMode === 'gdoc' ? accentColor : subTextColor} style={{ flexShrink: 0 }} />
            <span>Google Doc</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setBriefMode('text');
            }}
            style={{
              padding: '7px 8px',
              borderRadius: 8,
              border: briefMode === 'text' ? `1.5px solid ${accentColor}` : `1px solid ${cardBorder}`,
              background: briefMode === 'text' ? (isDark ? `${accentColor}20` : `${accentColor}08`) : cardBg,
              color: briefMode === 'text' ? accentColor : textColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11.5,
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            <PenTool size={13} color={briefMode === 'text' ? accentColor : subTextColor} style={{ flexShrink: 0 }} />
            <span>Catatan Singkat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setBriefMode('whatsapp');
            }}
            style={{
              padding: '7px 8px',
              borderRadius: 8,
              border: briefMode === 'whatsapp' ? `1.5px solid #10b981` : `1px solid ${cardBorder}`,
              background: briefMode === 'whatsapp' ? 'rgba(16,185,129,0.1)' : cardBg,
              color: briefMode === 'whatsapp' ? '#10b981' : textColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              fontSize: 11.5,
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            <MessageCircle size={13} color={briefMode === 'whatsapp' ? '#10b981' : subTextColor} style={{ flexShrink: 0 }} />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Conditional Brief Inputs */}
        {briefMode === 'gdoc' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="url"
                placeholder="https://docs.google.com/document/d/..."
                value={googleDocUrl}
                onChange={(e) => setGoogleDocUrl(e.target.value)}
                style={{
                  flex: 1,
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  color: textColor,
                  fontSize: 12,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {googleDocUrl && (
                <button
                  type="button"
                  onClick={() => window.open(normalizeGoogleDocUrl(googleDocUrl), '_blank', 'noopener,noreferrer')}
                  style={{
                    padding: '0 10px',
                    borderRadius: 8,
                    border: `1px solid ${accentColor}`,
                    background: `${accentColor}15`,
                    color: accentColor,
                    fontSize: 11,
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0
                  }}
                  title="Tes buka tautan dokumen"
                >
                  <ExternalLink size={11} style={{ flexShrink: 0 }} />
                  <span>Tes Buka</span>
                </button>
              )}
            </div>
            <span style={{ fontSize: 10, color: subTextColor, marginTop: 4, display: 'block' }}>
              (i) Pastikan izin akses link dokumen Everyone with link can view
            </span>
          </div>
        )}

        {briefMode === 'whatsapp' && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <MessageCircle size={14} color="#10b981" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: textColor, fontWeight: 700 }}>Brief WhatsApp</span>
            <span style={{ fontSize: 10.5, color: subTextColor }}>(i) Detail kebutuhan dibahas langsung di chat WA</span>
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <textarea
            rows={2}
            placeholder={briefMode === 'text' ? 'Ceritakan gambaran singkat kebutuhan proyek Anda...' : 'Catatan tambahan singkat (opsional)...'}
            value={serviceNotes}
            onChange={(e) => setServiceNotes(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${cardBorder}`,
              background: cardBg,
              color: textColor,
              fontSize: 12,
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* 2. Target Deadline */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>
              Target Deadline
            </label>
            <Info size={11} color={subTextColor} title="Estimasi waktu yang Anda inginkan" style={{ flexShrink: 0 }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 850, color: accentColor, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} style={{ flexShrink: 0 }} />
            <span>~{daysUntilDeadline} Hari</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setPresetDeadline(3)}
            style={{
              padding: '6px 4px',
              borderRadius: 8,
              border: `1px solid ${cardBorder}`,
              background: cardBg,
              color: textColor,
              fontSize: 11,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3
            }}
          >
            <Zap size={11} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>3 Hari</span>
          </button>

          <button
            type="button"
            onClick={() => setPresetDeadline(7)}
            style={{
              padding: '6px 4px',
              borderRadius: 8,
              border: `1px solid ${cardBorder}`,
              background: cardBg,
              color: textColor,
              fontSize: 11,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3
            }}
          >
            <Calendar size={11} color={accentColor} style={{ flexShrink: 0 }} />
            <span>7 Hari</span>
          </button>

          <button
            type="button"
            onClick={() => setPresetDeadline(14)}
            style={{
              padding: '6px 4px',
              borderRadius: 8,
              border: `1px solid ${cardBorder}`,
              background: cardBg,
              color: textColor,
              fontSize: 11,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3
            }}
          >
            <Calendar size={11} color={accentColor} style={{ flexShrink: 0 }} />
            <span>14 Hari</span>
          </button>

          <button
            type="button"
            onClick={() => setPresetDeadline(30)}
            style={{
              padding: '6px 4px',
              borderRadius: 8,
              border: `1px solid ${cardBorder}`,
              background: cardBg,
              color: textColor,
              fontSize: 11,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3
            }}
          >
            <Calendar size={11} color={accentColor} style={{ flexShrink: 0 }} />
            <span>30 Hari</span>
          </button>
        </div>

        <input
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          style={{
            width: '100%',
            height: 38,
            padding: '0 12px',
            borderRadius: 8,
            border: `1px solid ${cardBorder}`,
            background: cardBg,
            color: textColor,
            fontSize: 12,
            fontWeight: 700,
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 3. Pilihan Addon */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 750, color: subTextColor, textTransform: 'uppercase' }}>
              Pilih Addon
            </label>
            <Info size={11} color={subTextColor} title="Fitur opsional tambahan" style={{ flexShrink: 0 }} />
          </div>
          {selectedAddonIds.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, color: accentColor }}>
              +{formatRp(addonsTotal)}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
          {COMMON_SERVICE_ADDONS.map((addon) => {
            const isChecked = selectedAddonIds.includes(addon.id);
            return (
              <div
                key={addon.id}
                onClick={() => toggleAddon(addon.id)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: isChecked ? `1.5px solid ${accentColor}` : `1px solid ${cardBorder}`,
                  background: isChecked ? (isDark ? `${accentColor}18` : `${accentColor}06`) : cardBg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    border: isChecked ? `2px solid ${accentColor}` : `1px solid ${subTextColor}`,
                    background: isChecked ? accentColor : 'transparent',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isChecked && <Check size={10} strokeWidth={3} style={{ flexShrink: 0 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 750, color: textColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {addon.name}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: accentColor }}>
                    +{formatRp(addon.price)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ACC Notice */}
      <div
        style={{
          padding: '8px 10px',
          borderRadius: 8,
          background: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)',
          border: '1px solid rgba(37,99,235,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        <Info size={13} color={accentColor} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 750, color: textColor }}>Antrian ACC</span>
        <span style={{ fontSize: 10.5, color: subTextColor }}>
          (i) Menunggu verifikasi admin sebelum masuk pengerjaan aktif
        </span>
      </div>
    </div>
  );
};

export default ServiceOrderBriefSection;
