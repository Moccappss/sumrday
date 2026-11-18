import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X, QrCode, Share2, Copy, Check, Download, MessageCircle, Send, 
  Sparkles, ExternalLink, ShieldCheck, ChevronRight, Heart, Globe,
  Phone, Mail, ArrowUpRight, ArrowLeft, Gift, Coffee, HelpCircle,
  Clock, ShoppingBag, ChevronDown, CheckCircle2
} from 'lucide-react';
import { storage } from '../utils/storage';
import { 
  BioLinkItem, 
  saveBioLead, 
  formatBioCurrency, 
  getEmbedIframeSrc,
  getContrastTextColor
} from '../types/bioBlocks';

interface ProfileData {
  name: string;
  bio: string;
  avatarUrl: string;
  profileCoverUrl?: string;
  whatsappNumber?: string;
  verifiedBadge?: boolean;
  
  // Backgrounds
  themePreset?: string;
  innerBgType?: 'preset' | 'custom' | 'color';
  innerBgCustomUrl?: string;
  innerBgColor?: string;
  
  outerBgType?: 'preset' | 'custom' | 'color';
  outerBgPreset?: string;
  outerBgCustomUrl?: string;
  outerBgColor?: string;
  
  cardStyle?: 'glass' | 'solid' | 'glow' | 'minimal';
}

type LinkItem = BioLinkItem;

interface BioLinkPageData {
  id: string;
  slug: string;
  title: string;
  isDefault?: boolean;
  profile: ProfileData;
  groups: { id: string; name: string; order: number }[];
  links: LinkItem[];
}

// ── MODULAR BIO BLOCKS SUBCOMPONENTS & UNIVERSAL STYLING ──

export const getBioBlockStyle = (link: BioLinkItem, theme: any, defaultAccent: string) => {
  const accent = link.blockAccentColor || (link.btnBgType === 'solid' ? link.btnBgColor : '') || defaultAccent;
  const isPill = link.btnShape === 'pill';
  const isSquare = link.btnShape === 'square';
  const cardRadius = isPill ? 28 : isSquare ? 10 : 20;
  const btnRadius = isPill ? 100 : isSquare ? 8 : 12;
  const isNeon = link.btnBgType === 'neon';
  const isGlass = link.btnBgType === 'glass';
  const isSolid = link.btnBgType === 'solid';

  let cardBg = link.blockBgColor || theme.cardBg;
  if (link.btnBgType === 'gradient') {
    cardBg = link.btnBgGradient || `linear-gradient(135deg, ${accent}25, rgba(0,0,0,0.5))`;
  } else if (isSolid) {
    cardBg = link.blockBgColor || link.btnBgColor || accent;
  } else if (isGlass) {
    cardBg = link.blockBgColor || 'rgba(255,255,255,0.08)';
  } else if (isNeon) {
    cardBg = link.blockBgColor || 'rgba(0,0,0,0.7)';
  } else if (link.blockBgColor) {
    cardBg = link.blockBgColor;
  }

  // Automatic contrast calculations for sharp readability
  let textColor = link.blockTextColor || link.btnTextColor;
  if (!textColor) {
    if (isSolid && (cardBg.startsWith('#') || cardBg.startsWith('rgb'))) {
      textColor = getContrastTextColor(cardBg, '#0f172a', '#ffffff');
    } else {
      textColor = theme.textColor || '#ffffff';
    }
  }

  const subtextColor = `${textColor}bb`;
  const borderColor = link.blockBorderColor || (isNeon ? accent : `${accent}40`);
  const btnBg = link.blockBtnColor || link.btnBgGradient || `linear-gradient(135deg, ${accent}, #7c3aed)`;
  const btnTextColor = link.blockBtnTextColor || getContrastTextColor(accent, '#0f172a', '#ffffff');
  const animClass = link.animation && link.animation !== 'none' ? `lp-anim-${link.animation}` : '';

  return {
    accent,
    cardRadius,
    btnRadius,
    isNeon,
    isGlass,
    isSolid,
    cardBg,
    textColor,
    subtextColor,
    borderColor,
    btnBg,
    btnTextColor,
    animClass
  };
};

