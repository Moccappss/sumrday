import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt, ArrowRight, Sparkles, Check, Clock,
  ShoppingBag, MessageSquare, ArrowUpRight, Zap, ShieldCheck
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { haptic } from '../../utils/haptics';
import {
  type RateCardPackage,
  DEFAULT_RATE_CARDS,
  DEFAULT_CATEGORY_COLORS
} from '../admin/content-stash/stashTypes';

interface LPRateCardSpotlightProps {
  isDark: boolean;
  accentColor?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  isEditable?: boolean;
  onUpdateTitle?: (val: string) => void;
  onUpdateSubtitle?: (val: string) => void;
  onUpdateBadge?: (val: string) => void;
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export const LPRateCardSpotlight: React.FC<LPRateCardSpotlightProps> = ({
  isDark,
  accentColor = '#f59e0b',
  badge,
  title,
  subtitle,
  isEditable = false,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateBadge,
}) => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<RateCardPackage[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(DEFAULT_CATEGORY_COLORS);
  const [businessProfile, setBusinessProfile] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const hex2rgb = (hex: string) => {
    let clean = (hex || '#f59e0b').replace('#', '');
    if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
    const r = parseInt(clean.substring(0, 2), 16) || 245;
    const g = parseInt(clean.substring(2, 4), 16) || 158;
    const b = parseInt(clean.substring(4, 6), 16) || 11;
    return `${r}, ${g}, ${b}`;
  };

  const accentRgb = hex2rgb(accentColor);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedPkgs, savedCatColors, savedProfile] = await Promise.all([
          storage.getItem('porto_rate_cards', []),
          storage.getItem('porto_ratecard_category_colors', null),
          storage.getItem('porto_business_profile', {})
        ]);
        if (Array.isArray(savedPkgs) && savedPkgs.length > 0) {
          setPackages(savedPkgs.filter((p: any) => p.isActive !== false));
        } else {
          setPackages(DEFAULT_RATE_CARDS.filter(p => p.isActive !== false));
        }
        if (savedCatColors && typeof savedCatColors === 'object') {
          setCategoryColors({ ...DEFAULT_CATEGORY_COLORS, ...savedCatColors });
        }
        if (savedProfile) {
          setBusinessProfile(savedProfile);
        }
      } catch {
        setPackages(DEFAULT_RATE_CARDS);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const unsubPkgs = storage.listenItem('porto_rate_cards', (data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        setPackages(data.filter((p: any) => p.isActive !== false));
      }
    });

    const handleUpdated = () => loadData();
    window.addEventListener('porto_ratecards_updated', handleUpdated);

    return () => {
      if (unsubPkgs) unsubPkgs();
      window.removeEventListener('porto_ratecards_updated', handleUpdated);
    };
  }, []);

  // Filter top 3 spotlight packages (prioritizing popular / featured)
  const spotlightPackages = useMemo(() => {
    if (!packages || packages.length === 0) return [];
    const featured = packages.filter(p => p.isPopular || p.isFeatured || (p.badge && p.badge.trim().length > 0));
    if (featured.length >= 3) return featured.slice(0, 3);
    const remaining = packages.filter(p => !featured.some(f => f.id === p.id));
    return [...featured, ...remaining].slice(0, 3);
  }, [packages]);

  const handleOrderPackage = (pkg: RateCardPackage, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    try {
      const raw = localStorage.getItem('porto_client_cart');
      const currentCart = raw ? JSON.parse(raw) : [];
      const cartItemId = `ratecard_${pkg.id}_${Date.now()}`;

      const newCartItem = {
        id: cartItemId,
        productId: `ratecard_${pkg.id}`,
        name: pkg.title,
        price: pkg.price,
        originalPrice: pkg.price,
        quantity: 1,
        category: pkg.category || 'Paket Layanan',
        type: 'Jasa',
        durationDays: pkg.durationDays || 7,
        deliverables: pkg.deliverables || [],
        serviceDpAllowed: true,
        billingPeriod: pkg.billingPeriod || 'proyek',
        isDigitalAsset: false
      };

      currentCart.push(newCartItem);
      localStorage.setItem('porto_client_cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('porto_cart_updated'));
      navigate('/keranjang');
    } catch {
      navigate('/pricing');
    }
  };

  const handleWhatsAppConsult = (pkg: RateCardPackage, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.selection();
    const cleanPhone = (businessProfile?.whatsapp || '081234567890').replace(/\D/g, '');
    const phone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const deliverablesList = (pkg.deliverables || []).map(d => `• ${d}`).join('\n');
    const msg = `Halo sumr.day Studio! Saya tertarik untuk konsultasi dan memesan paket layanan:\n\n` +
      `🏷️ Paket: *${pkg.title}*\n` +
      `💰 Investasi: *${formatRp(pkg.price)}* (${pkg.billingPeriod || 'per proyek'})\n` +
      `⏱️ Estimasi Pengerjaan: *${pkg.durationDays ? `${pkg.durationDays} hari kerja` : 'Fleksibel'}*\n` +
      `📋 Deliverables:\n${deliverablesList}\n\n` +
      `Apakah slot pengerjaan masih tersedia? Mohon info alur selanjutnya ya. Terima kasih!`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sectionBadge = badge || 'PAKET & RATE CARD PILIHAN';
  const sectionTitle = title || 'Investasi Terukur untuk Eksekusi Maksimal';
  const sectionSubtitle = subtitle || 'Pilihan paket desain, website interaktif, dan sistem kustom dengan deliverables transparan, opsi DP 50%, serta jaminan kualitas profesional.';

  return (
    <section
      id="rate-card-spotlight"
      className="lp-ratecard-spotlight-root"
      style={{
        width: '100%',
        padding: 'clamp(56px, 7vw, 84px) clamp(16px, 3.5vw, 24px)',
        position: 'relative',
        background: isDark ? '#06070a' : '#eef2f6',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)'}`,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)'}`,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ maxWidth: 1240, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Header Section */}
        <div data-reveal="true" style={{ textAlign: 'center', marginBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 100,
            background: `rgba(${accentRgb}, 0.12)`,
            border: `1px solid rgba(${accentRgb}, 0.28)`,
            color: accentColor,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 16
          }}>
            <Receipt size={14} />
            {isEditable ? (
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={e => onUpdateBadge?.(e.currentTarget.textContent || sectionBadge)}
                style={{ outline: 'none', cursor: 'text' }}
              >
                {sectionBadge}
              </span>
            ) : (
              <span>{sectionBadge}</span>
            )}
          </div>

          <h2 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '-0.02em',
            color: isDark ? '#ffffff' : '#0f172a',
            lineHeight: 1.2
          }}>
            {isEditable ? (
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={e => onUpdateTitle?.(e.currentTarget.textContent || sectionTitle)}
                style={{ outline: 'none', cursor: 'text' }}
              >
                {sectionTitle}
              </span>
            ) : (
              sectionTitle
            )}
          </h2>

          <p style={{
            margin: 0,
            fontSize: 15,
            color: isDark ? '#94a3b8' : '#64748b',
            maxWidth: 680,
            lineHeight: 1.6
          }}>
            {isEditable ? (
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={e => onUpdateSubtitle?.(e.currentTarget.textContent || sectionSubtitle)}
                style={{ outline: 'none', cursor: 'text' }}
              >
                {sectionSubtitle}
              </span>
            ) : (
              sectionSubtitle
            )}
          </p>
        </div>

        {/* Packages Cards Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: isDark ? '#94a3b8' : '#64748b' }}>
            Memuat paket layanan...
          </div>
        ) : spotlightPackages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: isDark ? '#94a3b8' : '#64748b' }}>
            Belum ada paket aktif saat ini.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
            gap: 24,
            marginBottom: 44
          }}>
            {spotlightPackages.map((pkg, idx) => {
              const isPopular = pkg.isPopular || idx === 1;
              const badgeColor = pkg.badgeColor || (pkg.category && categoryColors[pkg.category]) || accentColor;

              return (
                <div
                  key={pkg.id || idx}
                  data-reveal="true"
                  className={`reveal-delay-${(idx % 4) + 1}`}
                  style={{
                    background: isDark ? '#151824' : '#ffffff',
                    backdropFilter: 'none',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)'}`,
                    borderRadius: 22,
                    padding: '30px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: 'none',
                  }}
                >
                  {/* Popular or Custom Badge */}
                  {pkg.badge && (
                    <div style={{
                      position: 'absolute',
                      top: 18,
                      right: 22,
                      background: badgeColor,
                      color: '#ffffff',
                      fontSize: 10.5,
                      fontWeight: 900,
                      padding: '3px 10px',
                      borderRadius: 100,
                      letterSpacing: '0.04em',
                      boxShadow: 'none'
                    }}>
                      {pkg.badge}
                    </div>
                  )}

                  {/* Category */}
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 850,
                    textTransform: 'uppercase',
                    color: badgeColor,
                    letterSpacing: '0.05em',
                    marginBottom: 8
                  }}>
                    {pkg.category || 'Paket Layanan'}
                  </span>

                  {/* Title */}
                  <h3 style={{
                    margin: '0 0 10px',
                    fontSize: 20,
                    fontWeight: 900,
                    fontFamily: "'Outfit', sans-serif",
                    color: isDark ? '#ffffff' : '#0f172a'
                  }}>
                    {pkg.title}
                  </h3>

                  {/* Description */}
                  {pkg.description && (
                    <p style={{
                      margin: '0 0 18px',
                      fontSize: 13,
                      color: isDark ? '#94a3b8' : '#64748b',
                      lineHeight: 1.5,
                      minHeight: 40
                    }}>
                      {pkg.description}
                    </p>
                  )}

                  {/* Pricing Box */}
                  <div style={{
                    padding: '16px',
                    borderRadius: 16,
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 6
                  }}>
                    <div>
                      <span style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: accentColor,
                        fontFamily: "'Outfit', sans-serif"
                      }}>
                        {formatRp(pkg.price)}
                      </span>
                      <span style={{
                        fontSize: 11.5,
                        color: isDark ? '#94a3b8' : '#64748b',
                        marginLeft: 6
                      }}>
                        / {pkg.billingPeriod || 'proyek'}
                      </span>
                    </div>

                    <div style={{
                      fontSize: 11.5,
                      color: isDark ? '#cbd5e1' : '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Clock size={12} color={accentColor} />
                      <span>{pkg.durationDays ? `${pkg.durationDays} hari` : 'Fleksibel'}</span>
                    </div>
                  </div>

                  {/* Deliverables Checklist */}
                  <div style={{ marginBottom: 28, flex: 1 }}>
                    <div style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: isDark ? '#94a3b8' : '#64748b',
                      marginBottom: 10
                    }}>
                      Apa yang Anda Dapatkan:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {(pkg.deliverables || []).map((item, dIdx) => (
                        <div key={dIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: isDark ? '#e2e8f0' : '#334155' }}>
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: `rgba(${accentRgb}, 0.15)`,
                            color: accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 1
                          }}>
                            <Check size={11} strokeWidth={3} />
                          </div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                    <button
                      type="button"
                      onClick={(e) => handleOrderPackage(pkg, e)}
                      style={{
                        width: '100%',
                        height: 44,
                        borderRadius: 14,
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
                        boxShadow: 'none',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <ShoppingBag size={15} />
                      <span>Pesan Paket Ini</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleWhatsAppConsult(pkg, e)}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 14,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                        background: 'transparent',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: 13,
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>Konsultasi via WA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Banner & Explore More CTA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '20px 24px',
          borderRadius: 22,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1px dashed ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 280px' }}>
            <div style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              flexShrink: 0,
              borderRadius: 12,
              background: `rgba(${accentRgb}, 0.15)`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                Butuh Ruang Lingkup Khusus (Custom Project)?
              </div>
              <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                Kami siap menyesuaikan solusi dengan timeline, tech stack, dan anggaran perusahaan Anda.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.light();
              navigate('/pricing');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 100,
              border: `1px solid ${accentColor}`,
              background: `${accentColor}15`,
              color: accentColor,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
          >
            <span>Buka Semua Paket & Add-on</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default LPRateCardSpotlight;
