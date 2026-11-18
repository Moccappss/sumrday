import React, { useMemo, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Calculator, Sparkles, ArrowRight, Upload, Image as ImageIcon, Plus, Trash2, Link2, Palette, Check, ShoppingBag, Phone, Sliders, X, MessageCircle, Briefcase, Gamepad2, BookOpen, Globe, ChevronDown, Ban
} from 'lucide-react';

interface HeroCtaButton {
  id: string;
  label: string;
  actionType: 'link' | 'calculator';
  url: string;
  variant: 'solid' | 'outline';
  icon: 'arrow' | 'calculator' | 'sparkles' | 'bag' | 'phone' | 'whatsapp' | 'portfolio' | 'games' | 'blog' | 'globe' | 'none';
}

const HERO_CTA_PRESETS: Omit<HeroCtaButton, 'id'>[] = [
  { label: 'Jelajahi Karya', actionType: 'link', url: '#portfolio', variant: 'solid', icon: 'arrow' },
  { label: 'Update Terbaru', actionType: 'link', url: '#updates', variant: 'solid', icon: 'sparkles' },
  { label: 'Yuk Jajan', actionType: 'link', url: '/katalog', variant: 'outline', icon: 'bag' },
  { label: 'Kalkulator Biaya', actionType: 'calculator', url: '', variant: 'outline', icon: 'calculator' },
  { label: 'Rate Card & Harga', actionType: 'link', url: '/pricing', variant: 'outline', icon: 'sparkles' },
  { label: 'Hubungi Kami', actionType: 'link', url: '#contact', variant: 'outline', icon: 'phone' },
  { label: 'Tentang Studio', actionType: 'link', url: '/about', variant: 'outline', icon: 'globe' },
  { label: 'Portofolio', actionType: 'link', url: '/portfolio', variant: 'solid', icon: 'portfolio' },
  { label: 'Games Seru', actionType: 'link', url: '/games', variant: 'outline', icon: 'games' },
  { label: 'Baca Jurnal', actionType: 'link', url: '/blog', variant: 'outline', icon: 'blog' },
  { label: 'Semua Tautan', actionType: 'link', url: '/links', variant: 'outline', icon: 'globe' },
  { label: 'Chat WhatsApp', actionType: 'link', url: 'https://wa.me/6281234567890', variant: 'outline', icon: 'whatsapp' },
];
import { SocialUpdate } from '../../types/socialUpdates';
import { haptic } from '../../utils/haptics';

interface LPCompanyHeroProps {
  data: any;
  latestUpdate?: SocialUpdate | null;
  isDark: boolean;
  accentColor: string;
  /** Admin mode: renders the exact same layout with inline editing controls */
  editable?: boolean;
  onEdit?: (path: string, value: any) => void;
  onImageAction?: (type: 'company_hero_cover' | 'company_hero_story1' | 'company_hero_story2', mode: 'upload' | 'gallery') => void;
}

const DEFAULT_STATS = [
  { id: 'st-1', label: 'Proyek Selesai', value: '120+', url: '#portfolio' },
  { id: 'st-2', label: 'Klien & Mitra', value: '50+', url: '/about' },
  { id: 'st-3', label: 'Tingkat Kepuasan', value: '99.4%', url: '#testimonials' },
  { id: 'st-4', label: 'Siklus Rilis', value: 'Mingguan', url: '/blog' }
];

export const BG_PATTERNS = [
  { id: 'grid', label: 'Grid Tech' },
  { id: 'dots', label: 'Titik Matrix' },
  { id: 'stripes', label: 'Garis Diagonal' },
  { id: 'waves', label: 'Gelombang Mesh' },
  { id: 'plus', label: 'Plus Arsitektur' },
  { id: 'none', label: 'Polos' },
];