// 1. Lead Magnet Block (Freebie / Contact Collector)
const LeadMagnetBlockView: React.FC<{
  link: BioLinkItem;
  theme: any;
  slug: string;
}> = ({ link, theme, slug }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const style = getBioBlockStyle(link, theme, '#ec4899');
  const btnBg = link.blockBtnColor || (link.btnBgGradient || `linear-gradient(135deg, ${style.accent}, #ec4899)`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Mohon isi nama dan nomor WhatsApp');
      return;
    }
    setIsSubmitting(true);
    await saveBioLead({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      resourceTitle: link.title,
      pageSlug: slug
    });
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div
      className={`lp-block-item ${style.animClass}`}
      style={{
        background: style.cardBg,
        border: style.isNeon ? `2px solid ${style.accent}` : `1.5px solid ${style.borderColor}`,
        borderRadius: style.cardRadius,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: style.isNeon ? `0 0 20px ${style.accent}66, inset 0 0 8px ${style.accent}22` : '0 8px 24px rgba(0,0,0,0.18)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 850,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '3px 10px',
          borderRadius: 100,
          background: `${style.accent}25`,
          color: style.accent,
          border: `1px solid ${style.accent}40`,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <Gift size={12} /> {link.leadBadge || 'Free Download'}
        </span>
        <Sparkles size={14} color={style.accent} />
      </div>

      <div>
        <h3 style={{ fontSize: 14.5, fontWeight: 900, color: style.textColor, margin: 0 }}>
          {link.title}
        </h3>
        {link.subtitle && (
          <p style={{ fontSize: 11.5, color: style.subtextColor, margin: '4px 0 0', lineHeight: 1.4 }}>
            {link.subtitle}
          </p>
        )}
      </div>

      {isSuccess ? (
        <div style={{
          background: `${style.accent}20`,
          border: `1px solid ${style.accent}40`,
          borderRadius: 14,
          padding: 14,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle2 size={24} color={style.accent} />
          <div style={{ fontSize: 12.5, fontWeight: 800, color: style.textColor }}>
            {link.leadSuccessMsg || 'Akses berhasil dibuka! Silakan unduh file Anda:'}
          </div>
          <a
            href={link.leadDownloadUrl || link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 18px',
              borderRadius: style.btnRadius,
              background: btnBg,
              color: style.btnTextColor,
              fontWeight: 850,
              fontSize: 12,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: `0 4px 14px ${style.accent}66`
            }}
          >
            <Download size={14} /> Unduh File Sekarang
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            placeholder="Nama lengkap Anda..."
            value={name}
            onChange={e => setName(e.target.value)}
            required
            style={{
              width: '100%', height: 36, padding: '0 12px',
              borderRadius: 10, border: `1px solid ${style.borderColor}`,
              background: 'rgba(0,0,0,0.25)', color: style.textColor,
              fontSize: 12, outline: 'none', boxSizing: 'border-box'
            }}
          />
          <input
            type="tel"
            placeholder="No WhatsApp (contoh: 08123456789)..."
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            style={{
              width: '100%', height: 36, padding: '0 12px',
              borderRadius: 10, border: `1px solid ${style.borderColor}`,
              background: 'rgba(0,0,0,0.25)', color: style.textColor,
              fontSize: 12, outline: 'none', boxSizing: 'border-box'
            }}
          />
          <input
            type="email"
            placeholder="Email (opsional)..."
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', height: 36, padding: '0 12px',
              borderRadius: 10, border: `1px solid ${style.borderColor}`,
              background: 'rgba(0,0,0,0.25)', color: style.textColor,
              fontSize: 12, outline: 'none', boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%', height: 38,
              borderRadius: style.btnRadius, border: 'none',
              background: btnBg,
              color: style.btnTextColor, fontWeight: 850, fontSize: 12,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, opacity: isSubmitting ? 0.7 : 1,
              boxShadow: `0 4px 14px ${style.accent}55`
            }}
          >
            <Download size={14} />
            {isSubmitting ? 'Memproses...' : (link.leadButtonText || 'Klaim & Download File Gratis')}
          </button>
        </form>
      )}
    </div>
  );
};

