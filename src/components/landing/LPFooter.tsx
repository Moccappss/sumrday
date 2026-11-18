import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, MapPin, Send, Link2, MessageCircle, Globe, Camera, Phone, 
  FileText, Share2, MessageSquare, Video, Image, ExternalLink, AtSign,
  Sparkles, ArrowUpRight, CheckCircle2, ChevronRight
} from 'lucide-react';
import CustomSelect from './CustomSelect';
import { useBusinessProfile, buildSocialUrl } from '../../hooks/useBusinessProfile';

const FOOTER_ICON_MAP: Record<string, React.FC<any>> = {
  Mail, MapPin, Send, Link2, MessageCircle, Globe, Camera, Phone, 
  FileText, Share2, MessageSquare, Video, Image, ExternalLink, AtSign
};

interface ContactMethod {
  id: string;
  label: string;
  icon: string;
  value: string;
  enabled: boolean;
}

interface FooterData {
  enabled?: boolean;
  description: string;
  copyright: string;
  email: string;
  location: string;
  brandText?: string;
  collabBadge?: string;
  collabTitle?: string;
  collabSubtitle?: string;
  collabCtaLabel?: string;
  socialTitle?: string;
  formChannelLabel?: string;
  formNamePlaceholder?: string;
  formContactPlaceholder?: string;
  formTypePlaceholder?: string;
  formMessagePlaceholder?: string;
  formSubmitLabel?: string;
  backToTopLabel?: string;
  bottomLinks?: { label: string; url: string }[];
  socialLinks: { id: string; platform: string; url: string; icon: string; }[];
  contactProjectTypes?: string[];
  contactMethods?: ContactMethod[];
}

interface LPFooterProps {
  data: FooterData;
  isDark: boolean;
  accentColor: string;
  localization?: any;
  isEditable?: boolean;
  onUpdateFooter?: (field: string, value: any) => void;
  onUpdateLocalization?: (field: string, value: string) => void;
}

const buildSendUrl = (method: ContactMethod, form: { name: string; email: string; type: string; message: string }) => {
  const subject = encodeURIComponent(`Project Inquiry: ${form.type || 'General'} from ${form.name}`);
  const body    = encodeURIComponent(`${form.message}\n\n---\nNama: ${form.name}\nKontak: ${form.email}`);

  switch (method.id) {
    case 'email':
      return `mailto:${method.value}?subject=${subject}&body=${body}`;
    case 'whatsapp': {
      const phone = method.value.replace(/\D/g, '');
      const wa = encodeURIComponent(`*Pesan Proyek dari ${form.name}*\n*Jenis Proyek:* ${form.type || 'Umum'}\n*Kontak:* ${form.email}\n\n${form.message}`);
      return `https://wa.me/${phone}?text=${wa}`;
    }
    case 'telegram': {
      const username = method.value.replace('@', '');
      const tg = encodeURIComponent(`Pesan Proyek dari ${form.name} (${form.type || 'Umum'})\n\n${form.message}`);
      return `https://t.me/${username}?text=${tg}`;
    }
    default:
      return `mailto:${method.value}?subject=${subject}&body=${body}`;
  }
};

