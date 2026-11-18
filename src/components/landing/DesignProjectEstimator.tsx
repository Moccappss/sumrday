import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, Sparkles, Check, Clock, ArrowRight, MessageSquare, 
  ShoppingBag, Sliders, Layers, FileCode, CheckCircle2, ShieldCheck, ChevronRight
} from 'lucide-react';
import { haptic } from '../../utils/haptics';

interface DesignProjectEstimatorProps {
  isDark: boolean;
  accentColor?: string;
  studioName?: string;
  studioPhone?: string;
}

interface DesignServiceType {
  id: string;
  name: string;
  basePrice: number;
  baseDays: number;
  description: string;
  icon: string;
  deliverables: string[];
}

const DESIGN_SERVICES: DesignServiceType[] = [
  {
    id: 'branding',
    name: 'Brand Identity & Logo Suite',
    basePrice: 1500000,
    baseDays: 7,
    description: 'Perancangan identitas visual lengkap: logo primer, sekunder, palet warna, tipografi, dan aset pelengkap.',
    icon: 'Palette',
    deliverables: ['Logo Primer & Sekunder', 'Palet Warna & Tipografi', 'File Vector (AI, EPS, SVG)', 'Panduan Singkat Logo']
  },
  {
    id: 'uiux_web',
    name: 'UI/UX & Web Design (Figma)',
    basePrice: 2200000,
    baseDays: 10,
    description: 'Desain website interaktif, landing page responsif, wireframe, dan prototype interaktif siap koding di Figma.',
    icon: 'Layers',
    deliverables: ['Figma Source File Rapi', 'Komponen UI Kit & Design System', 'Desain Desktop & Mobile', 'Prototype Interaktif']
  },
  {
    id: 'social_content',
    name: 'Social Media & Content Kit',
    basePrice: 850000,
    baseDays: 4,
    description: 'Set template visual feed Instagram, carousel edukasi, banner promosi, dan story berkonsep estetik konsisten.',
    icon: 'Sparkles',
    deliverables: ['9-12 Template Feed & Story', 'Template Carousel Edukatif', 'Format Siap Posting (PNG/Canva/AI)', 'Panduan Grid Feed']
  },
  {
    id: 'packaging_print',
    name: 'Packaging & Print Collateral',
    basePrice: 1200000,
    baseDays: 6,
    description: 'Desain kemasan produk, label botol/box, stiker, kartu ucapan, dan merchandise siap cetak dengan ukuran presisi.',
    icon: 'FileCode',
    deliverables: ['Desain Dieline Kemasan Presisi', 'Mockup 3D Realistis', 'File PDF Print-Ready (CMYK)', 'Rekomendasi Finishing Cetak']
  },
  {
    id: 'retainer',
    name: 'Monthly Creative Retainer',
    basePrice: 3500000,
    baseDays: 30,
    description: 'Dukungan desain on-demand setiap bulan untuk kebutuhan campaign visual, revisi berkala, dan aset digital studio.',
    icon: 'ShieldCheck',
    deliverables: ['Kuota 20+ Desain Visual / Bulan', 'Prioritas Pengerjaan Kilat', 'Dedicated Designer', 'Konsultasi Konsep Mingguan']
  }
];

const CONCEPT_OPTIONS = [
  { id: '1-konsep', label: '1 Konsep Terfokus', priceMultiplier: 1.0, desc: 'Eksplorasi mendalam pada 1 arah konsep terkuat' },
  { id: '2-konsep', label: '2 Alternatif Konsep', priceMultiplier: 1.35, desc: 'Dua opsi eksplorasi gaya visual berbeda untuk dipilih' },
  { id: '3-konsep', label: '3 Alternatif Konsep (Rekomendasi)', priceMultiplier: 1.65, desc: 'Tiga variasi konsep komprehensif dari santai hingga formal' }
];

const VISUAL_VIBES = [
  'Warm Tech & Skena Modern',
  'Minimalist & Clean Editorial',
  'Playful, Cheerful & Colorful',
  'Retro Nostalgic 90s/Y2K',
  'Luxury, Elegant & Monik',
  'Bold & High-Contrast Brutalism'
];