// 2. Tip Jar Block (Traktir Kopi / Dukungan Apresiasi)
const TipJarBlockView: React.FC<{
  link: BioLinkItem;
  theme: any;
  defaultWa?: string;
}> = ({ link, theme, defaultWa }) => {
  const presetAmounts = link.tipAmounts && link.tipAmounts.length > 0
    ? link.tipAmounts
    : [10000, 25000, 50000, 100000];
  const [selectedAmount, setSelectedAmount] = useState(presetAmounts[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [copiedSaweria, setCopiedSaweria] = useState(false);

  const style = getBioBlockStyle(link, theme, '#f59e0b');
  const btnBg = link.blockBtnColor || `linear-gradient(135deg, ${style.accent}, #ea580c)`;

  // Available Payment Methods
  const availableMethods = useMemo(() => {
    const pref = link.tipPreferredMethod || 'all';
    const list: { id: 'qris' | 'saweria' | 'whatsapp'; label: string; icon: any }[] = [];
    if (pref === 'all') {
      list.push({ id: 'qris', label: 'QRIS', icon: QrCode });
      list.push({ id: 'saweria', label: 'Saweria', icon: ExternalLink });
      list.push({ id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle });
    } else if (pref === 'qris') {
      list.push({ id: 'qris', label: 'QRIS', icon: QrCode });
    } else if (pref === 'saweria') {
      list.push({ id: 'saweria', label: 'Saweria', icon: ExternalLink });
    } else if (pref === 'whatsapp') {
      list.push({ id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle });
    }
    return list;
  }, [link.tipPreferredMethod]);

  const [activeMethod, setActiveMethod] = useState<'qris' | 'saweria' | 'whatsapp'>(() => {
    if (link.tipPreferredMethod && link.tipPreferredMethod !== 'all') {
      return link.tipPreferredMethod;
    }
    if (link.tipSaweriaUrl) return 'saweria';
    if (link.tipQrisImageUrl) return 'qris';
    return 'qris';
  });

  useEffect(() => {
    if (!availableMethods.some(m => m.id === activeMethod)) {
      setActiveMethod(availableMethods[0]?.id || 'qris');
    }
  }, [availableMethods, activeMethod]);

  const finalAmount = customAmount ? parseInt(customAmount) || 0 : selectedAmount;
  const amountStr = formatBioCurrency(finalAmount);

  const handleSendWa = () => {
    const wa = link.tipRecipientWa || defaultWa || '6281234567890';
    const cleanWa = wa.replace(/[^0-9]/g, '');
    const text = `Halo! Saya ${senderName || 'Teman Kreatif'} ingin memberikan apresiasi/traktir kopi sebesar ${amountStr}.${message ? `\n\nPesan: "${message}"` : ''}\n\nMohon info nomor rekening / konfirmasi penerimaan, terima kasih.`;
    window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const saweriaUrl = link.tipSaweriaUrl || 'https://saweria.co';
  const handleOpenSaweria = () => {
    window.open(saweriaUrl, '_blank');
  };
  const handleCopySaweria = () => {
    navigator.clipboard.writeText(saweriaUrl);
    setCopiedSaweria(true);
    setTimeout(() => setCopiedSaweria(false), 2000);
  };

  const qrisUrl = link.tipQrisImageUrl || `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(`QRIS-TRAKTIR-KOPI-${finalAmount}`)}&color=000000&bgcolor=ffffff`;

  return (
    <div
      className={`lp-block-item ${style.animClass}`}
      style={{
        background: style.cardBg,
        border: style.isNeon ? `2px solid ${style.accent}` : `1.5px solid ${style.borderColor}`,
        borderRadius: style.cardRadius,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: style.isNeon ? `0 0 20px ${style.accent}66, inset 0 0 8px ${style.accent}22` : '0 8px 24px rgba(0,0,0,0.18)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: `${style.accent}25`,
            color: style.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Coffee size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: style.textColor }}>
              {link.title || 'Traktir Kopi / Dukungan Kreator'}
            </div>
            <div style={{ fontSize: 11, color: style.subtextColor }}>
              {link.subtitle || 'Dukungan Anda membantu kami terus berkarya'}
            </div>
          </div>
        </div>
      </div>

      {/* Preset Amounts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {presetAmounts.map((amt) => {
          const isSelected = selectedAmount === amt && !customAmount;
          return (
            <button
              key={amt}
              type="button"
              onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
              style={{
                padding: '8px 2px',
                borderRadius: 10,
                border: `1.5px solid ${isSelected ? style.accent : style.borderColor}`,
                background: isSelected ? `${style.accent}25` : 'rgba(255,255,255,0.04)',
                color: isSelected ? style.accent : style.textColor,
                fontSize: 11,
                fontWeight: 850,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              {amt >= 1000 ? `${amt / 1000}k` : amt}
            </button>
          );
        })}
      </div>

      {/* Payment Method Selector Tabs */}
      {availableMethods.length > 1 && (
        <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.25)', padding: 4, borderRadius: 12, border: `1px solid ${style.borderColor}` }}>
          {availableMethods.map(m => {
            const isCurrent = activeMethod === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMethod(m.id)}
                style={{
                  flex: 1, height: 32, borderRadius: 8,
                  border: 'none',
                  background: isCurrent ? style.accent : 'transparent',
                  color: isCurrent ? '#ffffff' : style.subtextColor,
                  fontSize: 11, fontWeight: 850,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                <m.icon size={13} /> {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Method: QRIS */}
      {activeMethod === 'qris' && (
        <div style={{
          padding: 14, borderRadius: 14,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${style.borderColor}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center'
        }}>
          <div style={{ width: 140, height: 140, borderRadius: 12, overflow: 'hidden', background: '#ffffff', padding: 8, boxSizing: 'border-box', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            <img src={qrisUrl} alt="QRIS Barcode" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ fontSize: 11, color: style.subtextColor }}>
            Scan dengan BCA, GoPay, OVO, ShopeePay, DANA, atau mobile banking ({amountStr})
          </div>
          <div style={{ display: 'flex', gap: 6, width: '100%' }}>
            <a
              href={qrisUrl}
              download="qris-traktir-kopi.png"
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1, height: 34, borderRadius: 10,
                border: `1px solid ${style.borderColor}`,
                background: 'rgba(255,255,255,0.08)',
                color: style.textColor, fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                textDecoration: 'none'
              }}
            >
              <Download size={13} /> Unduh QRIS
            </a>
            <button
              type="button"
              onClick={handleSendWa}
              style={{
                flex: 1, height: 34, borderRadius: 10,
                border: 'none',
                background: btnBg,
                color: style.btnTextColor, fontSize: 11, fontWeight: 850,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${style.accent}55`
              }}
            >
              <MessageCircle size={13} /> Konfirmasi WA
            </button>
          </div>
        </div>
      )}

      {/* Method: Saweria / Trakteer */}
      {activeMethod === 'saweria' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            padding: 12, borderRadius: 14,
            background: `${style.accent}15`,
            border: `1px solid ${style.accent}30`,
            display: 'flex', flexDirection: 'column', gap: 6
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: style.accent, display: 'flex', alignItems: 'center', gap: 5 }}>
              <ExternalLink size={12} /> Halaman Saweria / Trakteer Kreator
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 8,
              fontSize: 11, color: style.textColor, wordBreak: 'break-all'
            }}>
              <span>{saweriaUrl}</span>
              <button
                type="button"
                onClick={handleCopySaweria}
                style={{
                  background: 'transparent', border: 'none',
                  color: copiedSaweria ? '#10b981' : style.subtextColor,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10.5, fontWeight: 700, padding: '2px 6px', flexShrink: 0
                }}
                title="Salin Link Saweria"
              >
                {copiedSaweria ? <Check size={12} /> : <Copy size={12} />}
                {copiedSaweria ? 'Tersalin' : 'Salin'}
              </button>
            </div>
            <div style={{ fontSize: 10.5, color: style.subtextColor }}>
              Mendukung otomatis GoPay, OVO, DANA, ShopeePay, LinkAja & QRIS.
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenSaweria}
            style={{
              width: '100%', height: 40,
              borderRadius: style.btnRadius, border: 'none',
              background: btnBg,
              color: style.btnTextColor, fontWeight: 850, fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              boxShadow: `0 4px 14px ${style.accent}55`
            }}
          >
            <ExternalLink size={14} /> Buka Halaman Saweria ({amountStr})
          </button>
        </div>
      )}

      {/* Method: WhatsApp */}
      {activeMethod === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="text"
              placeholder="Nama Anda (opsional)..."
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              style={{
                width: '100%', height: 34, padding: '0 12px',
                borderRadius: 10, border: `1px solid ${style.borderColor}`,
                background: 'rgba(0,0,0,0.25)', color: style.textColor,
                fontSize: 11.5, outline: 'none', boxSizing: 'border-box'
              }}
            />
            <input
              type="text"
              placeholder="Pesan dukungan / semangat..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{
                width: '100%', height: 34, padding: '0 12px',
                borderRadius: 10, border: `1px solid ${style.borderColor}`,
                background: 'rgba(0,0,0,0.25)', color: style.textColor,
                fontSize: 11.5, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleSendWa}
            style={{
              width: '100%', height: 38,
              borderRadius: style.btnRadius, border: 'none',
              background: btnBg,
              color: style.btnTextColor, fontWeight: 850, fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
              boxShadow: `0 4px 14px ${style.accent}55`
            }}
          >
            <MessageCircle size={14} /> Kirim via WhatsApp ({amountStr})
          </button>
        </div>
      )}
    </div>
  );
};

// 3. Accordion FAQ Block
const AccordionBlockView: React.FC<{
  link: BioLinkItem;
  theme: any;
}> = ({ link, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const style = getBioBlockStyle(link, theme, '#3b82f6');

  return (
    <div
      className={`lp-block-item ${style.animClass}`}
      style={{
        background: style.cardBg,
        border: style.isNeon ? `2px solid ${style.accent}` : `1px solid ${style.borderColor}`,
        borderRadius: style.cardRadius,
        overflow: 'hidden',
        transition: 'all 0.25s ease'
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${style.accent}25`,
            color: style.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <HelpCircle size={15} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: style.textColor }}>
            {link.title}
          </span>
        </div>
        <ChevronDown
          size={16}
          style={{
            color: style.subtextColor,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          padding: '0 16px 14px 48px',
          fontSize: 12,
          color: style.subtextColor,
          lineHeight: 1.55,
          borderTop: `1px dashed ${style.borderColor}`,
          marginTop: 2,
          paddingTop: 10
        }}>
          {link.accordionContent || link.subtitle || 'Belum ada konten penjelasan.'}
        </div>
      )}
    </div>
  );
};

// 4. Countdown Timer Promo Block
const CountdownBlockView: React.FC<{
  link: BioLinkItem;
  theme: any;
}> = ({ link, theme }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number; expired: boolean }>({
    d: 0, h: 0, m: 0, s: 0, expired: false
  });

  const style = getBioBlockStyle(link, theme, '#ef4444');
  const btnBg = link.blockBtnColor || (link.btnBgGradient || `linear-gradient(135deg, ${style.accent}, #ea580c)`);

  useEffect(() => {
    const targetTime = link.countdownTargetDate ? new Date(link.countdownTargetDate).getTime() : Date.now() + 86400000;

    const calc = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true });
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft({ d, h, m, s, expired: false });
    };

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [link.countdownTargetDate]);

  return (
    <div
      className={`lp-block-item ${style.animClass}`}
      style={{
        background: style.cardBg,
        border: style.isNeon ? `2px solid ${style.accent}` : `1.5px solid ${style.borderColor}`,
        borderRadius: style.cardRadius,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: style.isNeon ? `0 0 20px ${style.accent}66, inset 0 0 8px ${style.accent}22` : `0 8px 24px ${style.accent}25`
      }}
    >
      {link.countdownImageUrl && (
        <div style={{
          width: '100%',
          height: 140,
          borderRadius: 14,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
        }}>
          <img
            src={link.countdownImageUrl}
            alt={link.title || 'Flash Sale'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 70%)'
          }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 850, letterSpacing: '0.06em',
          padding: '3px 10px', borderRadius: 100,
          background: style.accent, color: '#ffffff',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <Clock size={11} /> {link.countdownBadge || 'PROMO TERBATAS'}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: style.accent }}>
          {timeLeft.expired ? 'Berakhir' : 'Segera Berakhir!'}
        </span>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 900, color: style.textColor }}>
          {link.title}
        </div>
        {link.subtitle && (
          <div style={{ fontSize: 11, color: style.subtextColor, marginTop: 2 }}>
            {link.subtitle}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, textAlign: 'center' }}>
        {[
          { label: 'HARI', val: timeLeft.d },
          { label: 'JAM', val: timeLeft.h },
          { label: 'MENIT', val: timeLeft.m },
          { label: 'DETIK', val: timeLeft.s },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'rgba(0,0,0,0.35)',
            border: `1px solid ${style.accent}30`,
            borderRadius: 10,
            padding: '8px 0'
          }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: style.accent, fontFamily: 'monospace' }}>
              {String(item.val).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 9, fontWeight: 800, color: style.subtextColor, marginTop: 2 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {link.url && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: '100%', height: 38,
            borderRadius: style.btnRadius,
            background: btnBg,
            color: style.btnTextColor, fontWeight: 850, fontSize: 12,
            textDecoration: 'none', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: `0 4px 14px ${style.accent}55`
          }}
        >
          Ambil Promo Sekarang <ArrowUpRight size={14} />
        </a>
      )}
    </div>
  );
};