const LPFooter: React.FC<LPFooterProps> = ({
  data,
  isDark,
  accentColor,
  localization,
  isEditable = false,
  onUpdateFooter,
  onUpdateLocalization,
}) => {
  const { profile: businessProfile } = useBusinessProfile();
  const footerData: FooterData = ((data as any)?.footer ? { ...(data as any).footer, ...(data as any) } : (data || {})) as any;
  const loc = localization || (data as any)?.localization || {};

  const editProps = (onSave: (val: string) => void) =>
    isEditable
      ? {
          className: 'lp-footer-editable',
          contentEditable: true,
          suppressContentEditableWarning: true,
          onBlur: (e: React.FocusEvent<HTMLElement>) => {
            onSave(e.currentTarget.textContent ?? '');
          },
          style: { outline: 'none', cursor: 'text', borderRadius: 6 } as React.CSSProperties,
          title: 'Klik untuk langsung mengedit teks ini',
        }
      : {};

  const effectiveEmail = footerData.email || businessProfile?.email || 'hi.sumrday@gmail.com';
  const effectiveLocation = footerData.location || businessProfile?.address || 'Jakarta Selatan, Indonesia';
  const effectiveDescription = footerData.description || businessProfile?.description || 'A little sunshine for your screen — Menghadirkan interaksi digital secara hangat, santai, dan penuh energi positif.';

  const profileSocials = Object.entries(businessProfile?.socials || {})
    .filter(([_, val]) => Boolean(val && val.trim()))
    .map(([platform, val]) => ({
      id: `soc_${platform}`,
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      url: buildSocialUrl(platform, val),
      icon: platform === 'twitter' ? 'Share2' : platform === 'threads' ? 'AtSign' : (FOOTER_ICON_MAP[platform.charAt(0).toUpperCase() + platform.slice(1)] ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Link2')
    }));

  const effectiveSocialLinks = (profileSocials.length > 0)
    ? profileSocials
    : (footerData.socialLinks || []);

  const textColor    = '#ffffff';
  const subTextColor = '#94a3b8';
  const borderColor  = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)';
  const inputBg      = isDark ? '#151824' : '#1b1d28';
  const inputBorder  = isDark ? 'rgba(255, 255, 255, 0.14)' : '#2d3142';
  const sectionBg    = isDark ? '#06070a' : '#0f1117';

  const year = new Date().getFullYear();

  const defaultMethods: ContactMethod[] = [
    { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', value: businessProfile?.whatsapp ? (businessProfile.whatsapp.startsWith('+') ? businessProfile.whatsapp : `+${businessProfile.whatsapp.replace(/[^0-9]/g, '')}`) : '+6281234567890', enabled: true },
    { id: 'email', label: 'Email', icon: 'email', value: effectiveEmail, enabled: true },
    { id: 'telegram', label: 'Telegram', icon: 'telegram', value: businessProfile?.socials?.telegram ? `@${businessProfile.socials.telegram.replace('@', '')}` : '@sumrdayadmin', enabled: true },
  ];
  const activeMethods = (footerData.contactMethods && footerData.contactMethods.length > 0) 
    ? footerData.contactMethods.filter(m => m.enabled && m.value) 
    : defaultMethods;
  const firstMethod = activeMethods[0] || defaultMethods[0];

  const [selectedMethod, setSelectedMethod] = useState<ContactMethod>(firstMethod);
  const [formData, setFormData] = useState({ name: '', contact: '', type: '', message: '' });

  React.useEffect(() => {
    setSelectedMethod(activeMethods[0] || defaultMethods[0]);
  }, [footerData.contactMethods, businessProfile?.whatsapp, businessProfile?.email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      alert('Silakan isi nama dan pesan Anda.');
      return;
    }
    const legacyForm = { name: formData.name, email: formData.contact, type: formData.type, message: formData.message };
    const url = buildSendUrl(selectedMethod, legacyForm);
    window.open(url, '_blank');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 12,
    border: `1px solid ${inputBorder}`,
    background: inputBg,
    color: textColor,
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.25s ease',
  };

  return (
    <footer
      id="contact"
      className="lp-footer-root"
      style={{
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px) calc(72px + env(safe-area-inset-bottom, 24px))',
        background: sectionBg,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        borderRadius: '24px 24px 0 0',
        borderTop: `1px solid ${borderColor}`,
        marginTop: 40,
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* ── Top Collaboration Banner (Golfngv Flat Minimalist Style) ── */}
        <div
          data-reveal="true"
          className="lp-footer-collab-banner"
          style={{
            padding: '44px 40px',
            borderRadius: 24,
            marginBottom: 64,
            background: '#181a24',
            border: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 100,
              background: '#222534',
              color: accentColor,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, display: 'inline-block' }} />
              <span {...editProps((v) => onUpdateFooter?.('collabBadge', v))}>
                {footerData.collabBadge || 'KOLABORASI PROYEK'}
              </span>
            </div>
            <h2
              {...editProps((v) => onUpdateFooter?.('collabTitle', v))}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(28px, 3.4vw, 42px)',
                fontWeight: 800,
                color: textColor,
                margin: '0 0 10px',
                letterSpacing: '-0.025em',
                lineHeight: 1.18,
                ...(isEditable ? { outline: 'none', cursor: 'text' } : {}),
              }}
            >
              {footerData.collabTitle || 'Siap Mewujudkan Proyek Digital Anda?'}
            </h2>
            <p
              {...editProps((v) => onUpdateFooter?.('collabSubtitle', v))}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                color: subTextColor,
                margin: 0,
                lineHeight: 1.65,
                ...(isEditable ? { outline: 'none', cursor: 'text' } : {}),
              }}
            >
              {footerData.collabSubtitle || 'Diskusikan kebutuhan desain, pengembangan website, atau strategi visual brand Anda langsung dengan tim kami.'}
            </p>
          </div>

          {isEditable ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 100,
                background: '#ffffff',
                color: '#111827',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              <span {...editProps((v) => onUpdateFooter?.('collabCtaLabel', v))}>
                {footerData.collabCtaLabel || 'Kirim Pesan Sekarang'}
              </span>
              <ArrowUpRight size={16} />
            </div>
          ) : (
            <a
              href="#contact-form"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 100,
                background: '#ffffff',
                color: '#111827',
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>{footerData.collabCtaLabel || 'Kirim Pesan Sekarang'}</span>
              <ArrowUpRight size={16} />
            </a>
          )}
        </div>

        {/* Section Header */}
        <div id="contact-form" data-reveal="true" style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12, fontWeight: 700, color: accentColor,
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <MessageSquare size={14} />
            <span {...editProps((v) => onUpdateLocalization?.('customProjectSectionTitle', v))}>
              {loc?.customProjectSectionTitle || 'HUBUNGI KAMI'}
            </span>
          </div>
          <h2
            {...editProps((v) => onUpdateLocalization?.('customProjectMainTitle', v))}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(30px, 3.6vw, 44px)',
              fontWeight: 850, color: textColor, margin: 0, letterSpacing: '-0.025em',
              ...(isEditable ? { outline: 'none', cursor: 'text' } : {}),
            }}
          >
            {loc?.customProjectMainTitle || 'Kirimkan Pesan atau Pertanyaan'}
          </h2>
        </div>

        {/* Two-Column Info + Form */}
        <div
          className="lp-footer-main-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 56,
            marginBottom: 72,
            paddingBottom: 72,
            borderBottom: `1px solid ${borderColor}`,
          }}
        >

          {/* Left Column: Info & Social Links */}
          <div data-reveal="true" className="reveal-delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p
              {...editProps((v) => onUpdateFooter?.('description', v))}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 15, color: subTextColor, lineHeight: 1.75,
                margin: 0, maxWidth: 440,
                ...(isEditable ? { outline: 'none', cursor: 'text' } : {}),
              }}
            >
              {effectiveDescription}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(effectiveEmail || isEditable) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: textColor }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  {isEditable ? (
                    <span
                      {...editProps((v) => onUpdateFooter?.('email', v))}
                      style={{ color: textColor, fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, outline: 'none', cursor: 'text' }}
                    >
                      {effectiveEmail}
                    </span>
                  ) : (
                    <a href={`mailto:${effectiveEmail}`} style={{ color: textColor, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700 }}>
                      {effectiveEmail}
                    </a>
                  )}
                </div>
              )}
              {(effectiveLocation || isEditable) && (
                isEditable ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'inherit' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} />
                    </div>
                    <span
                      {...editProps((v) => onUpdateFooter?.('location', v))}
                      style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor, outline: 'none', cursor: 'text' }}
                    >
                      {effectiveLocation}
                    </span>
                  </div>
                ) : (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(effectiveLocation)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'inherit', textDecoration: 'none' }}
                    title="Lihat lokasi di Google Maps"
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} />
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor }}>
                      {effectiveLocation}
                    </span>
                  </a>
                )
              )}
            </div>

            {/* Social Links */}
            {effectiveSocialLinks.length > 0 && (
              <div>
                <div
                  {...editProps((v) => onUpdateFooter?.('socialTitle', v))}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: subTextColor,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                    ...(isEditable ? { outline: 'none', cursor: 'text' } : {}),
                  }}
                >
                  {footerData.socialTitle || 'Ikuti Kami'}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {effectiveSocialLinks.map((social) => {
                    const isCustomSvg = social.icon?.startsWith('http');
                    const Icon = FOOTER_ICON_MAP[social.icon || 'Link2'] || Link2;
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.platform}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          border: `1px solid ${borderColor}`,
                          background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(0,0,0,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: subTextColor,
                          textDecoration: 'none',
                          transition: 'all 0.25s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = accentColor;
                          e.currentTarget.style.borderColor = accentColor;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = subTextColor;
                          e.currentTarget.style.borderColor = borderColor;
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {isCustomSvg ? <img src={social.icon} alt={social.platform} style={{ width: 18, height: 18, objectFit: 'contain' }} /> : <Icon size={18} />}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Form */}
          <form
            data-reveal="true"
            className="reveal-delay-2 lp-footer-form-card"
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: '#15171e',
              padding: '32px 28px',
              borderRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'none',
            }}
          >
            {/* Contact Channel Selector */}
            {activeMethods.length > 1 && (
              <div>
                <div
                  {...editProps((v) => onUpdateFooter?.('formChannelLabel', v))}
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: subTextColor,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                    ...(isEditable ? { outline: 'none', cursor: 'text' } : {}),
                  }}
                >
                  {footerData.formChannelLabel || 'Kirim Melalui Saluran:'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeMethods.map((m) => {
                    const isActive = selectedMethod.id === m.id;
                    const channelColor = m.id === 'whatsapp' ? '#25D366' : m.id === 'telegram' ? '#229ED9' : '#8b5cf6';
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMethod(m);
                          setFormData(prev => ({ ...prev, contact: '' }));
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 16px',
                          borderRadius: 100,
                          border: `1.5px solid ${isActive ? channelColor : 'rgba(255, 255, 255, 0.12)'}`,
                          background: isActive ? `${channelColor}24` : '#1b1d28',
                          color: isActive ? '#ffffff' : '#94a3b8',
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {m.id === 'whatsapp' ? <MessageSquare size={14} /> : m.id === 'telegram' ? <Send size={14} /> : <Mail size={14} />}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name + Contact Info */}
            <div className="lp-footer-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <input
                type="text"
                placeholder={footerData.formNamePlaceholder || 'Nama Lengkap'}
                required={!isEditable}
                value={isEditable ? (footerData.formNamePlaceholder ?? 'Nama Lengkap') : formData.name}
                onChange={(e) => isEditable ? onUpdateFooter?.('formNamePlaceholder', e.target.value) : setFormData({ ...formData, name: e.target.value })}
                title={isEditable ? 'Klik untuk mengedit teks placeholder Nama' : undefined}
                style={{ ...inputStyle, background: '#1b1d28', color: isEditable ? '#cbd5e1' : '#ffffff', border: '1px solid #2d3142' }}
                onFocus={(e) => { e.target.style.borderColor = accentColor; }}
                onBlur={(e) => { e.target.style.borderColor = '#2d3142'; }}
              />
              <input
                type="text"
                placeholder={footerData.formContactPlaceholder || (selectedMethod.id === 'whatsapp' ? 'Nomor WhatsApp' : 'Email / Kontak')}
                value={isEditable ? (footerData.formContactPlaceholder ?? (selectedMethod.id === 'whatsapp' ? 'Nomor WhatsApp' : 'Email / Kontak')) : formData.contact}
                onChange={(e) => isEditable ? onUpdateFooter?.('formContactPlaceholder', e.target.value) : setFormData({ ...formData, contact: e.target.value })}
                title={isEditable ? 'Klik untuk mengedit teks placeholder Kontak' : undefined}
                style={{ ...inputStyle, background: '#1b1d28', color: isEditable ? '#cbd5e1' : '#ffffff', border: '1px solid #2d3142' }}
                onFocus={(e) => { e.target.style.borderColor = accentColor; }}
                onBlur={(e) => { e.target.style.borderColor = '#2d3142'; }}
              />
            </div>

            {/* Project Type */}
            {isEditable ? (
              <div
                style={{
                  ...inputStyle,
                  background: '#1b1d28',
                  border: '1px solid #2d3142',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span {...editProps((v) => onUpdateFooter?.('formTypePlaceholder', v))}>
                  {footerData.formTypePlaceholder || 'Pilih Jenis Proyek'}
                </span>
                <ChevronRight size={15} style={{ transform: 'rotate(90deg)', opacity: 0.6 }} />
              </div>
            ) : (
              <CustomSelect
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val })}
                placeholder={footerData.formTypePlaceholder || 'Pilih Jenis Proyek'}
                isDark={true}
                accentColor={accentColor}
                options={(data?.contactProjectTypes || ['UI/UX Design', 'Branding Identity', 'Web Development', 'Digital Marketing', 'Lainnya']).map((t: string) => ({ value: t, label: t }))}
              />
            )}

            {/* Message Area */}
            <textarea
              placeholder={footerData.formMessagePlaceholder || 'Ceritakan detail proyek atau ide Anda...'}
              required={!isEditable}
              rows={4}
              value={isEditable ? (footerData.formMessagePlaceholder ?? 'Ceritakan detail proyek atau ide Anda...') : formData.message}
              onChange={(e) => isEditable ? onUpdateFooter?.('formMessagePlaceholder', e.target.value) : setFormData({ ...formData, message: e.target.value })}
              title={isEditable ? 'Klik untuk mengedit teks placeholder Pesan' : undefined}
              style={{ ...inputStyle, background: '#1b1d28', color: isEditable ? '#cbd5e1' : '#ffffff', border: '1px solid #2d3142', resize: 'none' }}
              onFocus={(e) => { e.target.style.borderColor = accentColor; }}
              onBlur={(e) => { e.target.style.borderColor = '#2d3142'; }}
            />

            {/* Submit Button */}
            {isEditable ? (
              <div
                style={{
                  padding: '14px 28px',
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Send size={16} />
                <span {...editProps((v) => onUpdateFooter?.('formSubmitLabel', v))}>
                  {footerData.formSubmitLabel || (selectedMethod.id === 'whatsapp' ? 'Kirim WhatsApp' : selectedMethod.id === 'telegram' ? 'Kirim Telegram' : 'Kirim Email')}
                </span>
              </div>
            ) : (
              <button
                type="submit"
                style={{
                  padding: '14px 28px',
                  borderRadius: 100,
                  border: 'none',
                  background: accentColor,
                  color: '#ffffff',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: 'none',
                  transition: 'transform 0.15s ease, opacity 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.opacity = '0.92';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {footerData.formSubmitLabel ? (
                  <><Send size={16} /> {footerData.formSubmitLabel}</>
                ) : selectedMethod.id === 'whatsapp' ? (
                  <><MessageCircle size={16} /> Kirim WhatsApp</>
                ) : selectedMethod.id === 'telegram' ? (
                  <><Send size={16} /> Kirim Telegram</>
                ) : (
                  <><Send size={16} /> Kirim Email</>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Bottom Bar */}
        <div
          className="lp-footer-bottom-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span
              {...editProps((v) => onUpdateFooter?.('brandText', v))}
              style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: accentColor, letterSpacing: '-0.5px', ...(isEditable ? { outline: 'none', cursor: 'text' } : {}) }}
            >
              {footerData.brandText || loc?.logoText || 'sumr.day'}
            </span>
            <span style={{ color: subTextColor, opacity: 0.3 }}>|</span>
            <span
              {...editProps((v) => onUpdateFooter?.('copyright', v))}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: subTextColor, ...(isEditable ? { outline: 'none', cursor: 'text' } : {}) }}
            >
              {footerData.copyright || `© ${year} sumr.day. A little sunshine for your screen.`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20, fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: subTextColor, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {(footerData.bottomLinks && footerData.bottomLinks.length > 0
              ? footerData.bottomLinks
              : [
                  { label: 'Karya', url: '/portfolio' },
                  { label: 'Katalog', url: '/katalog' },
                  { label: 'Jurnal', url: '/blog' },
                ]
            ).map((bl, blIdx, blArr) =>
              isEditable ? (
                <span
                  key={blIdx}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.textContent ?? bl.label;
                    const next = blArr.map((item, k) => (k === blIdx ? { ...item, label: val } : item));
                    onUpdateFooter?.('bottomLinks', next);
                  }}
                  style={{ color: 'inherit', outline: 'none', cursor: 'text' }}
                  title="Klik untuk mengedit teks tautan"
                >
                  {bl.label}
                </span>
              ) : (
                <Link key={blIdx} to={bl.url} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {bl.label}
                </Link>
              )
            )}
            {isEditable ? (
              <span
                {...editProps((v) => onUpdateFooter?.('backToTopLabel', v))}
                style={{ color: 'inherit', font: 'inherit', fontWeight: 600, outline: 'none', cursor: 'text' }}
              >
                {footerData.backToTopLabel || 'Ke Atas ↑'}
              </span>
            ) : (
              <button 
                type="button" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
              >
                {footerData.backToTopLabel || 'Ke Atas ↑'}
              </button>
            )}
          </div>
        </div>

      </div>

      <style>{`
        .lp-footer-form-card input,
        .lp-footer-form-card textarea {
          background: #1b1d28 !important;
          color: #ffffff !important;
          border: 1px solid #2d3142 !important;
          box-shadow: none !important;
        }
        .lp-footer-form-card input::placeholder,
        .lp-footer-form-card textarea::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }
        .lp-footer-editable:hover {
          outline: 1px dashed rgba(255, 255, 255, 0.35) !important;
          outline-offset: 2px;
        }
        .lp-footer-editable:focus {
          outline: 1.5px solid ${accentColor} !important;
          outline-offset: 3px;
          background: rgba(255, 255, 255, 0.05);
        }
        @media (max-width: 768px) {
          #contact {
            padding: 64px 16px calc(48px + env(safe-area-inset-bottom, 16px)) !important;
          }
          .lp-footer-collab-banner {
            padding: 28px 22px !important;
            border-radius: 24px !important;
            margin-bottom: 48px !important;
            text-align: center !important;
            justify-content: center !important;
          }
          .lp-footer-main-grid {
            gap: 32px !important;
            margin-bottom: 44px !important;
            padding-bottom: 44px !important;
          }
          .lp-footer-form-card {
            padding: 22px 18px !important;
            border-radius: 20px !important;
          }
        }
        @media (max-width: 640px) {
          .lp-footer-form-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .lp-footer-bottom-bar {
            flex-direction: column !important;
            justify-content: center !important;
            text-align: center !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default LPFooter;