const DESIGN_ADDONS = [
  { id: 'brand_guide_book', name: 'Brand Guidelines Book PDF (20+ Hal)', price: 450000, days: 2 },
  { id: 'master_source', name: 'Master Source Pack (AI, Figma, EPS, Font)', price: 350000, days: 0 },
  { id: '3d_mockup', name: '3D High-End Product Mockup Render', price: 300000, days: 1 },
  { id: 'express_lane', name: 'Express Lane (Pengerjaan 50% Lebih Cepat)', price: 600000, days: -3 },
  { id: 'copywriting', name: 'Headline & Micro-Copywriting Studio', price: 250000, days: 1 }
];

const formatRp = (n: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const DesignProjectEstimator: React.FC<DesignProjectEstimatorProps> = ({
  isDark,
  accentColor = '#f59e0b',
  studioName = 'sumr.day Studio',
  studioPhone = '081234567890'
}) => {
  const navigate = useNavigate();

  const [selectedServiceId, setSelectedServiceId] = useState<string>(DESIGN_SERVICES[0].id);
  const [selectedConceptId, setSelectedConceptId] = useState<string>(CONCEPT_OPTIONS[1].id);
  const [selectedVibe, setSelectedVibe] = useState<string>(VISUAL_VIBES[0]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const hex2rgb = (hex: string) => {
    let clean = (hex || '#f59e0b').replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const r = parseInt(clean.substring(0, 2), 16) || 245;
    const g = parseInt(clean.substring(2, 4), 16) || 158;
    const b = parseInt(clean.substring(4, 6), 16) || 11;
    return `${r}, ${g}, ${b}`;
  };

  const accentRgb = hex2rgb(accentColor);

  const currentService = useMemo(() => {
    return DESIGN_SERVICES.find(s => s.id === selectedServiceId) || DESIGN_SERVICES[0];
  }, [selectedServiceId]);

  const currentConcept = useMemo(() => {
    return CONCEPT_OPTIONS.find(c => c.id === selectedConceptId) || CONCEPT_OPTIONS[0];
  }, [selectedConceptId]);

  // Calculations
  const calculatedPrice = useMemo(() => {
    const base = currentService.basePrice * currentConcept.priceMultiplier;
    const addonsSum = selectedAddonIds.reduce((sum, id) => {
      const match = DESIGN_ADDONS.find(a => a.id === id);
      return sum + (match?.price || 0);
    }, 0);
    return Math.round((base + addonsSum) / 10000) * 10000;
  }, [currentService, currentConcept, selectedAddonIds]);

  const calculatedDays = useMemo(() => {
    let days = currentService.baseDays;
    selectedAddonIds.forEach(id => {
      const match = DESIGN_ADDONS.find(a => a.id === id);
      if (match) days += match.days;
    });
    return Math.max(2, days);
  }, [currentService, selectedAddonIds]);

  const toggleAddon = (id: string) => {
    haptic.selection();
    setSelectedAddonIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const recordEstimatorLead = (channel: 'whatsapp' | 'checkout') => {
    try {
      const chosenAddons = DESIGN_ADDONS.filter(a => selectedAddonIds.includes(a.id));
      const leadEntry = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        service: currentService.name,
        concept: currentConcept.label,
        vibe: selectedVibe,
        addons: chosenAddons.map(a => a.name).join(', '),
        estimatedPrice: calculatedPrice,
        timelineDays: calculatedDays,
        channel,
        status: 'prospect'
      };
      const existing = JSON.parse(localStorage.getItem('porto_crm_leads') || '[]');
      existing.unshift(leadEntry);
      localStorage.setItem('porto_crm_leads', JSON.stringify(existing.slice(0, 100)));
      window.dispatchEvent(new CustomEvent('porto_crm_leads_updated', { detail: leadEntry }));
    } catch (_) {}
  };

  const handleOrderEstimator = () => {
    haptic.selection();
    recordEstimatorLead('checkout');
    try {
      const raw = localStorage.getItem('porto_client_cart');
      const currentCart = raw ? JSON.parse(raw) : [];
      const cartItemId = `design_custom_${Date.now()}`;

      const chosenAddons = DESIGN_ADDONS.filter(a => selectedAddonIds.includes(a.id));

      const newCartItem = {
        id: cartItemId,
        productId: `custom_design_${currentService.id}`,
        name: `${currentService.name} (${currentConcept.label})`,
        price: calculatedPrice,
        originalPrice: calculatedPrice,
        quantity: 1,
        category: 'Jasa Desain Studio',
        type: 'Jasa',
        durationDays: calculatedDays,
        deliverables: [
          ...currentService.deliverables,
          `Pilihan Gaya: ${selectedVibe}`,
          ...chosenAddons.map(a => `Add-on: ${a.name}`)
        ],
        serviceDpAllowed: true,
        billingPeriod: currentService.id === 'retainer' ? 'per bulan' : 'per proyek',
        isDigitalAsset: false,
        selectedAddons: chosenAddons
      };

      currentCart.push(newCartItem);
      localStorage.setItem('porto_client_cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('porto_cart_updated'));
      navigate('/keranjang');
    } catch {
      navigate('/keranjang');
    }
  };

  const handleWhatsAppConsult = () => {
    haptic.selection();
    recordEstimatorLead('whatsapp');
    const cleanPhone = (studioPhone || '').replace(/^https?:\/\/wa\.me\//, '').replace(/\D/g, '') || '6281234567890';
    const phone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    
    const chosenAddons = DESIGN_ADDONS.filter(a => selectedAddonIds.includes(a.id));
    const addonText = chosenAddons.length > 0 
      ? `\n➕ Add-on Tambahan:\n` + chosenAddons.map(a => `• ${a.name} (+${formatRp(a.price)})`).join('\n')
      : '';

    const msg = `Halo ${studioName}! Saya telah melakukan simulasi proyek desain melalui website:\n\n` +
      `🎨 *Layanan Desain*: ${currentService.name}\n` +
      `💡 *Eksplorasi Konsep*: ${currentConcept.label}\n` +
      `✨ *Vibe & Karakter Visual*: ${selectedVibe}\n` +
      `⏱️ *Estimasi Timeline*: ±${calculatedDays} hari kerja` +
      addonText +
      `\n\n💰 *Estimasi Total Investasi*: ${formatRp(calculatedPrice)} (Tersedia opsi DP 50%)\n\n` +
      `Apakah jadwal studio tersedia untuk memulai proyek ini? Mohon info alur selanjutnya ya. Terima kasih!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div
      data-reveal="true"
      className="lp-estimator-card"
      style={{
        borderRadius: 24,
        background: isDark ? '#151824' : '#ffffff',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)'}`,
        boxShadow: 'none',
        padding: 'clamp(24px, 4vw, 36px)',
        maxWidth: 1240,
        margin: '0 auto clamp(40px, 6vw, 64px)',
        boxSizing: 'border-box'
      }}
    >
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, paddingBottom: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            <Sliders size={14} />
            <span>Kalkulator Estimasi Desain</span>
          </div>
          <h3 style={{ margin: 0, fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: isDark ? '#ffffff' : '#0f172a' }}>
            Simulasi Kebutuhan & Investasi Studio Desain
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
            Pilih lingkup desain, opsi konsep, dan vibe visual brand Anda untuk mendapatkan estimasi investasi transparan seketika.
          </p>
        </div>

        <div style={{ padding: '6px 14px', borderRadius: 100, background: `rgba(${accentRgb}, 0.12)`, border: `1px solid rgba(${accentRgb}, 0.3)`, color: accentColor, fontSize: 12, fontWeight: 850 }}>
          DP 50% Kick-off Available
        </div>
      </div>

      <div className="lp-estimator-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
        
        {/* Left Column: Selections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* 1. Pilih Kategori Layanan Desain */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#cbd5e1' : '#475569', marginBottom: 8 }}>
              1. Kategori Layanan Desain:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {DESIGN_SERVICES.map(svc => {
                const isSelected = svc.id === selectedServiceId;
                return (
                  <div
                    key={svc.id}
                    onClick={() => {
                      haptic.selection();
                      setSelectedServiceId(svc.id);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: isSelected 
                        ? (isDark ? `rgba(${accentRgb}, 0.18)` : `rgba(${accentRgb}, 0.08)`) 
                        : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      border: `1.5px solid ${isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 850, color: isSelected ? accentColor : (isDark ? '#f8fafc' : '#0f172a') }}>
                        {svc.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
                        Mulai dari {formatRp(svc.basePrice)} • ±{svc.baseDays} hari
                      </div>
                    </div>
                    {isSelected && <Check size={16} color={accentColor} strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Jumlah Konsep Awal */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#cbd5e1' : '#475569', marginBottom: 8 }}>
              2. Eksplorasi Konsep Alternatif:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {CONCEPT_OPTIONS.map(opt => {
                const isSelected = opt.id === selectedConceptId;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      haptic.selection();
                      setSelectedConceptId(opt.id);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: isSelected 
                        ? (isDark ? `rgba(${accentRgb}, 0.18)` : `rgba(${accentRgb}, 0.08)`) 
                        : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      border: `1.5px solid ${isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 850, color: isSelected ? accentColor : (isDark ? '#f8fafc' : '#0f172a') }}>
                      {opt.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Vibe Visual Brand */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#cbd5e1' : '#475569', marginBottom: 8 }}>
              3. Karakter & Gaya Visual (Vibe Brand):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {VISUAL_VIBES.map(vibe => {
                const isSelected = vibe === selectedVibe;
                return (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelectedVibe(vibe);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 100,
                      border: `1px solid ${isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')}`,
                      background: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                      color: isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                      fontSize: 11.5,
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Add-ons & Summary Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Add-ons Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#cbd5e1' : '#475569', marginBottom: 8 }}>
              4. Tambahan Aset & Add-on (Opsional):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {DESIGN_ADDONS.map(addon => {
                const isChecked = selectedAddonIds.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: isChecked 
                        ? (isDark ? `rgba(${accentRgb}, 0.14)` : `rgba(${accentRgb}, 0.06)`) 
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                      border: `1px solid ${isChecked ? accentColor : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor, width: 15, height: 15 }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                        {addon.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>
                      +{formatRp(addon.price)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Real-time Summary Card */}
          <div style={{
            background: isDark ? '#0b1120' : '#f8fafc',
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 20,
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginTop: 'auto'
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: accentColor }}>
                Rincian Estimasi Hasil
              </span>
              <div style={{ fontSize: 16, fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a', fontFamily: "'Outfit', sans-serif", marginTop: 2 }}>
                {currentService.name}
              </div>
              <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                Karakter: {selectedVibe} • {currentConcept.label}
              </div>
            </div>

            {/* Included Deliverables preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '10px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
              {currentService.deliverables.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: isDark ? '#cbd5e1' : '#334155' }}>
                  <Check size={11} color={accentColor} strokeWidth={3} />
                  <span>{d}</span>
                </div>
              ))}
            </div>

            {/* Price & Turnaround Row */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, paddingTop: 12 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: accentColor, fontFamily: "'Outfit', sans-serif" }}>
                  {formatRp(calculatedPrice)}
                </div>
                <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                  Opsi DP 50% = <strong>{formatRp(calculatedPrice / 2)}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: isDark ? '#cbd5e1' : '#475569' }}>
                <Clock size={13} color={accentColor} />
                <span>±{calculatedDays} hari kerja</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleOrderEstimator}
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontSize: 13.5,
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 4px 14px rgba(${accentRgb}, 0.35)`
                }}
              >
                <ShoppingBag size={16} />
                <span>Pesan Desain Ini & Checkout</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppConsult}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 100,
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'}`,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <MessageSquare size={15} />
                <span>Kirim Hasil Simulasi ke WhatsApp</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .lp-estimator-card {
            padding: 20px 14px !important;
            border-radius: 18px !important;
            margin-bottom: 32px !important;
          }
          .lp-estimator-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DesignProjectEstimator;
