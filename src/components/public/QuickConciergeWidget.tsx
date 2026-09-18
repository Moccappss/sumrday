import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Sparkles, Phone, Mail, 
  ExternalLink, Calculator, ChevronRight, Clock, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { storage } from '../../utils/storage';

interface QuickConciergeProps {
  accentColor?: string;
  isDark?: boolean;
}

export const QuickConciergeWidget: React.FC<QuickConciergeProps> = ({ 
  accentColor = '#7c3aed',
  isDark = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'calculator'>('chat');
  const [settings, setSettings] = useState<any>(null);

  // Calculator State
  const [selectedService, setSelectedService] = useState('web');
  const [selectedScale, setSelectedScale] = useState('standard');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    storage.getItem('porto_settings', {}).then(s => setSettings(s || {}));
  }, []);

  const serviceOptions = [
    { id: 'web', name: 'Website / Landing Page', basePrice: 1500000, desc: 'Desain responsif, CMS admin, domain, & hosting' },
    { id: 'design', name: 'Desain Grafis / Branding', basePrice: 800000, desc: 'Logo, visual identity, banner promosi & sosial media' },
    { id: 'video', name: 'Video Editing / Motion', basePrice: 1200000, desc: 'Reels, YouTube editing, animasi logo, & color grading' },
    { id: 'app', name: 'Aplikasi Web Kustom / PWA', basePrice: 3500000, desc: 'Sistem database terintegrasi, fitur login & dashboard' }
  ];

  const scaleOptions = [
    { id: 'starter', name: 'Starter / Personal', multiplier: 1 },
    { id: 'standard', name: 'Bisnis / UMKM', multiplier: 1.5 },
    { id: 'enterprise', name: 'Pro / Skala Besar', multiplier: 2.4 }
  ];

  const currentService = serviceOptions.find(s => s.id === selectedService) || serviceOptions[0];
  const currentScale = scaleOptions.find(sc => sc.id === selectedScale) || scaleOptions[1];
  const estimatedTotal = Math.round(currentService.basePrice * currentScale.multiplier);

  const formatRp = (num: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const handleSendInquiry = () => {
    const waNumber = settings?.contactTarget || settings?.whatsapp || '6281234567890';
    const cleanWa = waNumber.replace(/[^0-9]/g, '');
    const message = `Halo Admin Antigravity! Saya tertarik memesan layanan *${currentService.name}* (Paket ${currentScale.name}). Estimasi perkiraan: *${formatRp(estimatedTotal)}*. Catatan: ${customNotes || 'Mohon informasi alur pengerjaannya.'}`;
    window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99990 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            height: 50,
            padding: '0 20px',
            borderRadius: 100,
            background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #9333ea)',
            color: '#ffffff',
            border: '1.5px solid rgba(255,255,255,0.25)',
            boxShadow: '0 12px 36px var(--cms-accent-soft, rgba(124, 58, 237, 0.45)), 0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: 13,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'cmsFloat 3s ease-in-out infinite'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          title="Bantuan Konsultasi & Estimasi Cepat"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MessageCircle size={20} />
            <span style={{
              position: 'absolute', top: -2, right: -2, width: 8, height: 8,
              borderRadius: '50%', background: '#10b981', border: '1.5px solid #fff'
            }} />
          </div>
          <span>Konsultasi & Estimasi</span>
        </button>
      )}

      {/* Concierge Drawer Window */}
      {isOpen && (
        <div style={{
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          background: isDark ? 'rgba(22, 23, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 24,
          border: `1.5px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          animation: 'cmsModalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed) 0%, #9333ea 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.01em' }}>
                  Concierge Layanan
                </div>
                <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  <span>Online & Siap Berdiskusi</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: 'none', color: '#ffffff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Switcher Tab */}
          <div style={{ display: 'flex', padding: 6, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 10, border: 'none',
                background: activeTab === 'chat' ? (isDark ? '#26283b' : '#ffffff') : 'transparent',
                color: activeTab === 'chat' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: activeTab === 'chat' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <MessageCircle size={13} /> Chat Langsung
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 10, border: 'none',
                background: activeTab === 'calculator' ? (isDark ? '#26283b' : '#ffffff') : 'transparent',
                color: activeTab === 'calculator' ? (isDark ? '#fff' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b'),
                fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: activeTab === 'calculator' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <Calculator size={13} /> Hitung Estimasi
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: 18, maxHeight: 420, overflowY: 'auto' }}>
            {activeTab === 'chat' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  padding: '12px 14px', borderRadius: 14,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  fontSize: 12.5, lineHeight: 1.5, color: isDark ? '#e2e8f0' : '#334155'
                }}>
                  👋 Halo! Punya ide proyek atau butuh bantuan pembuatan website/portofolio? Kirim pesan ke kami sekarang.
                </div>

                {/* Direct Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const wa = settings?.contactTarget || settings?.whatsapp || '6281234567890';
                      window.open(`https://wa.me/${wa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya ingin konsultasi mengenai pembuatan website / portofolio.')}`, '_blank');
                    }}
                    style={{
                      width: '100%', height: 42, borderRadius: 12,
                      background: '#25d366', color: '#ffffff',
                      border: 'none', fontSize: 13, fontWeight: 800,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 6px 20px rgba(37, 211, 102, 0.3)'
                    }}
                  >
                    <MessageCircle size={16} /> Hubungi via WhatsApp
                  </button>

                  <a
                    href="/links"
                    style={{
                      width: '100%', height: 40, borderRadius: 12,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      color: isDark ? '#ffffff' : '#0f172a',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      fontSize: 12.5, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      textDecoration: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <span>Buka Bio Links & Media Sosial</span>
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            ) : (
              /* CALCULATOR TAB */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* 1. Pilih Layanan */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                    1. Jenis Layanan
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {serviceOptions.map(srv => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setSelectedService(srv.id)}
                        style={{
                          padding: '10px 8px', borderRadius: 12,
                          background: selectedService === srv.id ? 'var(--cms-accent-soft, rgba(124, 58, 237, 0.15))' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                          border: `1.5px solid ${selectedService === srv.id ? 'var(--cms-accent, #7c3aed)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}`,
                          color: selectedService === srv.id ? 'var(--cms-accent, #7c3aed)' : (isDark ? '#e2e8f0' : '#334155'),
                          fontSize: 11, fontWeight: 800, cursor: 'pointer', textAlign: 'left'
                        }}
                      >
                        {srv.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Pilih Skala */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                    2. Skala Kebutuhan
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {scaleOptions.map(sc => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setSelectedScale(sc.id)}
                        style={{
                          flex: 1, padding: '7px 4px', borderRadius: 10,
                          background: selectedScale === sc.id ? 'var(--cms-accent, #7c3aed)' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                          color: selectedScale === sc.id ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                          border: 'none', fontSize: 10.5, fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        {sc.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Estimasi Hasil */}
                <div style={{
                  padding: '12px 14px', borderRadius: 14,
                  background: 'var(--cms-accent-soft, rgba(124, 58, 237, 0.12))',
                  border: '1px solid var(--cms-accent, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-accent, #7c3aed)', textTransform: 'uppercase' }}>
                      Perkiraan Investasi
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 950, color: isDark ? '#ffffff' : '#0f172a', marginTop: 2 }}>
                      {formatRp(estimatedTotal)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendInquiry}
                    style={{
                      padding: '8px 14px', borderRadius: 10,
                      background: 'var(--cms-accent, #7c3aed)', color: '#ffffff',
                      border: 'none', fontSize: 11.5, fontWeight: 850,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    <span>Ajukan</span>
                    <Send size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickConciergeWidget;