// 5. Product Card Block
const ProductCardBlockView: React.FC<{
  link: BioLinkItem;
  theme: any;
}> = ({ link, theme }) => {
  const style = getBioBlockStyle(link, theme, '#10b981');
  const btnBg = link.blockBtnColor || (link.btnBgGradient || `linear-gradient(135deg, ${style.accent}, #059669)`);

  return (
    <div
      className={`lp-block-item ${style.animClass}`}
      style={{
        background: style.cardBg,
        border: style.isNeon ? `2px solid ${style.accent}` : `1.5px solid ${style.borderColor}`,
        borderRadius: style.cardRadius,
        overflow: 'hidden',
        boxShadow: style.isNeon ? `0 0 20px ${style.accent}66` : '0 8px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {link.coverImageUrl && (
        <div style={{ width: '100%', height: 140, position: 'relative', overflow: 'hidden' }}>
          <img src={link.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {link.productBadge && (
            <span style={{
              position: 'absolute', top: 10, left: 10,
              fontSize: 9.5, fontWeight: 900, padding: '3px 8px', borderRadius: 100,
              background: 'rgba(0,0,0,0.7)', color: '#ffffff',
              backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              {link.productBadge}
            </span>
          )}
        </div>
      )}

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: style.textColor }}>
            {link.title}
          </div>
          {link.subtitle && (
            <div style={{ fontSize: 11, color: style.subtextColor, marginTop: 2, lineHeight: 1.4 }}>
              {link.subtitle}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
          {link.productPrice !== undefined && (
            <span style={{ fontSize: 16, fontWeight: 900, color: style.accent }}>
              {formatBioCurrency(link.productPrice)}
            </span>
          )}
          {link.productOriginalPrice && (
            <span style={{ fontSize: 11, color: style.subtextColor, textDecoration: 'line-through' }}>
              {formatBioCurrency(link.productOriginalPrice)}
            </span>
          )}
        </div>

        <a
          href={link.url || '/shop'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: '100%', height: 38,
            borderRadius: style.btnRadius,
            background: btnBg,
            color: style.btnTextColor, fontWeight: 850, fontSize: 12,
            textDecoration: 'none', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: `0 4px 14px ${style.accent}55`
          }}
        >
          <ShoppingBag size={14} /> {link.productButtonText || 'Beli Sekarang'}
        </a>
      </div>
    </div>
  );
};

// 6. Media Embed Block
const EmbedBlockView: React.FC<{
  link: BioLinkItem;
  theme: any;
}> = ({ link, theme }) => {
  const { src, type } = getEmbedIframeSrc(link.embedUrl || link.url);
  const style = getBioBlockStyle(link, theme, '#a855f7');

  return (
    <div
      className={`lp-block-item ${style.animClass}`}
      style={{
        background: style.cardBg,
        border: style.isNeon ? `2px solid ${style.accent}` : `1px solid ${style.borderColor}`,
        borderRadius: style.cardRadius,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: style.isNeon ? `0 0 20px ${style.accent}66` : '0 8px 24px rgba(0,0,0,0.18)'
      }}
    >
      {link.title && (
        <div style={{ fontSize: 12.5, fontWeight: 850, color: style.textColor, padding: '0 4px' }}>
          {link.title}
        </div>
      )}
      {src ? (
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: type === 'spotify' ? '152px' : '56.25%',
          height: 0,
          borderRadius: 12,
          overflow: 'hidden',
          background: '#000000'
        }}>
          <iframe
            src={src}
            title={link.title || 'Media Embed'}
            style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              border: 'none', borderRadius: 12
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: style.subtextColor }}>
          URL embed belum diatur
        </div>
      )}
    </div>
  );
};

