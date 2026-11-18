import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Layers, PenTool, Sparkles, ArrowRight, 
  CheckCircle2, Clock, MessageSquare, Receipt, 
  ExternalLink, Search, ChevronRight, ShieldCheck,
  Zap, ArrowUpRight, Calculator
} from 'lucide-react';

interface LPCompanySolutionsProps {
  isDark: boolean;
  accentColor: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  isEditable?: boolean;
  onUpdateBadge?: (val: string) => void;
  onUpdateTitle?: (val: string) => void;
  onUpdateSubtitle?: (val: string) => void;
}

interface SolutionItem {
  id: string;
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  timeline: string;
  startingPrice: string;
  deliverables: string[];
  popular?: boolean;
}

const SOLUTIONS: SolutionItem[] = [
  {
    id: 'sol-web',
    title: 'Interactive Web & Landing Page',
    subtitle: 'Undangan web estetik, landing page produk & portal interaktif',
    description: 'Menghadirkan arsitektur web gesit berkonsep Warm Tech dengan transisi halus, SEO terstruktur, dan dukungan offline PWA.',
    icon: Globe,
    timeline: '7 - 14 Hari Kerja',
    startingPrice: 'Rp 1.500.000',
    popular: true,
    badge: 'Paling Diminati',
    deliverables: [
      'Responsive Mobile-First & PWA Installable',
      'Animasi & Micro-interactions Mulus',
      'Setup Domain Kustom & HTTPS Gratis',
      'Integrasi Form Pemesanan & WhatsApp Direct'
    ]
  },
  {
    id: 'sol-uiux',
    title: 'UI/UX Design & Product Systems',
    subtitle: 'Riset antarmuka aplikasi seluler, figma system & prototipe',
    description: 'Desain visual intuitif yang memanjakan mata pengguna, berlandaskan prinsip atomic design dan panduan handoff siap koding.',
    icon: Layers,
    timeline: '10 - 20 Hari Kerja',
    startingPrice: 'Rp 2.500.000',
    deliverables: [
      'Design System Terstruktur (Figma/Tokens)',
      'High-Fidelity Interactive Prototype',
      'Panduan Flow Pengguna & Wireframing',
      'Aset Ikon & Komponen Siap Eksekusi'
    ]
  },
  {
    id: 'sol-branding',
    title: 'Visual Identity & Skena Branding',
    subtitle: 'Identitas merek berkarakter, typography skena & panduan visual',
    description: 'Membangun karakter visual yang kuat, hangat, dan relevan dengan generasi modern agar brand Anda tampil beda dan mudah diingat.',
    icon: PenTool,
    timeline: '7 - 14 Hari Kerja',
    startingPrice: 'Rp 1.800.000',
    deliverables: [
      'Primary & Secondary Logo Guidelines',
      'Kurasi Palet Warna & Tipografi Skena',
      'Template Konten & Feed Media Sosial',
      'Master File Vektor (SVG, PDF, AI)'
    ]
  },
  {
    id: 'sol-games',
    title: 'Event Activation & Interactive Fun',
    subtitle: 'Mini-game HTML5 & photobooth web untuk aktivasi brand',
    description: 'Solusi interaktif ringan yang memicu viralitas dan antrean seru pada booth pameran, festival musik, maupun perayaan pernikahan.',
    icon: Sparkles,
    timeline: '5 - 12 Hari Kerja',
    startingPrice: 'Rp 2.000.000',
    deliverables: [
      'Game Ringan Berbasis Browser (Zero Install)',
      'Sistem Papan Skor / Leaderboard Realtime',
      'Kustomisasi Branding & Maskot Acara',
      'Aksesibilitas Multi-Device (Tablet / Kiosk)'
    ]
  }
];

