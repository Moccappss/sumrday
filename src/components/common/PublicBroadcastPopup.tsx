import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Sparkles, Tag, BookOpen, ShoppingBag, 
  Megaphone, MessageCircle, ArrowRight, BellRing 
} from 'lucide-react';
import { BroadcastCampaign, trackCampaignClick } from '../../utils/pushBroadcast';
import { haptic } from '../../utils/haptics';

export const PublicBroadcastPopup: React.FC = () => {
  const [activeCampaign, setActiveCampaign] = useState<BroadcastCampaign | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBroadcast = (e: any) => {
      if (e.detail && e.detail.title) {
        setActiveCampaign(e.detail);
        setIsVisible(true);
        haptic.success();
      }
    };

    window.addEventListener('porto_public_broadcast_received', handleBroadcast);
    return () => window.removeEventListener('porto_public_broadcast_received', handleBroadcast);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setActiveCampaign(null), 300);
  };

  const handleAction = () => {
    if (!activeCampaign) return;
    trackCampaignClick(activeCampaign.id);
    haptic.medium();

    const targetUrl = activeCampaign.url || '/';
    if (targetUrl.startsWith('http')) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = targetUrl;
    }
    handleClose();
  };

  if (!activeCampaign || !isVisible) return null;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'promo':
        return { label: 'PENAWARAN SPESIAL', icon: <Tag size={12} />, bg: '#ef4444', color: '#fff' };
      case 'blog':
        return { label: 'ARTIKEL TERBARU', icon: <BookOpen size={12} />, bg: '#3b82f6', color: '#fff' };
      case 'catalog':
        return { label: 'RILIS KATALOG', icon: <ShoppingBag size={12} />, bg: '#10b981', color: '#fff' };
      case 'announcement':
        return { label: 'PENGUMUMAN RESMI', icon: <Megaphone size={12} />, bg: '#8b5cf6', color: '#fff' };
      default:
        return { label: 'PEMBERITAHUAN', icon: <Sparkles size={12} />, bg: 'var(--cms-accent, #7c3aed)', color: '#fff' };
    }
  };

  const badge = getTypeBadge(activeCampaign.type);

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(var(--sat, 0px) + 20px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        width: 'calc(100vw - 32px)',
        maxWidth: 460,
        animation: 'cmsPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))',
      }}
    >
      <div
        style={{
          background: 'rgba(18, 19, 28, 0.98)',
          color: '#ffffff',
          borderRadius: 22,
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(124, 58, 237, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontFamily: "'Inter', sans-serif",
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Glow Accent Bar */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${badge.bg}, var(--cms-accent, #7c3aed), #6366f1)`
          }}
        />

        {/* Header with Type & Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 100,
              background: badge.bg,
              color: badge.color,
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            title="Tutup siaran"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {activeCampaign.imageUrl && (
            <img
              src={activeCampaign.imageUrl}
              alt={activeCampaign.title}
              style={{
                width: 76,
                height: 76,
                borderRadius: 14,
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, lineHeight: 1.3, color: '#ffffff' }}>
              {activeCampaign.title}
            </h4>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: 'rgba(255, 255, 255, 0.75)' }}>
              {activeCampaign.message}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {activeCampaign.url && (
          <button
            onClick={handleAction}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '10px 16px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--cms-accent, #7c3aed), #6366f1)',
              color: '#ffffff',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              transition: 'transform 0.15s ease, filter 0.15s ease',
            }}
          >
            <span>
              {activeCampaign.type === 'promo' ? 'Klaim Promo Sekarang' :
               activeCampaign.type === 'blog' ? 'Baca Selengkapnya' :
               activeCampaign.type === 'catalog' ? 'Lihat Katalog Layanan' :
               activeCampaign.actionType === 'whatsapp' ? 'Hubungi via WhatsApp' : 'Buka Sekarang'}
            </span>
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default PublicBroadcastPopup;