const THEME_STYLES: Record<string, any> = {
  'dark-glass': {
    shellBg: 'linear-gradient(160deg, #090a10 0%, #12131e 50%, #08080e 100%)',
    textColor: '#ffffff',
    subtextColor: 'rgba(255,255,255,0.65)',
    cardBg: 'rgba(255,255,255,0.06)',
    cardBorder: 'rgba(255,255,255,0.1)',
    accent: '#7c3aed',
    accentSoft: 'rgba(124, 58, 237, 0.25)',
  },
  'emerald-oasis': {
    shellBg: 'linear-gradient(160deg, #022c22 0%, #064e3b 60%, #022c22 100%)',
    textColor: '#ecfdf5',
    subtextColor: 'rgba(236,253,245,0.7)',
    cardBg: 'rgba(6, 78, 59, 0.45)',
    cardBorder: 'rgba(52, 211, 153, 0.2)',
    accent: '#10b981',
    accentSoft: 'rgba(16, 185, 129, 0.25)',
  },
  'velvet-purple': {
    shellBg: 'linear-gradient(160deg, #170736 0%, #2e1065 55%, #0f0524 100%)',
    textColor: '#f3e8ff',
    subtextColor: 'rgba(243,232,255,0.7)',
    cardBg: 'rgba(126, 34, 206, 0.18)',
    cardBorder: 'rgba(192, 132, 252, 0.22)',
    accent: '#c084fc',
    accentSoft: 'rgba(192, 132, 252, 0.25)',
  },
  'cyberpunk-neon': {
    shellBg: 'linear-gradient(160deg, #030712 0%, #0f172a 60%, #020617 100%)',
    textColor: '#f8fafc',
    subtextColor: 'rgba(248,250,252,0.65)',
    cardBg: 'rgba(15, 23, 42, 0.6)',
    cardBorder: 'rgba(56, 189, 248, 0.3)',
    accent: '#38bdf8',
    accentSoft: 'rgba(56, 189, 248, 0.25)',
  },
  'sunset-glow': {
    shellBg: 'linear-gradient(160deg, #1c0505 0%, #450a0a 55%, #180303 100%)',
    textColor: '#ffedd5',
    subtextColor: 'rgba(255,237,213,0.7)',
    cardBg: 'rgba(127, 29, 29, 0.35)',
    cardBorder: 'rgba(249, 115, 22, 0.25)',
    accent: '#f97316',
    accentSoft: 'rgba(249, 115, 22, 0.25)',
  },
  'pure-light': {
    shellBg: '#f8fafc',
    textColor: '#0f172a',
    subtextColor: '#64748b',
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.08)',
    accent: '#4f46e5',
    accentSoft: 'rgba(79, 70, 229, 0.15)',
  }
};