export const LPCompanySolutions: React.FC<LPCompanySolutionsProps> = ({
  isDark,
  accentColor = '#2563eb',
  badge,
  title,
  subtitle,
  isEditable = false,
  onUpdateBadge,
  onUpdateTitle,
  onUpdateSubtitle,
}) => {
  const navigate = useNavigate();

  const handleInquireSolution = (sol: SolutionItem) => {
    window.dispatchEvent(
      new CustomEvent('porto_open_inquiry_modal', {
        detail: {
          serviceType: sol.title,
          goals: `Halo sumr.day Studio, saya tertarik untuk konsultasi dan memesan paket ${sol.title}.`,
        },
      })
    );
  };

  const handleOpenTracker = () => {
    window.dispatchEvent(new CustomEvent('porto_open_order_tracker'));
  };

  const handleRequestRfp = () => {
    window.dispatchEvent(
      new CustomEvent('porto_open_inquiry_modal', {
        detail: {
          serviceType: 'Desain Kustom / Konsultasi Lainnya',
          goals: 'Halo sumr.day Studio, kami tertarik untuk konsultasi dan mengajukan proposal proyek kreatif skala kustom.',
        },
      })
    );
  };

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const sectionBg = isDark ? '#06070a' : '#eef2f6';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const cardBg = isDark ? '#151824' : '#ffffff';

  return (
    <section
      id="solutions-matrix"
      style={{
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        background: sectionBg,
        borderBottom: `1px solid ${borderCol}`,
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 48px' }}>
          <div
            data-reveal={isEditable ? undefined : 'true'}
            className={isEditable ? '' : 'reveal-delay-1'}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateBadge?.(e.currentTarget.textContent || '')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 16px',
              borderRadius: 100,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
              border: `1px solid ${borderCol}`,
              marginBottom: 18,
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit badge solusi' : undefined}
          >
            <Zap size={13} color={accentColor} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: accentColor
              }}
            >
              {badge || 'KAPABILITAS & LAYANAN'}
            </span>
          </div>

          <h2
            data-reveal={isEditable ? undefined : 'true'}
            className={isEditable ? '' : 'reveal-delay-2'}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateTitle?.(e.currentTarget.textContent || '')}
            style={{
              margin: '0 0 16px',
              fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: textColor,
              lineHeight: 1.15,
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit judul solusi' : undefined}
          >
            {title || 'Solusi Desain & Digital'}
          </h2>

          <p
            data-reveal={isEditable ? undefined : 'true'}
            className={isEditable ? '' : 'reveal-delay-3'}
            contentEditable={isEditable}
            suppressContentEditableWarning
            onBlur={(e) => onUpdateSubtitle?.(e.currentTarget.textContent || '')}
            style={{
              margin: 0,
              fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
              color: subTextColor,
              lineHeight: 1.7,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
              outline: 'none',
              cursor: isEditable ? 'text' : 'default'
            }}
            title={isEditable ? 'Klik untuk mengedit deskripsi solusi' : undefined}
          >
            {subtitle || 'Dari undangan web interaktif hingga sistem UI/UX digital modern, kami meracik karya dengan perhatian mendalam pada estetika visual dan kecepatan eksekusi.'}
          </p>
        </div>

        {/* 4 Solutions Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: 20,
            marginBottom: 36
          }}
        >
          {SOLUTIONS.map((sol) => {
            const Icon = sol.icon;
            return (
              <div
                key={sol.id}
                data-reveal={isEditable ? undefined : 'true'}
                style={{
                  background: cardBg,
                  borderRadius: 22,
                  border: sol.popular
                    ? `1.5px solid ${accentColor}`
                    : `1px solid ${borderCol}`,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: 'none',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  if (!sol.popular) e.currentTarget.style.borderColor = accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  if (!sol.popular) e.currentTarget.style.borderColor = borderCol;
                }}
              >
                {/* Popular Pill */}
                {sol.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -11,
                      right: 20,
                      background: accentColor,
                      color: '#ffffff',
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '3px 12px',
                      borderRadius: 100,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {sol.badge}
                  </div>
                )}

                {/* Card Icon & Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: `${accentColor}15`,
                      color: accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: '0 0 4px',
                        fontSize: '1.25rem',
                        fontWeight: 850,
                        color: textColor,
                        lineHeight: 1.25
                      }}
                    >
                      {sol.title}
                    </h3>
                    <div style={{ fontSize: 11.5, color: subTextColor }}>
                      {sol.subtitle}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: 13,
                    color: subTextColor,
                    lineHeight: 1.65,
                    margin: '0 0 20px',
                    flex: '0 0 auto'
                  }}
                >
                  {sol.description}
                </p>

                {/* Deliverables Checklist */}
                <div
                  style={{
                    borderTop: `1px solid ${borderCol}`,
                    paddingTop: 16,
                    marginBottom: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                    flex: 1
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: textMutedOrSub(isDark) }}>
                    Cakupan Deliverables:
                  </div>
                  {sol.deliverables.map((d, dIdx) => (
                    <div key={dIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: textColor }}>
                      <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ lineHeight: 1.45 }}>{d}</span>
                    </div>
                  ))}
                </div>

                {/* Metrics: Timeline & Price */}
                <div
                  style={{
                    background: isDark
                      ? `linear-gradient(135deg, ${accentColor}08 0%, rgba(255,255,255,0.02) 100%)`
                      : `linear-gradient(135deg, ${accentColor}06 0%, rgba(0,0,0,0.015) 100%)`,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: `1px solid ${isDark ? `${accentColor}20` : `${accentColor}18`}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                    marginBottom: 16
                  }}
                >
                  {/* Row 1: Estimasi Waktu */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 11, fontWeight: 700, color: subTextColor,
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                      <Clock size={11} color={accentColor} />
                      Estimasi Waktu
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 800, color: textColor,
                      textAlign: 'right', whiteSpace: 'nowrap'
                    }}>
                      {sol.timeline}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }} />

                  {/* Row 2: Mulai Dari */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: subTextColor,
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                      Mulai Dari
                    </div>
                    <div style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 14, fontWeight: 900, color: accentColor,
                      whiteSpace: 'nowrap'
                    }}>
                      {sol.startingPrice}
                    </div>
                  </div>
                </div>

                {/* Direct Action Button */}
                <button
                  type="button"
                  onClick={() => handleInquireSolution(sol)}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: 12,
                    border: 'none',
                    background: sol.popular ? accentColor : (isDark ? `${accentColor}25` : `${accentColor}15`),
                    color: sol.popular ? '#ffffff' : (isDark ? '#ffffff' : accentColor),
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = accentColor;
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = sol.popular ? accentColor : (isDark ? `${accentColor}25` : `${accentColor}15`);
                    e.currentTarget.style.color = sol.popular ? '#ffffff' : (isDark ? '#ffffff' : accentColor);
                  }}
                >
                  <Calculator size={15} />
                  <span>Pesan Ini</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Cross-Feature Action Strip */}
        <div
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: 22,
            border: `1px solid ${borderCol}`,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 280px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                minWidth: 38,
                minHeight: 38,
                aspectRatio: '1 / 1',
                flexShrink: 0,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: textColor }}>
                Sudah memiliki pesanan atau brief aktif di studio kami?
              </div>
              <div style={{ fontSize: 12, color: subTextColor }}>
                Gunakan portal pelacak proyek terintegrasi untuk melihat tahapan pengerjaan secara transparan.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenTracker}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 10,
                border: `1px solid ${borderCol}`,
                background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                color: textColor,
                fontSize: 13,
                fontWeight: 750,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <Search size={14} color={accentColor} />
              <span>Lacak Pesanan</span>
            </button>

            <button
              type="button"
              onClick={handleRequestRfp}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 10,
                border: `1.5px solid ${accentColor}40`,
                background: isDark ? `${accentColor}18` : `${accentColor}10`,
                color: accentColor,
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <Calculator size={14} />
              <span>Hitung Biaya</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/pricing')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 10,
                border: 'none',
                background: accentColor,
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 750,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <span>Lihat Paket</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const textMutedOrSub = (isDark: boolean) => (isDark ? '#94a3b8' : '#64748b');

export default LPCompanySolutions;