export const LPCompanyHero: React.FC<LPCompanyHeroProps> = ({
  data,
  latestUpdate,
  isDark,
  accentColor = '#2563eb',
  editable = false,
  onEdit,
  onImageAction
}) => {
  const navigate = useNavigate();
  const companyHero = data?.companyHero || {};
  const badgeText = companyHero.badge || 'Studio Digital & Desain Terkurasi';
  const headline = companyHero.headline || data?.navbar?.logoText || 'Merancang Pengalaman Digital Masa Depan';
  const subheadline = companyHero.subheadline || 'Studio Desain & Pengembangan Produk Web Modern';
  const description = companyHero.description || 'Kami merancang dan mempublikasikan aset digital berkualitas tinggi, produk web interaktif, serta sistem antarmuka berstandar internasional untuk mengakselerasi brand dan bisnis Anda.';

  const ctaPrimaryLabel = companyHero.ctaPrimaryLabel || 'Jelajahi Karya';
  const ctaPrimaryUrl = companyHero.ctaPrimaryUrl || '#portfolio';
  const ctaSecondaryLabel = companyHero.ctaSecondaryLabel || 'Kalkulator & Pemesanan';

  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const [editingCtaId, setEditingCtaId] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState(false);
  const bgPattern = companyHero.bgPattern || 'grid';

  const ctaButtons: HeroCtaButton[] = useMemo(() => {
    if (Array.isArray(companyHero.ctaButtons)) {
      return companyHero.ctaButtons;
    }
    return [
      {
        id: 'cta-1',
        label: ctaPrimaryLabel,
        actionType: 'link',
        url: ctaPrimaryUrl,
        variant: 'solid',
        icon: 'arrow',
      },
      {
        id: 'cta-2',
        label: ctaSecondaryLabel,
        actionType: 'calculator',
        url: '',
        variant: 'outline',
        icon: 'calculator',
      },
    ];
  }, [companyHero.ctaButtons, ctaPrimaryLabel, ctaPrimaryUrl, ctaSecondaryLabel]);

  const updateCtaButtons = (next: HeroCtaButton[]) => {
    onEdit?.('companyHero.ctaButtons', next);
  };

  const renderCtaIcon = (icon: HeroCtaButton['icon'], variant: HeroCtaButton['variant']) => {
    if (icon === 'none') return null;
    if (icon === 'arrow') {
      return variant === 'solid'
        ? <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#0f1115', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ArrowUpRight size={14} strokeWidth={2.4} /></span>
        : <ArrowUpRight size={15} />;
    }
    if (icon === 'calculator') return <Calculator size={15} />;
    if (icon === 'sparkles') return <Sparkles size={15} />;
    if (icon === 'bag') return <ShoppingBag size={15} />;
    if (icon === 'phone') return <Phone size={15} />;
    if (icon === 'whatsapp') return <MessageCircle size={15} />;
    if (icon === 'portfolio') return <Briefcase size={15} />;
    if (icon === 'games') return <Gamepad2 size={15} />;
    if (icon === 'blog') return <BookOpen size={15} />;
    if (icon === 'globe') return <Globe size={15} />;
    return null;
  };

  const heroImage = companyHero.coverImage || companyHero.heroImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80';
  const storyImage1 = companyHero.storyImage1 || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80';
  const storyImage2 = companyHero.storyImage2 || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1000&q=80';

  const stats = useMemo(() => {
    if (Array.isArray(companyHero.stats) && companyHero.stats.length > 0) {
      return companyHero.stats;
    }
    return DEFAULT_STATS;
  }, [companyHero.stats]);

  // ── Flat design tokens (zero glow, zero glass) ──
  const pageBg = isDark ? '#06070a' : '#eef2f6';
  const ink = isDark ? '#ffffff' : '#0f1115';
  const sub = isDark ? '#94a3b8' : '#5b6170';
  const surface = isDark ? '#151824' : '#ffffff';
  const surface2 = isDark ? '#1f2436' : '#e2e8f0';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const inkBtnBg = isDark ? '#ffffff' : '#0f1115';
  const inkBtnText = isDark ? '#0f1115' : '#ffffff';
  const accentTint = `color-mix(in srgb, ${accentColor} 14%, transparent)`;

  const handleConsultationClick = () => {
    if (editable) return;
    try { haptic.medium(); } catch { }
    window.dispatchEvent(
      new CustomEvent('porto_open_calculator', {
        detail: {
          service: 'Desain UI/UX & Website',
          description: 'Halo tim sumr.day Studio, saya ingin konsultasi mengenai estimasi proyek dan kalkulator biaya.',
        },
      })
    );
  };

  const handleNavigateOrScroll = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (editable) { e.preventDefault(); return; }
    if (!url) return;
    if (url.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(url);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (url.startsWith('http')) {
      // external link: let browser handle
    } else {
      e.preventDefault();
      try { haptic.light(); } catch { }
      navigate(url);
    }
  };

  // ── Editing helpers (only active in admin) ──
  const txt = (
    Tag: any,
    path: string,
    value: string,
    fallback: string,
    style: React.CSSProperties,
    className?: string
  ) => {
    if (!editable) return <Tag className={className} style={style}>{value}</Tag>;
    return (
      <Tag
        className={className}
        contentEditable
        suppressContentEditableWarning
        title="Klik untuk mengedit"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onBlur={(e: React.FocusEvent<HTMLElement>) => onEdit?.(path, e.currentTarget.textContent?.trim() || fallback)}
        style={{ ...style, outline: 'none', cursor: 'text', borderRadius: 6, boxShadow: 'none' }}
      >
        {value}
      </Tag>
    );
  };

  const urlInput = (path: string, value: string, dark = false) => {
    if (!editable) return null;
    return (
      <span
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 999,
          background: dark ? 'rgba(0,0,0,0.35)' : surface2, color: dark ? '#ffffff' : ink, fontSize: 11
        }}
      >
        <Link2 size={11} style={{ opacity: 0.7, flexShrink: 0 }} />
        <input
          type="text"
          defaultValue={value}
          placeholder="#portfolio, /katalog"
          onBlur={(e) => onEdit?.(path, e.target.value)}
          title="Target link (navigasi)"
          style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', fontSize: 11, width: 92 }}
        />
      </span>
    );
  };

  const imageTools = (type: 'company_hero_cover' | 'company_hero_story1' | 'company_hero_story2') => {
    if (!editable) return null;
    const btn: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999,
      border: 'none', background: '#ffffff', color: '#0f1115', fontSize: 11.5, fontWeight: 700, cursor: 'pointer'
    };
    return (
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 5, display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={btn} onClick={() => onImageAction?.(type, 'upload')}><Upload size={12} /> Upload</button>
        <button type="button" style={btn} onClick={() => onImageAction?.(type, 'gallery')}><ImageIcon size={12} /> Galeri</button>
      </div>
    );
  };

  const updateStat = (idx: number, key: string, value: string) => {
    const next = JSON.parse(JSON.stringify(stats));
    next[idx][key] = value;
    onEdit?.('companyHero.stats', next);
  };

  const hoverScale = (scale: number) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { if (!editable) e.currentTarget.style.transform = `scale(${scale})`; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = 'none'; },
  });

  const arrowChip = (bg: string, color: string, size = 32) => (
    <span style={{ width: size, height: size, borderRadius: '50%', background: bg, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <ArrowUpRight size={15} />
    </span>
  );

  return (
    <div className="lpch-root" style={{ background: pageBg, color: ink, width: '100%', overflowX: 'clip', overflowY: 'visible' }}>
      {/* ══ 1. HERO: SOLID ACCENT BLOCK + PHOTO CARD ══ */}
      <section
        id="hero"
        style={{
          paddingTop: editable ? 24 : 96,
          paddingBottom: 24,
          paddingLeft: 'clamp(16px, 3.5cqw, 24px)',
          paddingRight: 'clamp(16px, 3.5cqw, 24px)',
          maxWidth: 1240,
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <div data-reveal="true" className="lpch-hero-grid">
          {/* Left: solid accent block with customizable animated pattern */}
          <div
            className="lpch-hero-block"
            style={{
              position: 'relative',
              borderRadius: 24,
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)'}`,
              background: accentColor,
              color: '#ffffff',
              padding: 'clamp(24px, 4.5cqw, 56px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 36,
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            {/* Animated Pattern Layer */}
            {bgPattern !== 'none' && (
              <div
                aria-hidden="true"
                className={`lpch-pattern-layer lpch-pattern-${bgPattern}`}
              />
            )}

            {/* Admin Interactive Pattern Switcher Pill */}
            {editable && (
              <div
                style={{ position: 'absolute', top: 18, right: 18, zIndex: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowPatternPicker((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 999,
                    background: '#ffffff',
                    color: '#0f1115',
                    fontSize: 11.5,
                    fontWeight: 750,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.18)'
                  }}
                  title="Ganti pola background gerak di Hero"
                >
                  <Palette size={13} color={accentColor} />
                  <span>Pola: {BG_PATTERNS.find((p) => p.id === bgPattern)?.label || 'Grid Tech'} ▾</span>
                </button>

                {showPatternPicker && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 36,
                      right: 0,
                      background: '#ffffff',
                      color: '#0f1115',
                      borderRadius: 14,
                      padding: 6,
                      boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      minWidth: 170,
                      zIndex: 30,
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}
                  >
                    <div style={{ padding: '4px 8px 6px', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pilih Pola Bergerak
                    </div>
                    {BG_PATTERNS.map((pat) => {
                      const isSelected = bgPattern === pat.id;
                      return (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => {
                            onEdit?.('companyHero.bgPattern', pat.id);
                            setShowPatternPicker(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: isSelected ? 'rgba(0,0,0,0.06)' : 'transparent',
                            color: isSelected ? accentColor : '#0f1115',
                            fontSize: 12,
                            fontWeight: isSelected ? 800 : 600,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span>{pat.label}</span>
                          {isSelected && <Check size={13} color={accentColor} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {txt('h1', 'companyHero.headline', headline, 'sumr.day Studio', {
                margin: 0,
                fontSize: 'clamp(2.2rem, 5.6cqw, 4.6rem)',
                fontWeight: 800,
                letterSpacing: '-0.045em',
                lineHeight: 1.02,
                color: '#ffffff'
              }, 'lpch-h1')}

              {txt('p', 'companyHero.description', description, description, {
                margin: 0,
                fontSize: 'clamp(0.95rem, 1.5cqw, 1.12rem)',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.86)',
                lineHeight: 1.6,
                maxWidth: 520
              })}
            </div>

            {/* CTA row (Customizable & Replaceable Buttons) */}
            <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {ctaButtons.map((btn, bIdx) => {
                  const isSolid = btn.variant === 'solid';
                  const pillStyle: React.CSSProperties = isSolid
                    ? {
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: btn.icon === 'arrow' ? '6px 6px 6px 20px' : '0 20px',
                        height: 44,
                        borderRadius: 999,
                        background: '#ffffff',
                        color: '#0f1115',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 14,
                        border: 'none',
                        cursor: editable ? 'default' : 'pointer',
                        transition: 'transform 0.2s ease',
                        boxSizing: 'border-box',
                      }
                    : {
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0 18px',
                        height: 44,
                        borderRadius: 999,
                        background: 'transparent',
                        border: '1.5px solid rgba(255,255,255,0.55)',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: editable ? 'default' : 'pointer',
                        transition: 'transform 0.2s ease',
                        boxSizing: 'border-box',
                      };

                  if (!editable) {
                    if (btn.actionType === 'calculator') {
                      return (
                        <button
                          key={btn.id || bIdx}
                          type="button"
                          onClick={handleConsultationClick}
                          {...hoverScale(1.03)}
                          style={pillStyle}
                        >
                          {btn.icon !== 'arrow' && renderCtaIcon(btn.icon, btn.variant)}
                          <span>{btn.label}</span>
                          {btn.icon === 'arrow' && renderCtaIcon(btn.icon, btn.variant)}
                        </button>
                      );
                    }
                    return (
                      <a
                        key={btn.id || bIdx}
                        href={btn.url || '#'}
                        onClick={(e) => handleNavigateOrScroll(e, btn.url)}
                        {...hoverScale(1.03)}
                        style={pillStyle}
                      >
                        {btn.icon !== 'arrow' && renderCtaIcon(btn.icon, btn.variant)}
                        <span>{btn.label}</span>
                        {btn.icon === 'arrow' && renderCtaIcon(btn.icon, btn.variant)}
                      </a>
                    );
                  }

                  return (
                    <div key={btn.id || bIdx} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <div style={pillStyle}>
                        {btn.icon !== 'arrow' && renderCtaIcon(btn.icon, btn.variant)}
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const val = e.currentTarget.textContent?.trim() || btn.label;
                            const next = ctaButtons.map((item, k) => (k === bIdx ? { ...item, label: val } : item));
                            updateCtaButtons(next);
                          }}
                          style={{ outline: 'none', cursor: 'text' }}
                          title="Klik untuk edit teks tombol"
                        >
                          {btn.label}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCtaId(editingCtaId === btn.id ? null : btn.id);
                          }}
                          title="Ganti tombol / link / gaya / ikon"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 999,
                            border: isSolid ? '1px solid rgba(15,17,21,0.16)' : '1px solid rgba(255,255,255,0.3)',
                            background: isSolid ? 'rgba(15,17,21,0.08)' : 'rgba(255,255,255,0.12)',
                            color: isSolid ? '#0f1115' : '#ffffff',
                            fontSize: 10.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            maxWidth: 110,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Sliders size={10} />
                          <span>{btn.actionType === 'calculator' ? 'Kalkulator' : (btn.url || '/link')}</span>
                        </button>
                        {btn.icon === 'arrow' && renderCtaIcon(btn.icon, btn.variant)}
                      </div>
                      {ctaButtons.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCtaButtons(ctaButtons.filter((_, k) => k !== bIdx));
                            if (editingCtaId === btn.id) setEditingCtaId(null);
                          }}
                          title="Hapus tombol ini"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.28)',
                            background: 'rgba(239,68,68,0.85)',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {editable && ctaButtons.length < 4 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newBtn: HeroCtaButton = {
                        id: `cta-${Date.now()}`,
                        label: 'Lihat Katalog',
                        actionType: 'link',
                        url: '/katalog',
                        variant: 'outline',
                        icon: 'bag',
                      };
                      updateCtaButtons([...ctaButtons, newBtn]);
                      setEditingCtaId(newBtn.id);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      height: 40,
                      padding: '0 14px',
                      borderRadius: 999,
                      border: '1.5px dashed rgba(255,255,255,0.55)',
                      background: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 750,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} />
                    <span>Tambah Tombol</span>
                  </button>
                )}
              </div>

              {/* Inline CTA Customizer Panel */}
              {editable && editingCtaId && (() => {
                const activeIdx = ctaButtons.findIndex((b) => b.id === editingCtaId);
                const activeBtn = ctaButtons[activeIdx];
                if (!activeBtn) return null;
                const patchBtn = (patch: Partial<HeroCtaButton>) => {
                  updateCtaButtons(ctaButtons.map((b, k) => (k === activeIdx ? { ...b, ...patch } : b)));
                };
                return (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: 4,
                      padding: 14,
                      borderRadius: 16,
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      maxWidth: 480,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#94a3b8' }}>
                        Ganti & Atur Tombol Hero
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingCtaId(null)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2, display: 'inline-flex' }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {HERO_CTA_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => patchBtn(preset)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: '1px solid rgba(255,255,255,0.16)',
                            background: activeBtn.label === preset.label ? accentColor : 'rgba(255,255,255,0.06)',
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Action Type (Rounded Dropdown) + URL */}
                    <div style={{ display: 'grid', gridTemplateColumns: '138px 1fr', gap: 8, alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setOpenActionMenu((v) => !v)}
                          style={{
                            width: '100%',
                            padding: '7px 12px',
                            borderRadius: 999,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: '#1e293b',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}
                        >
                          <span>{activeBtn.actionType === 'calculator' ? 'Kalkulator' : 'Buka Link'}</span>
                          <ChevronDown size={13} style={{ opacity: 0.75, transform: openActionMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                        </button>
                        {openActionMenu && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 6px)',
                              left: 0,
                              width: '100%',
                              padding: 5,
                              borderRadius: 16,
                              background: '#1e293b',
                              border: '1px solid rgba(255,255,255,0.18)',
                              boxShadow: '0 14px 32px rgba(0,0,0,0.45)',
                              zIndex: 30,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            {([
                              { id: 'link', label: 'Buka Link' },
                              { id: 'calculator', label: 'Kalkulator' },
                            ] as const).map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  patchBtn({ actionType: opt.id });
                                  setOpenActionMenu(false);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '7px 11px',
                                  borderRadius: 999,
                                  border: 'none',
                                  background: activeBtn.actionType === opt.id ? accentColor : 'transparent',
                                  color: '#ffffff',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span>{opt.label}</span>
                                {activeBtn.actionType === opt.id && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        disabled={activeBtn.actionType === 'calculator'}
                        value={activeBtn.actionType === 'calculator' ? 'Buka Modal Kalkulator' : (activeBtn.url || '')}
                        onChange={(e) => patchBtn({ url: e.target.value })}
                        placeholder="/katalog, #updates, atau https://..."
                        style={{ padding: '7px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)', background: '#1e293b', color: '#ffffff', fontSize: 12, outline: 'none' }}
                      />
                    </div>

                    {/* Variant + Vector Icon Picker (Zero Emoji) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['solid', 'outline'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => patchBtn({ variant: v })}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 999,
                              border: '1px solid rgba(255,255,255,0.16)',
                              background: activeBtn.variant === v ? accentColor : 'transparent',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 750,
                              cursor: 'pointer',
                            }}
                          >
                            {v === 'solid' ? 'Solid Putih' : 'Outline'}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {([
                          { id: 'arrow', Icon: ArrowUpRight, title: 'Panah' },
                          { id: 'bag', Icon: ShoppingBag, title: 'Belanja / Katalog' },
                          { id: 'calculator', Icon: Calculator, title: 'Kalkulator' },
                          { id: 'sparkles', Icon: Sparkles, title: 'Sparkles' },
                          { id: 'phone', Icon: Phone, title: 'Telepon' },
                          { id: 'whatsapp', Icon: MessageCircle, title: 'Chat / WA' },
                          { id: 'portfolio', Icon: Briefcase, title: 'Portofolio' },
                          { id: 'games', Icon: Gamepad2, title: 'Games' },
                          { id: 'blog', Icon: BookOpen, title: 'Jurnal' },
                          { id: 'globe', Icon: Globe, title: 'Web' },
                          { id: 'none', Icon: Ban, title: 'Tanpa Ikon' },
                        ] as const).map(({ id, Icon, title }) => (
                          <button
                            key={id}
                            type="button"
                            title={title}
                            onClick={() => patchBtn({ icon: id })}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              border: '1px solid rgba(255,255,255,0.16)',
                              background: activeBtn.icon === id ? accentColor : 'rgba(255,255,255,0.05)',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            <Icon size={13} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right: photo card with flat floating pills */}
          <div
            className="lpch-hero-photo"
            style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: surface, border: `1px solid ${cardBorder}`, minHeight: 520 }}
          >
            <img
              src={heroImage}
              alt={headline}
              loading="eager"
              decoding="async"
              {...({ fetchPriority: 'high' } as any)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {imageTools('company_hero_cover')}

            <div
              className="lp-hero-floating-pills"
              style={{ position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 3, display: 'flex', flexWrap: 'wrap', gap: 6 }}
            >
              {['Desain UI/UX', 'Website Interaktif', 'Produk Digital', 'Sistem Terintegrasi', 'Standar Premium'].map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '7px 14px', borderRadius: 999,
                    background: idx === 0 ? accentColor : '#ffffff',
                    color: idx === 0 ? '#ffffff' : '#0f1115',
                    fontSize: 12, fontWeight: 700
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ 2. STORY + BENTO ══ */}
      <section
        style={{
          paddingTop: 'clamp(44px, 6vw, 72px)',
          paddingBottom: 'clamp(48px, 7vw, 80px)',
          paddingLeft: 'clamp(16px, 3.5cqw, 24px)',
          paddingRight: 'clamp(16px, 3.5cqw, 24px)',
          maxWidth: 1240,
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <div data-reveal="true" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {['Cerita Kami', 'Filosofi Studio', 'Standar Mutu'].map((chip, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999,
                background: idx === 0 ? inkBtnBg : surface, color: idx === 0 ? inkBtnText : ink,
                border: idx === 0 ? 'none' : `1px solid ${cardBorder}`,
                fontSize: 12, fontWeight: 700
              }}
            >
              {idx === 0 && <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />}
              {chip}
            </span>
          ))}
        </div>

        <div data-reveal="true" className="lpch-split" style={{ marginBottom: 40 }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, color: ink }}>
            Studio Desain &amp; Sistem Digital Berstandar Tinggi
          </h2>
          <p style={{ margin: 0, fontSize: 'clamp(0.98rem, 1.4vw, 1.08rem)', color: sub, lineHeight: 1.7 }}>
            {subheadline}. Kami menggabungkan presisi teknis, kehangatan estetika visual, serta alur pengerjaan terarah untuk memastikan setiap proyek menghasilkan dampak nyata dan pengalaman pengguna yang memikat.
          </p>
        </div>

        <div data-reveal="true" className="lp-bento-hero-grid lpch-bento">
          {/* Tall story card: photo + flat white info panel */}
          <div
            data-card-3d="true"
            className="lp-bento-card-tall lpch-tall"
            onClick={(e) => handleNavigateOrScroll(e, companyHero.story1Url || '#portfolio')}
            style={{
              position: 'relative', borderRadius: 24, overflow: 'hidden', minHeight: 480, background: surface,
              border: `1px solid ${cardBorder}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12,
              boxSizing: 'border-box', cursor: editable ? 'default' : 'pointer'
            }}
          >
            <img src={storyImage1} alt={companyHero.story1Title || 'Studio Craftsmanship'} loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {imageTools('company_hero_story1')}

            <div style={{ position: 'relative', zIndex: 2, background: isDark ? '#151824' : '#ffffff', border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: accentTint, color: accentColor, fontSize: 11.5, fontWeight: 700, width: 'fit-content' }}>
                <Sparkles size={12} />
                {txt('span', 'companyHero.story1Badge', companyHero.story1Badge || 'Eksplorasi Tanpa Batas', 'Eksplorasi Tanpa Batas', {})}
              </div>
              {txt('h3', 'companyHero.story1Title', companyHero.story1Title || 'Fokus Pada Presisi, Detail, dan Rasa', 'Fokus Pada Presisi, Detail, dan Rasa', {
                margin: 0, fontSize: 21, fontWeight: 800, color: ink, letterSpacing: '-0.03em', lineHeight: 1.2
              })}
              {txt('p', 'companyHero.story1Subtitle', companyHero.story1Subtitle || 'Setiap piksel dan interaksi disusun teliti untuk memberikan kenyamanan eksplorasi terbaik.', 'Setiap piksel dan interaksi disusun teliti untuk memberikan kenyamanan eksplorasi terbaik.', {
                margin: 0, fontSize: 13.5, color: sub, lineHeight: 1.55
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={(e) => handleNavigateOrScroll(e, companyHero.story1Url || '#portfolio')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '5px 5px 5px 16px', borderRadius: 999, background: inkBtnBg, color: inkBtnText, border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  {txt('span', 'companyHero.story1BtnText', companyHero.story1BtnText || 'Lihat Karya', 'Lihat Karya', {})}
                  {arrowChip(accentColor, '#ffffff', 26)}
                </button>
                {urlInput('companyHero.story1Url', companyHero.story1Url || '#portfolio')}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lp-bento-card-right lpch-right" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Story 2: image + text panel */}
            <div
              data-card-3d="true"
              onClick={(e) => handleNavigateOrScroll(e, companyHero.story2Url || '/about')}
              style={{ borderRadius: 24, overflow: 'hidden', background: surface, border: `1px solid ${cardBorder}`, padding: 10, display: 'flex', flexDirection: 'column', gap: 10, boxSizing: 'border-box', cursor: editable ? 'default' : 'pointer' }}
            >
              <div style={{ position: 'relative', width: '100%', height: 190, borderRadius: 16, overflow: 'hidden' }}>
                <img src={storyImage2} alt="Studio Collaboration" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {imageTools('company_hero_story2')}
              </div>
              <div className="lpch-story2-row" style={{ padding: '8px 10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                {txt('p', 'companyHero.story2Text', companyHero.story2Text || 'Didirikan dengan komitmen menghadirkan arsitektur web gesit, aset siap pakai, dan sistem terpadu yang membebaskan waktu Anda untuk berkarya.', 'Didirikan dengan komitmen menghadirkan arsitektur web gesit, aset siap pakai, dan sistem terpadu yang membebaskan waktu Anda untuk berkarya.', {
                  margin: 0, fontSize: 14.5, fontWeight: 600, color: ink, lineHeight: 1.55, flex: 1
                })}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => handleNavigateOrScroll(e, companyHero.story2Url || '/about')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '5px 5px 5px 16px', borderRadius: 999, background: accentColor, color: '#ffffff', border: 'none', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {txt('span', 'companyHero.story2BtnText', companyHero.story2BtnText || 'Tentang Kami', 'Tentang Kami', {})}
                    {arrowChip('#ffffff', '#0f1115', 26)}
                  </button>
                  {urlInput('companyHero.story2Url', companyHero.story2Url || '/about')}
                </div>
              </div>
            </div>

            {/* Stat cards fill remaining height */}
            <div className="lpch-stats" style={{ flex: 1 }}>
              {stats.map((st: any, idx: number) => {
                const isFirst = idx === 0;
                const targetUrl = st.url || (idx === 0 ? '#portfolio' : idx === 1 ? '/about' : idx === 2 ? '#testimonials' : '/blog');
                const fg = isFirst ? inkBtnText : ink;
                return (
                  <div
                    key={st.id || idx}
                    className="lp-company-stat-card"
                    onClick={(e) => handleNavigateOrScroll(e, targetUrl)}
                    {...hoverScale(1.03)}
                    style={{
                      position: 'relative', borderRadius: 22, padding: '18px 18px', background: isFirst ? inkBtnBg : surface, color: fg,
                      border: isFirst ? 'none' : `1px solid ${cardBorder}`,
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10, boxSizing: 'border-box',
                      cursor: editable ? 'default' : 'pointer', minHeight: 116, transition: 'transform 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                      {editable ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => updateStat(idx, 'value', e.currentTarget.textContent || '')}
                          style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, outline: 'none', cursor: 'text' }}
                        >{st.value}</div>
                      ) : (
                        <div style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{st.value}</div>
                      )}
                      {editable && stats.length > 1 ? (
                        <button
                          type="button"
                          title="Hapus kartu"
                          onClick={(e) => { e.stopPropagation(); onEdit?.('companyHero.stats', stats.filter((_: any, i: number) => i !== idx)); }}
                          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.14)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                        ><Trash2 size={12} /></button>
                      ) : (
                        <span style={{ width: 26, height: 26, borderRadius: '50%', background: isFirst ? accentColor : surface2, color: isFirst ? '#ffffff' : ink, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ArrowUpRight size={13} />
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {editable ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => updateStat(idx, 'label', e.currentTarget.textContent || '')}
                          style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.75, outline: 'none', cursor: 'text' }}
                        >{st.label}</div>
                      ) : (
                        <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.75 }}>{st.label}</div>
                      )}
                      {editable && (
                        <input
                          type="text"
                          defaultValue={st.url || ''}
                          placeholder="Link URL..."
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => updateStat(idx, 'url', e.target.value)}
                          style={{ padding: '5px 8px', borderRadius: 10, border: 'none', background: isFirst ? 'rgba(127,127,127,0.18)' : surface2, color: fg, fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
              {editable && (
                <button
                  type="button"
                  onClick={() => onEdit?.('companyHero.stats', [...stats, { id: 'st-' + Date.now(), label: 'Metrik Baru', value: '100+', url: '#portfolio' }])}
                  style={{ borderRadius: 22, minHeight: 116, border: `1.5px dashed ${isDark ? '#2c303b' : '#d5d8de'}`, background: 'transparent', color: sub, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  <Plus size={18} />
                  Tambah Kartu
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .lpch-root { container-type: inline-size; }
        .lpch-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 16px;
          align-items: stretch;
        }
        .lpch-hero-block { min-height: 520px; }

        /* Animated Background Pattern Keyframes & Styles */
        @keyframes lpchMoveGrid {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 40px 40px, 40px 40px; }
        }
        @keyframes lpchMoveDots {
          0% { background-position: 0 0; }
          100% { background-position: 28px 28px; }
        }
        @keyframes lpchMoveStripes {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }
        @keyframes lpchMoveWaves {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 60px 60px, -60px -60px; }
        }
        @keyframes lpchMovePlus {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 36px 36px, 36px 36px; }
        }

        .lpch-pattern-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          z-index: 1;
        }

        .lpch-pattern-grid {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: lpchMoveGrid 24s linear infinite;
        }

        .lpch-pattern-dots {
          background-image: radial-gradient(rgba(255, 255, 255, 0.22) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
          animation: lpchMoveDots 18s linear infinite;
        }

        .lpch-pattern-stripes {
          background-image: repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.08) 0,
            rgba(255, 255, 255, 0.08) 14px,
            transparent 14px,
            transparent 28px
          );
          background-size: 48px 48px;
          animation: lpchMoveStripes 16s linear infinite;
        }

        .lpch-pattern-waves {
          background-image: 
            radial-gradient(ellipse at center, rgba(255, 255, 255, 0.14) 0%, transparent 65%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.06) 25%, transparent 25%);
          background-size: 60px 60px, 60px 60px;
          animation: lpchMoveWaves 26s linear infinite;
        }

        .lpch-pattern-plus {
          background-image: 
            radial-gradient(circle, rgba(255, 255, 255, 0.22) 1.5px, transparent 1.5px),
            linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
          background-size: 36px 36px;
          animation: lpchMovePlus 20s linear infinite;
        }

        .lpch-split {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 32px;
          align-items: end;
        }
        .lpch-bento {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
        }
        .lpch-tall { grid-column: span 5; }
        .lpch-right { grid-column: span 7; }
        .lpch-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
          align-items: stretch;
        }
        @container (max-width: 900px) {
          .lpch-hero-grid, .lpch-split, .lpch-bento { grid-template-columns: minmax(0, 1fr); }
          .lpch-tall, .lpch-right { grid-column: span 1; }
          .lpch-hero-block { min-height: 0; }
          .lpch-hero-photo { min-height: 340px !important; }
          .lpch-tall { min-height: 420px !important; }
          .lpch-split { gap: 14px; }
        }
        @container (max-width: 560px) {
          .lpch-hero-photo { min-height: 260px !important; }
          .lpch-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lpch-story2-row { flex-direction: column; align-items: flex-start !important; }
          .lpch-story2-row > div:last-child { align-items: flex-start !important; }
          .lp-hero-floating-pills span:nth-child(n+4) { display: none; }
        }
      `}</style>
    </div>
  );
};

export default memo(LPCompanyHero);