const DEFAULT_OUTER_WALLPAPER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80';

export const LinksPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [allPages, setAllPages] = useState<BioLinkPageData[]>([]);
  const [singleLegacy, setSingleLegacy] = useState<any>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [waSenderName, setWaSenderName] = useState('');
  const [waSenderMessage, setWaSenderMessage] = useState('');

  // Load Data
  useEffect(() => {
    const load = async () => {
      const stored = await storage.getItem('porto_bio_pages', null);
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setAllPages(stored);
      } else {
        const legacy = await storage.getItem('porto_links', null);
        if (legacy) setSingleLegacy(legacy);
      }
    };
    load();
  }, []);

  // Determine active page
  const activePageData: BioLinkPageData = useMemo(() => {
    if (allPages.length > 0) {
      if (slug) {
        const matched = allPages.find(p => p.slug.toLowerCase() === slug.toLowerCase());
        if (matched) return matched;
      }
      const def = allPages.find(p => p.isDefault) || allPages[0];
      return def;
    }

    if (singleLegacy) {
      return {
        id: 'legacy',
        slug: 'main',
        title: 'Bio Link',
        profile: singleLegacy.profile || {},
        groups: singleLegacy.groups || [],
        links: singleLegacy.links || []
      };
    }

    return {
      id: 'default',
      slug: 'main',
      title: 'Bio Link',
      profile: {
        name: 'Profil Saya',
        bio: 'Selamat datang di halaman tautan resmi saya.',
        avatarUrl: '',
        verifiedBadge: true,
        themePreset: 'dark-glass',
        outerBgPreset: DEFAULT_OUTER_WALLPAPER
      },
      groups: [],
      links: []
    };
  }, [allPages, singleLegacy, slug]);

  const profile = activePageData.profile || ({} as ProfileData);
  const links = activePageData.links || [];
  const groups = activePageData.groups || [];

  // Theme styles
  const theme = THEME_STYLES[profile.themePreset || 'dark-glass'] || THEME_STYLES['dark-glass'];

  // Background Outer Style
  const outerBgStyle: React.CSSProperties = useMemo(() => {
    if (profile.outerBgType === 'color' && profile.outerBgColor) {
      return { backgroundColor: profile.outerBgColor };
    }
    if (profile.outerBgType === 'custom' && profile.outerBgCustomUrl) {
      return {
        backgroundImage: `url(${profile.outerBgCustomUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    const preset = profile.outerBgPreset || DEFAULT_OUTER_WALLPAPER;
    return {
      backgroundImage: `url(${preset})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  }, [profile]);

  // Background Inner (Shell) Style
  const innerBgValue = useMemo(() => {
    if (profile.innerBgType === 'color' && profile.innerBgColor) {
      return profile.innerBgColor;
    }
    if (profile.innerBgType === 'custom' && profile.innerBgCustomUrl) {
      return `url(${profile.innerBgCustomUrl}) center/cover no-repeat`;
    }
    return theme.shellBg;
  }, [profile, theme]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://sumrday.web.app/links';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(currentUrl)}&color=000000&bgcolor=ffffff&qzone=2&margin=0`;

  const recordClick = async (linkId: string) => {
    try {
      const key = 'porto_link_clicks';
      const current = (await storage.getItem(key, {})) || {};
      current[linkId] = (current[linkId] || 0) + 1;
      await storage.setItem(key, current);
    } catch (e) {
      // silent
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Group links
  const sortedLinks = [...links].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const groupedLinks = sortedLinks.reduce((acc: Record<string, LinkItem[]>, link: LinkItem) => {
    const cat = (link.category || '').trim();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {});

  const allGroupNames = groups
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((g: any) => g.name);
  const otherCategories = Object.keys(groupedLinks).filter(
    c => c !== '' && !allGroupNames.includes(c)
  );
  const orderedCategories = [...allGroupNames, ...otherCategories, ''];

  return (
    <div 
      className="links-page-outer-container"
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        ...outerBgStyle,
        position: 'relative',
        overflowY: 'auto'
      }}
    >
      {/* ── PHONE SHELL CONTAINER (NO SHADOW BUG, CRISP EDGES) ── */}
      <div 
        className="lp-shell"
        style={{
          width: '100%',
          maxWidth: 440,
          minHeight: '85vh',
          background: innerBgValue,
          color: theme.textColor,
          borderRadius: 36,
          boxShadow: '0 25px 80px rgba(0,0,0,0.48), 0 4px 20px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.14)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Floating Buttons (QR & Close) */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 300, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setIsQrModalOpen(true)}
            aria-label="QR Code Bio Link"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: `1px solid ${theme.cardBorder}`,
              color: theme.textColor, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Bagikan / Lihat QR Code"
          >
            <QrCode size={16} strokeWidth={2.2} />
          </button>

          <button
            onClick={() => navigate('/')}
            aria-label="Kembali ke Beranda"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: `1px solid ${theme.cardBorder}`,
              color: theme.textColor, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Kembali ke Beranda"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* ── PROFILE HEADER SECTION ── */}
        <div style={{ padding: '36px 20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          
          {/* Avatar */}
          <div style={{
            width: 86, height: 86, borderRadius: '50%',
            padding: 3,
            background: `linear-gradient(135deg, ${theme.accent}, #ec4899, #3b82f6)`,
            boxShadow: `0 8px 24px ${theme.accentSoft}`,
            marginBottom: 12,
            position: 'relative'
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              overflow: 'hidden', background: '#12121a',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: 30, fontWeight: 900, color: '#ffffff' }}>
                  {(profile.name || 'A')[0]}
                </div>
              )}
            </div>
          </div>

          {/* Name & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: theme.textColor }}>
              {profile.name || 'Nama Profil'}
            </h1>
            {profile.verifiedBadge && (
              <ShieldCheck size={18} color="#3b82f6" fill="#3b82f6" stroke="#ffffff" />
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p style={{ fontSize: 12.5, color: theme.subtextColor, margin: '4px 0 0', maxWidth: 320, lineHeight: 1.45 }}>
              {profile.bio}
            </p>
          )}

        </div>

        {/* ── LINKS FEED ── */}
        <div style={{ flex: 1, padding: '8px 20px 30px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 10 }}>
          
          {orderedCategories.map(cat => {
            const catLinks = groupedLinks[cat] || [];
            if (catLinks.length === 0) return null;

            return (
              <div key={cat || 'default-group'} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cat && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ height: 1, flex: 1, background: theme.cardBorder }} />
                    <span style={{ fontSize: 10.5, fontWeight: 850, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.subtextColor }}>
                      {cat}
                    </span>
                    <div style={{ height: 1, flex: 1, background: theme.cardBorder }} />
                  </div>
                )}

                {catLinks.map(link => {
                  // ── Modular Bio Blocks Conditional Rendering ──
                  if (link.itemType === 'lead-magnet') {
                    return <LeadMagnetBlockView key={link.id} link={link} theme={theme} slug={activePageData.slug} />;
                  }
                  if (link.itemType === 'tip-jar') {
                    return <TipJarBlockView key={link.id} link={link} theme={theme} defaultWa={profile.whatsappNumber} />;
                  }
                  if (link.itemType === 'accordion') {
                    return <AccordionBlockView key={link.id} link={link} theme={theme} />;
                  }
                  if (link.itemType === 'countdown') {
                    return <CountdownBlockView key={link.id} link={link} theme={theme} />;
                  }
                  if (link.itemType === 'product-card') {
                    return <ProductCardBlockView key={link.id} link={link} theme={theme} />;
                  }
                  if (link.itemType === 'embed') {
                    return <EmbedBlockView key={link.id} link={link} theme={theme} />;
                  }

                  // Default: Standard Link Button
                  const isFeatured = link.isFeatured;
                  const isPill = link.btnShape === 'pill';
                  const isSquare = link.btnShape === 'square';
                  const radius = isPill ? 100 : isSquare ? 8 : 16;

                  const accentCol = link.blockAccentColor || theme.accent;
                  const isNeon = link.btnBgType === 'neon';
                  const neonCol = link.blockAccentColor || link.btnBgColor || theme.accent;

                  let btnBg = theme.cardBg;
                  if (isFeatured) {
                    btnBg = `linear-gradient(135deg, ${accentCol}, #9333ea)`;
                  } else if (link.btnBgType === 'gradient' && link.btnBgGradient) {
                    btnBg = link.btnBgGradient;
                  } else if (link.btnBgType === 'solid' && (link.blockBgColor || link.btnBgColor)) {
                    btnBg = link.blockBgColor || link.btnBgColor;
                  } else if (link.btnBgType === 'image' && link.btnBgImage) {
                    btnBg = `url(${link.btnBgImage}) center/cover no-repeat`;
                  } else if (link.btnBgType === 'glass') {
                    btnBg = link.blockBgColor || 'rgba(255,255,255,0.12)';
                  } else if (isNeon) {
                    btnBg = link.blockBgColor || 'rgba(0,0,0,0.65)';
                  } else if (link.blockBgColor) {
                    btnBg = link.blockBgColor;
                  } else if (link.btnBgColor) {
                    btnBg = link.btnBgColor;
                  }

                  const textColor = link.blockTextColor || link.btnTextColor || (isNeon ? neonCol : (isFeatured ? '#ffffff' : theme.textColor));
                  const borderColor = link.blockBorderColor ? `1.5px solid ${link.blockBorderColor}` : (isNeon ? `2px solid ${neonCol}` : (isFeatured ? 'none' : `1px solid ${theme.cardBorder}`));

                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => recordClick(link.id)}
                      className={`lp-link-item spring-click ${isFeatured ? 'shine-on-hover' : ''} ${link.animation && link.animation !== 'none' ? `lp-anim-${link.animation}` : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '13px 16px',
                        borderRadius: radius,
                        background: btnBg,
                        border: borderColor,
                        color: textColor,
                        textDecoration: 'none',
                        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: link.blockBorderColor ? `0 0 16px ${link.blockBorderColor}33` : (isNeon ? `0 0 20px ${neonCol}, 0 0 6px ${neonCol}, inset 0 0 8px rgba(0,0,0,0.5)` : (isFeatured ? `0 8px 24px ${theme.accentSoft}` : '0 4px 12px rgba(0,0,0,0.1)')),
                        position: 'relative',
                        overflow: 'hidden',
                        '--link-glow-color': neonCol
                      } as React.CSSProperties}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        {link.coverImageUrl ? (
                          <img
                            src={link.coverImageUrl}
                            alt=""
                            style={{
                              width: 38, height: 38, borderRadius: isPill ? '50%' : 10,
                              objectFit: 'cover', flexShrink: 0
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 38, height: 38, borderRadius: isPill ? '50%' : 10,
                            background: isFeatured ? 'rgba(255,255,255,0.2)' : `${accentCol}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <ExternalLink size={16} strokeWidth={2.4} color={isFeatured ? '#ffffff' : accentCol} />
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: textColor }}>
                            {link.title}
                          </span>
                          {link.subtitle && (
                            <span style={{ fontSize: 11, color: isFeatured ? 'rgba(255,255,255,0.8)' : `${textColor}aa`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                              {link.subtitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={16} opacity={0.6} style={{ flexShrink: 0, color: textColor }} />
                    </a>
                  );
                })}
              </div>
            );
          })}

          {/* ── WHATSAPP DIRECT LEAD CONTACT CARD ── */}
          {profile.whatsappNumber && (
            <div style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 18,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginTop: 6
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(37, 211, 102, 0.15)', color: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: theme.textColor }}>Kirim Pesan / Konsultasi</div>
                  <div style={{ fontSize: 10.5, color: theme.subtextColor }}>Terhubung langsung via WhatsApp</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Nama Anda..."
                  value={waSenderName}
                  onChange={e => setWaSenderName(e.target.value)}
                  style={{
                    width: '100%', height: 34, padding: '0 12px',
                    borderRadius: 10, border: `1px solid ${theme.cardBorder}`,
                    background: 'rgba(0,0,0,0.2)', color: theme.textColor,
                    fontSize: 11.5, outline: 'none', boxSizing: 'border-box'
                  }}
                />

                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Pesan / Kebutuhan proyek..."
                    value={waSenderMessage}
                    onChange={e => setWaSenderMessage(e.target.value)}
                    style={{
                      flex: 1, height: 36, padding: '0 12px',
                      borderRadius: 10, border: `1px solid ${theme.cardBorder}`,
                      background: 'rgba(0,0,0,0.2)', color: theme.textColor,
                      fontSize: 11.5, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = profile.whatsappNumber!.replace(/[^0-9]/g, '');
                      const text = `Halo, saya ${waSenderName || 'Klien'}. ${waSenderMessage || 'Saya ingin berdiskusi mengenai proyek.'}`;
                      window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    style={{
                      height: 36, padding: '0 14px', borderRadius: 10,
                      background: theme.accent, color: '#ffffff',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Branding */}
          <div style={{ textAlign: 'center', marginTop: 12, opacity: 0.5, fontSize: 10.5, letterSpacing: '0.04em' }}>
            Powered by Antigravity Bio Links
          </div>

        </div>
      </div>

      {/* ── QR CODE MODAL (CLEAN SUBTLE OVERLAY, NO HEAVY BLUR) ── */}
      {isQrModalOpen && (
        <div
          onClick={() => setIsQrModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            animation: 'lpFadeIn 0.2s ease'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 320,
              background: '#ffffff', color: '#0f172a',
              borderRadius: 24, padding: 22,
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14,
              animation: 'lpScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 900 }}>QR Bio Link</span>
              <button
                onClick={() => setIsQrModalOpen(false)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: 10, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <img src={qrApiUrl} alt="QR Code" style={{ width: 200, height: 200, display: 'block', borderRadius: 8 }} />
            </div>

            <div style={{ fontSize: 11.5, color: '#64748b', maxWidth: 240 }}>
              Pindai dengan kamera ponsel untuk membuka halaman bio link ini langsung.
            </div>

            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button
                onClick={handleCopyLink}
                style={{
                  flex: 1, height: 38, borderRadius: 10,
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  color: '#0f172a', fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedLink ? 'Tersalin' : 'Salin URL'}</span>
              </button>

              <a
                href={qrApiUrl}
                download="bio-link-qr.png"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, height: 38, borderRadius: 10,
                  background: 'var(--cms-accent, #7c3aed)', color: '#ffffff',
                  border: 'none', fontSize: 12, fontWeight: 800, textDecoration: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <Download size={14} /> Unduh
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes lpFadeIn { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        @keyframes lpScaleIn { 
          from { opacity: 0; transform: translateY(10px) scale(0.98); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
        @keyframes lpPageFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lpItemFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .lp-shell {
          animation: lpPageFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .lp-link-item {
          transition: box-shadow 0.55s cubic-bezier(0.16, 1, 0.3, 1), filter 0.45s ease, border-color 0.45s ease;
          animation: lpItemFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .lp-link-item:hover {
          filter: brightness(1.04);
        }

        .lp-link-item:active {
          transform: scale(0.985) !important;
          transition: transform 0.15s ease !important;
        }

        @media (max-width: 640px) {
          .links-page-outer-container {
            padding: 0 !important;
            background: ${innerBgValue} !important;
          }
          .lp-shell {
            max-width: 100% !important;
            min-height: 100vh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
};

export default LinksPage;
