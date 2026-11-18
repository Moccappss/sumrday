import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvitationBySlug, syncInvitationsFromCloud, InvitationData } from '../apps/invitation-maker/invitationData';
import ClientView from '../apps/invitation-maker/components/ClientView';
import SEOHelmet from '../components/SEOHelmet';
import { Mail, ArrowLeft, Sparkles, Heart } from 'lucide-react';

export default function PublicInvitationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [invitation, setInvitation] = useState<InvitationData | null>(() => {
    return slug ? getInvitationBySlug(slug) : null;
  });
  const [isLoading, setIsLoading] = useState(!invitation);

  useEffect(() => {
    let isMounted = true;
    if (slug) {
      const immediate = getInvitationBySlug(slug);
      if (immediate) {
        setInvitation(immediate);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        syncInvitationsFromCloud().then(list => {
          if (!isMounted) return;
          const clean = String(slug || '').toLowerCase().trim();
          const found = list.find(inv => (inv.slug || '').toLowerCase().trim() === clean || inv.id === clean);
          if (found) {
            setInvitation(found);
          }
          setIsLoading(false);
        }).catch(() => {
          if (isMounted) setIsLoading(false);
        });
      }
    }

    const handleUpdate = () => {
      if (slug) {
        const updated = getInvitationBySlug(slug);
        if (updated && isMounted) setInvitation(updated);
      }
    };
    window.addEventListener('porto_invitations_updated', handleUpdate);
    window.addEventListener('porto_invitation_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('porto_invitations_updated', handleUpdate);
      window.removeEventListener('porto_invitation_updated', handleUpdate);
    };
  }, [slug]);

  const themeBg = invitation?.backgroundType === 'color' && invitation?.customBackgroundColor 
    ? invitation.customBackgroundColor 
    : (invitation?.theme === 'luxury' ? '#0a0a0c' : invitation?.theme === 'sage' ? '#0f1b15' : invitation?.theme === 'modern' ? '#090d16' : '#140c10');

  const isSlide = invitation?.navigationMode === 'story_slide';

  useEffect(() => {
    if (!invitation) return;
    const origBodyBg = document.body.style.backgroundColor;
    const origHtmlBg = document.documentElement.style.backgroundColor;
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    const rootEl = document.getElementById('root');
    const origRootBg = rootEl ? rootEl.style.background : '';
    const origRootMinHeight = rootEl ? rootEl.style.minHeight : '';

    document.body.style.backgroundColor = themeBg;
    document.documentElement.style.backgroundColor = themeBg;
    if (rootEl) {
      rootEl.style.background = themeBg;
      rootEl.style.minHeight = '100vh';
    }

    if (isSlide) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.backgroundColor = origBodyBg;
      document.documentElement.style.backgroundColor = origHtmlBg;
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
      if (rootEl) {
        rootEl.style.background = origRootBg;
        rootEl.style.minHeight = origRootMinHeight;
      }
    };
  }, [invitation, themeBg, isSlide]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#090a10',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #ec4899', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>Membuka Undangan Digital...</span>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#090a10',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          background: 'rgba(236, 72, 153, 0.15)',
          color: '#ec4899',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}>
          <Mail size={36} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>
          Undangan Tidak Ditemukan
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 420, margin: '0 0 24px', lineHeight: 1.6 }}>
          Tautan undangan digital yang Anda tuju mungkin sudah kedaluwarsa, belum dipublikasikan, atau URL-nya salah.
        </p>
        <Link
          to="/"
          style={{
            padding: '12px 24px',
            borderRadius: 99,
            background: 'linear-gradient(135deg, #ec4899, #7c3aed)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: 13,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 24px rgba(236, 72, 153, 0.35)'
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet
        title={`${invitation.title} | Undangan Digital`}
        description={`Undangan digital pernikahan ${invitation.groom.nickname} & ${invitation.bride.nickname}. Klik untuk melihat informasi acara dan konfirmasi RSVP.`}
        image={invitation.coverImage || ''}
      />
      <style>{`
        /* MOBILE VIEWPORT: FLEXIBLE & EDGE-TO-EDGE */
        @media (max-width: 640px) {
          .public-invitation-container {
            width: 100vw !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
            align-items: stretch !important;
            justify-content: stretch !important;
          }
          .public-invitation-canvas {
            width: 100% !important;
            max-width: 100% !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            aspect-ratio: unset !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            flex: 1 1 auto !important;
          }
        }

        /* DESKTOP VIEWPORT: ELEGANT FIXED 9:16 (1080x1920) CANVAS */
        @media (min-width: 641px) {
          .public-invitation-canvas {
            width: min(440px, calc((100vh - 28px) * 9 / 16)) !important;
            max-width: 440px !important;
            height: min(calc(100vh - 28px), calc(440px * 16 / 9)) !important;
            aspect-ratio: 9 / 16 !important;
            border-radius: 36px !important;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* Main Full-Screen Wrapper */}
      <div 
        className="public-invitation-container"
        style={{
          width: '100vw',
          minHeight: '100vh',
          height: isSlide ? '100vh' : 'auto',
          margin: 0,
          padding: 0,
          backgroundColor: themeBg,
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isSlide ? 'center' : 'flex-start',
          overflow: isSlide ? 'hidden' : 'auto',
          overflowX: 'hidden',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        {/* Canvas: Flexible 100% on Mobile, Fixed 9:16 (1080x1920) on Desktop */}
        <div 
          className="public-invitation-canvas"
          style={{
            width: isSlide ? 'min(440px, calc((100vh - 24px) * 9 / 16))' : '100%',
            maxWidth: 440,
            height: isSlide ? 'min(calc(100vh - 24px), calc(440px * 16 / 9))' : 'auto',
            aspectRatio: isSlide ? '9 / 16' : undefined,
            minHeight: isSlide ? undefined : '100vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxSizing: 'border-box',
            flexShrink: 0
          }}
        >
          <ClientView initialData={invitation} />
        </div>
      </div>
    </>
  );
}
