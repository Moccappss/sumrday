import React, { useState } from 'react';
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
  description: string;
  copyright: string;
  email: string;
  location: string;
  socialLinks: { id: string; platform: string; url: string; icon: string; }[];
  contactProjectTypes?: string[];
  contactMethods?: ContactMethod[];
}

interface LPFooterProps {
  data: FooterData;
  isDark: boolean;
  accentColor: string;
  localization?: any;
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

const LPFooter: React.FC<LPFooterProps> = ({ data, isDark, accentColor, localization }) => {
  const { profile: businessProfile } = useBusinessProfile();
  const footerData: FooterData = ((data as any)?.footer ? { ...(data as any).footer, ...(data as any) } : (data || {})) as any;
  const loc = localization || (data as any)?.localization || {};

  const effectiveEmail = footerData.email || businessProfile?.email || 'hi.sumrday@gmail.com';
  const effectiveLocation = footerData.location || businessProfile?.address || 'Jakarta Selatan, Indonesia';
  const effectiveDescription = footerData.description || businessProfile?.description || 'A little sunshine for your screen ☀️ Menghadirkan interaksi digital secara hangat, santai, dan penuh energi positif.';

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

  const textColor    = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inputBg      = isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff';
  const inputBorder  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const sectionBg    = isDark ? '#08080f' : '#ffffff';

  const year = new Date().getFullYear();

  const defaultMethods: ContactMethod[] = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', value: businessProfile?.whatsapp ? (businessProfile.whatsapp.startsWith('+') ? businessProfile.whatsapp : `+${businessProfile.whatsapp.replace(/[^0-9]/g, '')}`) : '+6281234567890', enabled: true },
    { id: 'email', label: 'Email', icon: '✉️', value: effectiveEmail, enabled: true },
    { id: 'telegram', label: 'Telegram', icon: '✈️', value: businessProfile?.socials?.telegram ? `@${businessProfile.socials.telegram.replace('@', '')}` : '@sumrdayadmin', enabled: true },
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
    borderRadius: 14,
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
      style={{
        padding: '110px 24px calc(72px + env(safe-area-inset-bottom, 24px))',
        background: sectionBg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        {/* ── Top Collaboration Banner ── */}
        <div
          data-reveal="true"
          style={{
            padding: '48px 40px',
            borderRadius: 32,
            marginBottom: 72,
            background: isDark
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.12) 50%, rgba(236, 72, 153, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.06) 50%, rgba(236, 72, 153, 0.04) 100%)',
            border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)'}`,
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.4)' : '0 20px 50px rgba(99,102,241,0.06)',
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
              padding: '5px 12px',
              borderRadius: 100,
              background: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              <Sparkles size={13} />
              <span>SIAP MEMULAI KOLABORASI</span>
            </div>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(28px, 3.4vw, 42px)',
              fontWeight: 900,
              color: textColor,
              margin: '0 0 10px',
              letterSpacing: '-0.025em',
              lineHeight: 1.18,
            }}>
              Punya Ide Proyek Hebat? Mari Wujudkan Bersama.
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              color: subTextColor,
              margin: 0,
              lineHeight: 1.65,
            }}>
              Diskusikan kebutuhan desain, pengembangan website, atau strategi visual brand Anda langsung dengan tim kami.
            </p>
          </div>

          <a
            href="#contact-form"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 100,
              background: accentColor,
              color: '#ffffff',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: `0 8px 24px ${accentColor}40`,
              whiteSpace: 'nowrap',
              transition: 'transform 0.25s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>Kirim Pesan Sekarang</span>
            <ArrowUpRight size={16} />
          </a>
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
            <span>{localization?.customProjectSectionTitle || 'HUBUNGI KAMI'}</span>
          </div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 'clamp(30px, 3.6vw, 44px)',
            fontWeight: 850, color: textColor, margin: 0, letterSpacing: '-0.025em',
          }}>
            {localization?.customProjectMainTitle || 'Kirimkan Pesan atau Pertanyaan'}
          </h2>
        </div>

        {/* Two-Column Info + Form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 56,
          marginBottom: 72,
          paddingBottom: 72,
          borderBottom: `1px solid ${borderColor}`,
        }}>

          {/* Left Column: Info & Social Links */}
          <div data-reveal="true" className="reveal-delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15, color: subTextColor, lineHeight: 1.75,
              margin: 0, maxWidth: 440,
            }}>
              {effectiveDescription}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {effectiveEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: textColor }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  <a href={`mailto:${effectiveEmail}`} style={{ color: textColor, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700 }}>
                    {effectiveEmail}
                  </a>
                </div>
              )}
              {effectiveLocation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: textColor }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={18} />
                  </div>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: subTextColor }}>
                    {effectiveLocation}
                  </span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {effectiveSocialLinks.length > 0 && (
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: subTextColor, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Ikuti Kami
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
            className="reveal-delay-2"
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: isDark ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
              padding: '32px 28px',
              borderRadius: 24,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.3)' : '0 10px 28px rgba(0,0,0,0.04)',
            }}
          >
            {/* Contact Channel Selector */}
            {activeMethods.length > 1 && (
              <div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11.5, fontWeight: 700, color: subTextColor, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Kirim Melalui Saluran:
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
                          border: `1.5px solid ${isActive ? channelColor : borderColor}`,
                          background: isActive ? `${channelColor}18` : inputBg,
                          color: isActive ? (isDark ? '#ffffff' : channelColor) : subTextColor,
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name + Contact Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <input
                type="text"
                placeholder="Nama Lengkap"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = accentColor; }}
                onBlur={(e) => { e.target.style.borderColor = inputBorder; }}
              />
              <input
                type="text"
                placeholder={selectedMethod.id === 'whatsapp' ? 'Nomor WhatsApp' : 'Email / Kontak'}
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = accentColor; }}
                onBlur={(e) => { e.target.style.borderColor = inputBorder; }}
              />
            </div>

            {/* Project Type */}
            <CustomSelect
              value={formData.type}
              onChange={(val) => setFormData({ ...formData, type: val })}
              placeholder="Pilih Jenis Proyek"
              isDark={isDark}
              accentColor={accentColor}
              options={(data?.contactProjectTypes || ['UI/UX Design', 'Branding Identity', 'Web Development', 'Digital Marketing', 'Lainnya']).map((t: string) => ({ value: t, label: t }))}
            />

            {/* Message Area */}
            <textarea
              placeholder="Ceritakan detail proyek atau ide Anda..."
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={(e) => { e.target.style.borderColor = accentColor; }}
              onBlur={(e) => { e.target.style.borderColor = inputBorder; }}
            />

            {/* Submit Button */}
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
                boxShadow: `0 8px 24px ${accentColor}40`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 12px 30px ${accentColor}55`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}40`;
              }}
            >
              {selectedMethod.id === 'whatsapp' ? (
                <><MessageCircle size={16} /> Kirim via WhatsApp</>
              ) : selectedMethod.id === 'telegram' ? (
                <><Send size={16} /> Kirim via Telegram</>
              ) : (
                <><Send size={16} /> Kirim Email</>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 900, color: accentColor, letterSpacing: '-0.5px' }}>
              {localization?.logoText || 'Arif.'}
            </span>
            <span style={{ color: subTextColor, opacity: 0.3 }}>|</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: subTextColor }}>
              {data.copyright || `© ${year} Arif Design Studio. Seluruh Hak Cipta Dilindungi.`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20, fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: subTextColor }}>
            <a href="/portfolio" style={{ color: 'inherit', textDecoration: 'none' }}>Portofolio</a>
            <a href="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</a>
            <a href="#hero" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>↑ Kembali ke Atas</a>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          #contact {
            padding: 70px 18px calc(48px + env(safe-area-inset-bottom, 16px)) !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default LPFooter;
