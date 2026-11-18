import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Calendar, Clock, MapPin, Music, Volume2, VolumeX, 
  Send, Copy, Check, Sparkles, Gift, ChevronDown, CheckCircle2, 
  ExternalLink, MailOpen, UserCheck, QrCode, Ticket, ChevronLeft, 
  ChevronRight, CalendarPlus, Download, X, Layers, Users, Film,
  Image as ImageIcon, BookOpen, Building, Star, PartyPopper,
  ArrowUp, ArrowDown, Plus, Trash2, Edit3, Sliders, Eye, Palette
} from 'lucide-react';
import { 
  InvitationData, RSVP, Guest, PersonProfile, FRAME_PRESETS, getFrameOverlayUrl,
  getInvitationData, saveInvitation, getInvitationPersons,
  generateGoogleCalendarUrl, downloadIcsFile, CustomBlock, CoverConfig,
  BACKGROUND_GRADIENTS, BACKGROUND_PATTERNS
} from '../invitationData';
import '../styles.css';

// Animation style resolver with cinematic transitions
export function computeAnimationStyle(anim: string = 'cinematic', delay = 0): React.CSSProperties {
  let animationName = 'inviteCinematic';
  let duration = '0.62s';
  switch (anim) {
    case 'slide':
      animationName = 'inviteSlide';
      duration = '0.6s';
      break;
    case 'zoom':
      animationName = 'inviteZoom';
      duration = '0.5s';
      break;
    case 'spill':
      animationName = 'inviteSpill';
      duration = '0.7s';
      break;
    case 'flip':
      animationName = 'inviteFlip';
      duration = '0.6s';
      break;
    case 'fade':
      animationName = 'inviteFade';
      duration = '0.5s';
      break;
    case 'cinematic':
    default:
      animationName = 'inviteCinematic';
      duration = '0.62s';
      break;
  }
  return {
    animation: `${animationName} ${duration} cubic-bezier(0.16, 1, 0.3, 1) both`,
    animationDelay: delay > 0 ? `${delay}s` : undefined
  };
}

// Stable top-level ScrollRevealSection (prevents unmount/blinking loops on timer re-renders)
interface ScrollRevealProps {
  children: React.ReactNode;
  animationStyle?: string;
  delay?: number;
  style?: React.CSSProperties;
}

export const ScrollRevealSection: React.FC<ScrollRevealProps> = ({
  children,
  animationStyle = 'cinematic',
  delay = 0,
  style
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px 60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        ...(isVisible ? computeAnimationStyle(animationStyle, delay) : { transform: 'translateY(16px)' }),
        transition: isVisible ? undefined : 'opacity 0.35s ease, transform 0.35s ease'
      }}
    >
      {children}
    </div>
  );
};

// Isolated CountdownDisplay so timer ticks do NOT re-render ClientView or child components
interface CountdownDisplayProps {
  eventDate: string;
  themeAccent: string;
  themeSubText: string;
  themeBorder: string;
  maxWidth?: number | string;
  gap?: number;
}

export const CountdownDisplay: React.FC<CountdownDisplayProps> = React.memo(({
  eventDate,
  themeAccent,
  themeSubText,
  themeBorder,
  maxWidth,
  gap = 6
}) => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(eventDate + 'T08:00:00').getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [eventDate]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap,
      maxWidth: maxWidth || undefined,
      margin: maxWidth ? '0 auto 18px' : '0 0 clamp(12px, 2.5vh, 22px)',
      boxSizing: 'border-box'
    }}>
      {[
        { label: 'Hari', val: time.days },
        { label: 'Jam', val: time.hours },
        { label: 'Menit', val: time.minutes },
        { label: 'Detik', val: time.seconds }
      ].map((t, idx) => (
        <div key={idx} style={{
          background: 'rgba(0,0,0,0.3)',
          padding: maxWidth ? '10px 6px' : '8px 4px',
          borderRadius: 14,
          border: `1px solid ${themeBorder}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: maxWidth ? 18 : 'clamp(15px, 4vw, 18px)', fontWeight: 900, color: themeAccent }}>{t.val}</div>
          <div style={{ fontSize: maxWidth ? 9.5 : 9, color: themeSubText, textTransform: 'uppercase', fontWeight: 700 }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
});

interface VisualBlockWrapperProps {
  blockId: string;
  blockLabel: string;
  icon?: string;
  isSelected?: boolean;
  isVisualEditMode?: boolean;
  onSelect?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onInsertBelow?: () => void;
  children: React.ReactNode;
}

export const VisualBlockWrapper: React.FC<VisualBlockWrapperProps> = ({
  blockId,
  blockLabel,
  icon = '📌',
  isSelected = false,
  isVisualEditMode = false,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onInsertBelow,
  children
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!isVisualEditMode) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        position: 'relative',
        margin: '12px 0',
        borderRadius: 24,
        outline: isSelected
          ? '2.5px solid #ec4899'
          : isHovered
          ? '2px dashed rgba(236,72,153,0.7)'
          : '1px dashed rgba(255,255,255,0.15)',
        outlineOffset: '4px',
        boxShadow: isSelected ? '0 0 24px rgba(236,72,153,0.35)' : 'none',
        transition: 'outline 0.15s ease, box-shadow 0.15s ease',
        cursor: 'pointer'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Label Badge */}
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: 14,
          zIndex: 40,
          background: isSelected ? 'linear-gradient(135deg, #ec4899, #db2777)' : 'rgba(20,20,28,0.95)',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          padding: '3px 10px',
          borderRadius: 99,
          border: `1px solid ${isSelected ? '#f472b6' : 'rgba(255,255,255,0.18)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          pointerEvents: 'none',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}
      >
        <span>{icon}</span>
        <span>{blockLabel}</span>
        {isSelected && (
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '1px 5px', borderRadius: 8, fontSize: 8 }}>
            AKTIF
          </span>
        )}
      </div>

      {/* Quick Action Pill on Selected */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            right: 12,
            zIndex: 45,
            background: 'rgba(15,15,22,0.95)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(236,72,153,0.5)',
            borderRadius: 99,
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              title="Pindah ke Atas"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 10
              }}
            >
              ▲
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              title="Pindah ke Bawah"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 10
              }}
            >
              ▼
            </button>
          )}
          <button
            type="button"
            onClick={onInsertBelow}
            title="Sisipkan Widget Setelah Bagian Ini"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #db2777)',
              border: 'none',
              color: '#fff',
              borderRadius: 99,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            <span>+</span> Sisip
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Hapus / Sembunyikan Bagian Ini"
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 10
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {children}

      {/* Subtle Insert Divider between sections in visual mode */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '12px 0 4px',
          opacity: isHovered || isSelected ? 0.9 : 0.25,
          transition: 'opacity 0.2s ease'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onInsertBelow?.();
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'rgba(236,72,153,0.3)' }} />
        <button
          type="button"
          style={{
            background: 'rgba(236,72,153,0.15)',
            border: '1px dashed rgba(236,72,153,0.4)',
            borderRadius: 99,
            color: '#f472b6',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <span>+</span> Tambah Widget
        </button>
        <div style={{ flex: 1, height: 1, background: 'rgba(236,72,153,0.3)' }} />
      </div>
    </div>
  );
};

export interface ClientViewProps {
  initialData?: InvitationData;
  isVisualEditMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  onOpenAddWidget?: (insertAfterId?: string) => void;
  onOpenBackgroundPicker?: () => void;
  onOpenCoverStudio?: () => void;
  onDeleteBlock?: (id: string) => void;
  onMoveBlock?: (id: string, direction: 'up' | 'down') => void;
  onUpdateData?: (updated: InvitationData) => void;
  forceCoverOpen?: boolean;
}

export default function ClientView({
  initialData,
  isVisualEditMode = false,
  selectedBlockId = null,
  onSelectBlock,
  onOpenAddWidget,
  onOpenBackgroundPicker,
  onOpenCoverStudio,
  onDeleteBlock,
  onMoveBlock,
  onUpdateData,
  forceCoverOpen = false
}: ClientViewProps = {}) {
  const [data, setData] = useState<InvitationData>(initialData || getInvitationData);
  const persons = getInvitationPersons(data);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [guestName, setGuestName] = useState('Tamu Undangan');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Story slide navigation state
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  // Sync state if initialData prop changes in realtime (e.g. from Admin preview)
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const endY = e.changedTouches[0]?.clientY ?? (touchStartY.current ?? 0);
    const deltaX = endX - touchStartX.current;
    const deltaY = endY - (touchStartY.current ?? endY);

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 25) {
      if (deltaX > 0) {
        // Swipe Right -> Previous slide
        setSlideDirection('prev');
        setActiveSlideIndex(prev => Math.max(0, prev - 1));
      } else {
        // Swipe Left -> Next slide
        setSlideDirection('next');
        setActiveSlideIndex(prev => Math.min(totalSlides - 1, prev + 1));
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  };

  const handleTouchCancel = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
  };

  // Mouse drag support for desktop preview
  const mouseStartX = useRef<number | null>(null);
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) mouseStartX.current = e.clientX;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current === null) return;
    const deltaX = e.clientX - mouseStartX.current;
    if (deltaX > 30) {
      setSlideDirection('prev');
      setActiveSlideIndex(prev => Math.max(0, prev - 1));
    } else if (deltaX < -30) {
      setSlideDirection('next');
      setActiveSlideIndex(prev => Math.min(totalSlides - 1, prev + 1));
    }
    mouseStartX.current = null;
  };

  // QR Pass Modal state
  const [showQrModal, setShowQrModal] = useState(false);

  // Lightbox Modal for Photo Gallery
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<string>('Semua');

  const defaultGalleryImages = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80'
  ];

  const galleryList = (data.galleryImages && data.galleryImages.length > 0 ? data.galleryImages : defaultGalleryImages).map((img, idx) => ({
    id: `gal-${idx}`,
    url: img,
    title: `Momen Bahagia ${idx + 1}`,
    category: idx % 2 === 0 ? 'Prewedding' : 'Kenangan',
    caption: 'Momen berharga kisah cinta kami'
  }));

  const galleryCategories = Array.from(new Set(galleryList.map(g => g.category).filter(Boolean)));
  const filteredGallery = activeGalleryCategory === 'Semua' 
    ? galleryList 
    : galleryList.filter(g => g.category === activeGalleryCategory);

  // Audio reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // RSVP Form state
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpAttendance, setRsvpAttendance] = useState<'hadir' | 'ragu' | 'tidak_hadir'>('hadir');
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  useEffect(() => {
    // Read query parameter '?to=Nama+Tamu'
    const params = new URLSearchParams(window.location.search);
    const to = params.get('to');
    if (to) {
      const decoded = decodeURIComponent(to);
      setGuestName(decoded);
      setRsvpName(decoded);
    }

    const handleUpdate = (e: any) => {
      if (e.detail) {
        if (!initialData || e.detail.id === initialData.id || e.detail.slug === initialData.slug) {
          setData(e.detail);
        }
      }
    };
    window.addEventListener('porto_invitation_updated', handleUpdate);
    return () => window.removeEventListener('porto_invitation_updated', handleUpdate);
  }, [initialData]);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  // Preload background & cover images and cleanup audio on unmount
  useEffect(() => {
    if (data.backgroundImage) {
      const img = new Image();
      img.src = data.backgroundImage;
    }
    if (data.coverBackgroundImage) {
      const img = new Image();
      img.src = data.coverBackgroundImage;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [data.backgroundImage, data.coverBackgroundImage]);

  // Find guest in list or construct virtual guest info
  const matchedGuest: Guest = data.guests?.find(
    g => g.name.toLowerCase().trim() === guestName.toLowerCase().trim()
  ) || {
    id: 'virtual-guest',
    name: guestName,
    category: 'Tamu Terhormat',
    sent: true,
    qrSecretCode: `QR-${(data.slug || 'INV').toUpperCase().slice(0, 6)}-${Math.abs(guestName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000))}`,
    paxQuota: 2,
    hasCheckedIn: false
  };

  const handleToggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  const handleOpenInvitation = () => {
    setIsOpen(true);
    setIsPlayingMusic(true);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked', e));
    }
  };

  const handleCopy = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccount(acc);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleSubmitRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || !rsvpMessage.trim()) return;

    const newRsvp: RSVP = {
      id: `rsvp-${Date.now()}`,
      name: rsvpName.trim(),
      attendance: rsvpAttendance,
      count: rsvpAttendance === 'hadir' ? rsvpCount : 0,
      message: rsvpMessage.trim(),
      createdAt: 'Baru saja'
    };

    const updated = {
      ...data,
      rsvps: [newRsvp, ...data.rsvps]
    };

    setData(updated);
    saveInvitation(updated);
    setRsvpSuccess(true);
    setRsvpMessage('');
    setTimeout(() => setRsvpSuccess(false), 4000);
  };

  // Helper for YouTube embed
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0` : url;
  };

  // Theme styling tokens
  const getThemeStyles = () => {
    switch (data.theme) {
      case 'luxury':
        return {
          bg: '#0a0a0c',
          card: '#141419',
          accent: '#eab308',
          text: '#ffffff',
          subText: '#a1a1aa',
          border: 'rgba(234, 179, 8, 0.25)',
          fontFamily: "'Playfair Display', serif"
        };
      case 'sage':
        return {
          bg: '#0f1b15',
          card: '#16281f',
          accent: '#10b981',
          text: '#ecfdf5',
          subText: '#6ee7b7',
          border: 'rgba(16, 185, 129, 0.25)',
          fontFamily: "'Cinzel', serif"
        };
      case 'modern':
        return {
          bg: '#090d16',
          card: '#111827',
          accent: '#3b82f6',
          text: '#ffffff',
          subText: '#93c5fd',
          border: 'rgba(59, 130, 246, 0.25)',
          fontFamily: "'Inter', sans-serif"
        };
      default: // floral
        return {
          bg: '#140c10',
          card: '#1f1319',
          accent: '#ec4899',
          text: '#fff1f2',
          subText: '#f472b6',
          border: 'rgba(236, 72, 153, 0.25)',
          fontFamily: "'Playfair Display', 'Outfit', serif"
        };
    }
  };

  const theme = getThemeStyles();

  const renderMainIcon = (size = 22, color = theme.accent) => {
    switch (data.mainIcon) {
      case 'sparkles':
      case 'ring':
        return <Sparkles size={size} color={color} />;
      case 'building':
        return <Building size={size} color={color} />;
      case 'star':
        return <Star size={size} color={color} fill={color} />;
      case 'cake':
        return <PartyPopper size={size} color={color} />;
      case 'calendar':
        return <Calendar size={size} color={color} />;
      case 'music':
        return <Music size={size} color={color} />;
      case 'ticket':
        return <Ticket size={size} color={color} />;
      case 'heart':
      default:
        return <Heart size={size} color={color} fill={color} />;
    }
  };

  // Animation style resolver with cinematic transitions
  const getAnimationStyle = (delay = 0): React.CSSProperties => {
    return computeAnimationStyle(data.animationStyle || 'cinematic', delay);
  };

  // Story slide directional animation style (smooth horizontal sweep)
  const getSlideAnimationStyle = (): React.CSSProperties => {
    const anim = data.animationStyle || 'slide';
    if (anim === 'slide') {
      const animName = slideDirection === 'next' ? 'inviteSlideNext' : 'inviteSlidePrev';
      return {
        animation: `${animName} 0.42s cubic-bezier(0.16, 1, 0.3, 1) both`
      };
    }
    return computeAnimationStyle(data.animationStyle || 'cinematic', 0);
  };

  const isSlideMode = data.navigationMode === 'story_slide';
  const frameUrl = getFrameOverlayUrl(data.frameOverlay?.preset, data.frameOverlay?.url);

  // Background styling
  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      background: theme.bg,
      color: theme.text,
      minHeight: '100%',
      height: isSlideMode ? '100%' : 'auto',
      width: '100%',
      flex: 1,
      position: 'relative',
      paddingBottom: 0,
      overflowX: 'hidden',
      overflowY: isSlideMode ? 'hidden' : 'auto',
      touchAction: isSlideMode ? 'manipulation' : 'auto',
      overscrollBehavior: 'none',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    };

    if (data.backgroundType === 'color' && data.customBackgroundColor) {
      base.backgroundColor = data.customBackgroundColor;
    } else if (data.backgroundType === 'image' && data.customBackgroundImage) {
      const op = data.backgroundOpacity ?? 0.85;
      base.backgroundImage = `linear-gradient(rgba(10,10,16,${op}), rgba(10,10,16,${op})), url(${data.customBackgroundImage})`;
      base.backgroundSize = 'cover';
      base.backgroundPosition = 'center';
      base.backgroundAttachment = 'fixed';
    } else if (data.backgroundType === 'gradient') {
      base.background = data.customBackgroundGradient || BACKGROUND_GRADIENTS[0]?.gradient || `linear-gradient(180deg, ${theme.bg} 0%, ${theme.card} 60%, #060609 100%)`;
    }

    return base;
  };

  // Modular Custom Block Renderer
  const renderCustomBlock = (block: CustomBlock, currentTheme: any, isSlide = false) => {
    switch (block.type) {
      case 'map':
        return (
          <div
            style={{
              background: block.bgColor || currentTheme.card,
              borderRadius: block.borderRadius ?? 28,
              padding: isSlide ? 'clamp(16px, 3vh, 24px)' : '24px 20px',
              border: `1px solid ${currentTheme.border}`,
              textAlign: block.align || 'center',
              boxSizing: 'border-box',
              marginBottom: isSlide ? 0 : 20
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: `${currentTheme.accent}18`,
                color: currentTheme.accent,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}
            >
              <MapPin size={22} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: block.textColor || currentTheme.text }}>
              {block.title || 'Petunjuk Lokasi Acara'}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: currentTheme.subText, lineHeight: 1.5 }}>
              {block.content || data.eventLocation}
            </p>
            <a
              href={block.buttonUrl || data.googleMapsUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 99,
                background: block.accentColor || currentTheme.accent,
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: `0 4px 12px ${currentTheme.accent}35`
              }}
            >
              <ExternalLink size={14} /> {block.buttonText || 'Buka di Google Maps'}
            </a>
          </div>
        );

      case 'custom_button':
        return (
          <div
            style={{
              padding: isSlide ? '12px' : '16px 0',
              textAlign: block.align || 'center',
              marginBottom: isSlide ? 0 : 16
            }}
          >
            <a
              href={block.buttonUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: block.align === 'center' ? 'auto' : '100%',
                minWidth: 200,
                padding: '14px 24px',
                borderRadius: block.borderRadius ?? 99,
                background: block.bgColor || currentTheme.accent,
                color: block.textColor || '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                border: 'none',
                boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
              }}
            >
              <ExternalLink size={15} /> {block.buttonText || block.title || 'Aksi / Link'}
            </a>
          </div>
        );

      case 'divider':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '16px 0',
              margin: isSlide ? 0 : '10px 0 20px'
            }}
          >
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${currentTheme.border})` }} />
            <span style={{ fontSize: 16, color: currentTheme.accent }}>{block.icon || '🌸'}</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${currentTheme.border})` }} />
          </div>
        );

      case 'custom_text':
      default:
        return (
          <div
            style={{
              background: block.bgColor || currentTheme.card,
              borderRadius: block.borderRadius ?? 28,
              padding: isSlide ? 'clamp(16px, 3vh, 24px)' : '24px 20px',
              border: `1px solid ${currentTheme.border}`,
              textAlign: block.align || 'center',
              boxSizing: 'border-box',
              marginBottom: isSlide ? 0 : 20
            }}
          >
            {block.title && (
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: block.textColor || currentTheme.text }}>
                {block.title}
              </h3>
            )}
            {block.subtitle && (
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: currentTheme.subText, marginBottom: 12 }}>
                {block.subtitle}
              </div>
            )}
            {block.content && (
              <div style={{ fontSize: 12.5, color: block.textColor || currentTheme.text, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {block.content}
              </div>
            )}
            {block.buttonText && block.buttonUrl && (
              <div style={{ marginTop: 14 }}>
                <a
                  href={block.buttonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 18px',
                    borderRadius: 99,
                    background: block.accentColor || currentTheme.accent,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={13} /> {block.buttonText}
                </a>
              </div>
            )}
          </div>
        );
    }
  };

  const widgets = data.enabledWidgets || {
    cover: true,
    quote: true,
    mempelai: true,
    countdown: true,
    acara: true,
    story: true,
    gallery: true,
    video: true,
    hadiah: true,
    ucapan: true,
    navbar: true
  };

  // Dynamic story slides definition based on enabled widgets & data
  const getStorySlides = () => {
    const list: { id: string; label: string; render: () => React.ReactNode }[] = [];

    // 1. Cover & Countdown
    if (widgets.cover !== false) {
      list.push({
        id: 'cover',
        label: 'Sampul',
        render: () => (
          <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: theme.subText, fontWeight: 800, marginBottom: 8 }}>
              {data.categoryBadge || (data.eventType === 'wedding' ? "WALIMATUL 'URS" : "OFFICIAL INVITATION")}
            </div>
            <h1 style={{ fontSize: 'clamp(20px, 5.5vw, 26px)', fontWeight: 900, margin: '0 0 8px', color: theme.text }}>
              {data.title || (persons.length >= 2 ? `${persons[0].nickname || persons[0].fullName} & ${persons[1].nickname || persons[1].fullName}` : (persons[0]?.fullName || `${data.groom.nickname} & ${data.bride.nickname}`))}
            </h1>
            <p style={{ margin: '0 0 clamp(10px, 2vh, 18px)', fontSize: 'clamp(11.5px, 3.2vw, 13px)', color: theme.subText }}>
              {new Date(data.eventDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {widgets.countdown !== false && (
              <CountdownDisplay
                eventDate={data.eventDate}
                themeAccent={theme.accent}
                themeSubText={theme.subText}
                themeBorder={theme.border}
              />
            )}

            <div style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 16,
              padding: '10px 14px',
              border: `1px solid ${theme.border}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              maxWidth: '90%'
            }}>
              <span style={{ fontSize: 10.5, color: theme.subText }}>Yth:</span>
              <strong style={{ fontSize: 12, color: theme.text }}>{guestName}</strong>
            </div>
          </div>
        )
      });
    }

    // 2. Kutipan Ayat / Kata Mutiara
    if (widgets.quote !== false && data.quote) {
      list.push({
        id: 'quote',
        label: 'Ayat & Doa',
        render: () => (
          <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${theme.accent}20`, color: theme.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Sparkles size={20} />
            </div>
            <p style={{
              margin: '0 0 14px',
              fontSize: 'clamp(12px, 3.4vw, 14px)',
              fontStyle: 'italic',
              lineHeight: 1.7,
              color: theme.text
            }}>
              "{data.quote}"
            </p>
            <span style={{ fontSize: 11, fontWeight: 800, color: theme.accent, letterSpacing: '0.05em' }}>
              — {data.quoteSource || 'Kutipan Suci'}
            </span>
          </div>
        )
      });
    }

    // 3. Profil Mempelai / Pemateri (Mendukung > 2 pemateri)
    if (widgets.mempelai !== false) {
      const isWeddingPair = (data.eventType === 'wedding' || !data.eventType) && persons.length === 2;
      list.push({
        id: 'mempelai',
        label: data.personsLabel || (isWeddingPair ? 'Mempelai' : 'Pemateri'),
        render: () => {
          if (isWeddingPair) {
            const p1 = persons[0] || { nickname: data.groom?.nickname, fullName: data.groom?.fullName, photo: data.groom?.photo, parents: data.groom?.parents, instagram: data.groom?.instagram };
            const p2 = persons[1] || { nickname: data.bride?.nickname, fullName: data.bride?.fullName, photo: data.bride?.photo, parents: data.bride?.parents, instagram: data.bride?.instagram };
            return (
              <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'clamp(12px, 4vw, 20px)' }}>
                  <div style={{ flex: 1, maxWidth: 110 }}>
                    <div style={{
                      width: 'clamp(64px, 18vw, 84px)',
                      height: 'clamp(64px, 18vw, 84px)',
                      borderRadius: '50%',
                      border: `2px solid ${theme.accent}`,
                      overflow: 'hidden',
                      margin: '0 auto 8px',
                      boxShadow: `0 4px 14px ${theme.accent}40`
                    }}>
                      <img src={p1.photo || data.groom.photo} alt="Pria" style={{ width: '100%', height: '100%', objectFit: 'cover' }}  loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                    </div>
                    <strong style={{ fontSize: 'clamp(12px, 3.4vw, 14px)', color: theme.text, display: 'block' }}>{p1.nickname || p1.fullName}</strong>
                    <span style={{ fontSize: 9.5, color: theme.subText, display: 'block', marginTop: 2, lineHeight: 1.3 }}>{p1.fullName}</span>
                    {p1.instagram && (
                      <span style={{ fontSize: 9, color: theme.accent, display: 'block', marginTop: 3 }}>@{p1.instagram.replace(/^@/, '')}</span>
                    )}
                  </div>

                  <div style={{ fontSize: 18, color: theme.accent, fontWeight: 900 }}>&</div>

                  <div style={{ flex: 1, maxWidth: 110 }}>
                    <div style={{
                      width: 'clamp(64px, 18vw, 84px)',
                      height: 'clamp(64px, 18vw, 84px)',
                      borderRadius: '50%',
                      border: `2px solid ${theme.accent}`,
                      overflow: 'hidden',
                      margin: '0 auto 8px',
                      boxShadow: `0 4px 14px ${theme.accent}40`
                    }}>
                      <img src={p2.photo || data.bride.photo} alt="Wanita" style={{ width: '100%', height: '100%', objectFit: 'cover' }}  loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                    </div>
                    <strong style={{ fontSize: 'clamp(12px, 3.4vw, 14px)', color: theme.text, display: 'block' }}>{p2.nickname || p2.fullName}</strong>
                    <span style={{ fontSize: 9.5, color: theme.subText, display: 'block', marginTop: 2, lineHeight: 1.3 }}>{p2.fullName}</span>
                    {p2.instagram && (
                      <span style={{ fontSize: 9, color: theme.accent, display: 'block', marginTop: 3 }}>@{p2.instagram.replace(/^@/, '')}</span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 'clamp(10px, 2vh, 18px)', fontSize: 10, color: theme.subText, lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: 12 }}>
                  <div>Putra dari: <strong>{p1.parents || data.groom.parents}</strong></div>
                  <div style={{ marginTop: 3 }}>Putri dari: <strong>{p2.parents || data.bride.parents}</strong></div>
                </div>
              </div>
            );
          }

          // Multi-person / Pemateri / Pembicara layout (1, 3, 4, 5+ orang)
          return (
            <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: theme.accent, fontWeight: 800, marginBottom: 12 }}>
                {data.personsLabel || 'PEMATERI & PEMBICARA'}
              </div>
              <div style={{
                maxHeight: 'clamp(280px, 58vh, 420px)',
                overflowY: 'auto',
                paddingRight: 4,
                display: 'grid',
                gridTemplateColumns: persons.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(115px, 1fr))',
                gap: 10,
                scrollbarWidth: 'none'
              }}>
                {persons.map((person, idx) => (
                  <div
                    key={person.id || idx}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 16,
                      padding: '12px 8px',
                      border: `1px solid ${theme.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: 'clamp(54px, 15vw, 68px)',
                      height: 'clamp(54px, 15vw, 68px)',
                      borderRadius: '50%',
                      border: `2px solid ${theme.accent}`,
                      overflow: 'hidden',
                      margin: '0 auto 6px',
                      boxShadow: `0 4px 12px ${theme.accent}30`
                    }}>
                      <img src={person.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                        alt={person.fullName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                       loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                    </div>
                    {person.role && (
                      <span style={{
                        fontSize: 8.5,
                        color: theme.accent,
                        background: `${theme.accent}20`,
                        padding: '1px 6px',
                        borderRadius: 10,
                        fontWeight: 800,
                        marginBottom: 4,
                        display: 'inline-block'
                      }}>
                        {person.role}
                      </span>
                    )}
                    <strong style={{ fontSize: 'clamp(11px, 3.2vw, 12.5px)', color: theme.text, display: 'block', lineHeight: 1.25 }}>
                      {person.fullName || person.nickname}
                    </strong>
                    {person.parents && (
                      <span style={{ fontSize: 9, color: theme.subText, display: 'block', marginTop: 3, lineHeight: 1.3 }}>
                        {person.parents}
                      </span>
                    )}
                    {person.instagram && (
                      <a
                        href={`https://instagram.com/${person.instagram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 9,
                          color: theme.accent,
                          marginTop: 4,
                          textDecoration: 'none',
                          fontWeight: 700
                        }}
                      >
                        @{person.instagram.replace(/^@/, '')}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
      });
    }

    // 4. Kisah Cinta (Love Story Timeline)
    if (widgets.story !== false && data.loveStories && data.loveStories.length > 0) {
      list.push({
        id: 'story',
        label: 'Kisah Cinta',
        render: () => (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: theme.accent, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <Heart size={12} /> Kisah Cinta
              </div>
              <h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 900, color: theme.text }}>
                Our Love Journey
              </h3>
            </div>

            <div style={{ maxHeight: 'clamp(220px, 50vh, 320px)', overflowY: 'auto', paddingRight: 4, scrollbarWidth: 'none' }}>
              <div style={{ position: 'relative', paddingLeft: 18, borderLeft: `2px dashed ${theme.border}` }}>
                {data.loveStories.map((story, idx) => (
                  <div key={story.id || idx} style={{ marginBottom: 16, position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: -24,
                      top: 3,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: theme.accent,
                      border: `2px solid ${theme.card}`
                    }} />
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: theme.accent, background: `${theme.accent}18`, padding: '1px 6px', borderRadius: 99 }}>
                      {story.yearOrPhase}
                    </span>
                    <h5 style={{ margin: '3px 0 3px', fontSize: 12, fontWeight: 800, color: theme.text }}>
                      {story.title}
                    </h5>
                    <p style={{ margin: 0, fontSize: 10.5, color: theme.subText, lineHeight: 1.4 }}>
                      {story.story}
                    </p>
                    {story.photo && (
                      <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 90, marginTop: 6, border: `1px solid ${theme.border}` }}>
                        <img src={story.photo} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}  loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      });
    }

    // 5. Rangkaian Acara
    if (widgets.acara !== false) {
      list.push({
        id: 'acara',
        label: 'Acara',
        render: () => (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 12px', textAlign: 'center', fontSize: 14, fontWeight: 800, color: theme.accent }}>
              Rangkaian Acara
            </h3>
            
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '10px 12px', border: `1px solid ${theme.border}`, marginBottom: 8 }}>
              <strong style={{ fontSize: 12, color: theme.accent, display: 'block' }}>{data.akad.title}</strong>
              <div style={{ fontSize: 10.5, color: theme.text, margin: '3px 0' }}><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />{data.akad.time}</div>
              <div style={{ fontSize: 10, color: theme.subText }}><MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />{data.akad.venue}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '10px 12px', border: `1px solid ${theme.border}`, marginBottom: 10 }}>
              <strong style={{ fontSize: 12, color: theme.accent, display: 'block' }}>{data.reception.title}</strong>
              <div style={{ fontSize: 10.5, color: theme.text, margin: '3px 0' }}><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />{data.reception.time}</div>
              <div style={{ fontSize: 10, color: theme.subText }}><MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />{data.reception.venue}</div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
              <button
                type="button"
                onClick={() => window.open(generateGoogleCalendarUrl(data), '_blank')}
                style={{
                  padding: '7px 10px',
                  borderRadius: 10,
                  background: `${theme.accent}25`,
                  color: theme.text,
                  border: `1px solid ${theme.accent}`,
                  fontSize: 10.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <CalendarPlus size={12} color={theme.accent} /> Google Calendar
              </button>
              <button
                type="button"
                onClick={() => downloadIcsFile(data)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  color: theme.subText,
                  border: `1px solid ${theme.border}`,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <Download size={11} /> Unduh .ICS
              </button>
            </div>
          </div>
        )
      });
    }

    // 6. Galeri Foto Prewedding
    if (widgets.gallery !== false && ((data.galleryItems && data.galleryItems.length > 0) || (data.galleryImages && data.galleryImages.length > 0))) {
      list.push({
        id: 'gallery',
        label: 'Galeri',
        render: () => {
          const images = data.galleryItems && data.galleryItems.length > 0
            ? data.galleryItems.map(g => g.url)
            : (data.galleryImages || defaultGalleryImages);
          return (
            <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: theme.accent, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                <ImageIcon size={12} /> Galeri Foto
              </div>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 900, color: theme.text }}>
                Moments of Us
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 6,
                maxHeight: 'clamp(200px, 48vh, 300px)',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                padding: 2
              }}>
                {images.slice(0, 8).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      aspectRatio: '1',
                      border: `1px solid ${theme.border}`,
                      cursor: 'pointer'
                    }}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}  loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 9.5, color: theme.subText, display: 'block', marginTop: 6 }}>
                Klik foto untuk memperbesar
              </span>
            </div>
          );
        }
      });
    }

    // 7. Video Teaser Prewedding
    if (widgets.video !== false && data.videoUrl) {
      list.push({
        id: 'video',
        label: 'Video',
        render: () => {
          let embedUrl = data.videoUrl;
          if (embedUrl.includes('youtube.com/watch?v=')) {
            embedUrl = embedUrl.replace('watch?v=', 'embed/');
          } else if (embedUrl.includes('youtu.be/')) {
            embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
          }
          return (
            <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: theme.accent, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                <Film size={12} /> Video Teaser
              </div>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 900, color: theme.text }}>
                Our Cinematic Story
              </h3>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: 14,
                border: `1px solid ${theme.border}`,
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
              }}>
                <iframe
                  src={embedUrl}
                  title="Video Teaser"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
          );
        }
      });
    }

    // 8. Amplop Digital & Hadiah
    if (widgets.hadiah !== false && data.bankAccounts && data.bankAccounts.length > 0) {
      list.push({
        id: 'hadiah',
        label: 'Kado',
        render: () => (
          <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${theme.accent}20`, color: theme.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Gift size={18} />
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: theme.text }}>
              Amplop Digital & Kado
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 10.5, color: theme.subText }}>
              Tanda kasih dan doa restu untuk kami:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'clamp(180px, 44vh, 260px)', overflowY: 'auto', scrollbarWidth: 'none' }}>
              {data.bankAccounts.map((b, idx) => {
                const isCopied = copiedAccount === b.accountNumber;
                return (
                  <div key={idx} style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '10px 12px',
                    borderRadius: 14,
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: theme.accent, display: 'block' }}>{b.bank}</span>
                      <strong style={{ fontSize: 12.5, color: theme.text }}>{b.accountNumber}</strong>
                      <div style={{ fontSize: 9.5, color: theme.subText }}>a.n {b.accountName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(b.accountNumber)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        background: isCopied ? '#10b981' : theme.accent,
                        color: '#fff',
                        border: 'none',
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {isCopied ? <Check size={11} /> : <Copy size={11} />}
                      {isCopied ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )
      });
    }

    // 9. Buku Tamu & RSVP Doa
    if (widgets.ucapan !== false) {
      list.push({
        id: 'ucapan',
        label: 'RSVP & Doa',
        render: () => (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, textAlign: 'center', color: theme.text }}>
              Konfirmasi RSVP & Doa
            </h3>
            <form onSubmit={handleSubmitRsvp} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="invite-input"
                style={{ padding: '8px 12px', fontSize: 11.5 }}
                value={rsvpName}
                onChange={e => setRsvpName(e.target.value)}
                placeholder="Nama Anda..."
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                {[
                  { id: 'hadir', label: 'Hadir' },
                  { id: 'ragu', label: 'Ragu' },
                  { id: 'tidak_hadir', label: 'Absen' }
                ].map(att => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => setRsvpAttendance(att.id as any)}
                    style={{
                      padding: '6px 2px',
                      borderRadius: 8,
                      border: rsvpAttendance === att.id ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                      background: rsvpAttendance === att.id ? `${theme.accent}25` : 'rgba(0,0,0,0.2)',
                      color: rsvpAttendance === att.id ? theme.text : theme.subText,
                      fontSize: 10,
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                  >
                    {att.label}
                  </button>
                ))}
              </div>

              <textarea
                className="invite-input"
                style={{ minHeight: 52, padding: '8px 12px', fontSize: 11, resize: 'none' }}
                value={rsvpMessage}
                onChange={e => setRsvpMessage(e.target.value)}
                placeholder="Tuliskan doa restu tulus..."
                required
              />

              {rsvpSuccess && (
                <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: 10.5, fontWeight: 700 }}>
                  âœ“ Ucapan RSVP berhasil dikirim!
                </div>
              )}

              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: 99,
                  background: theme.accent,
                  color: '#fff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <Send size={11} /> Kirim Doa
              </button>
            </form>
          </div>
        )
      });
    }

    // 10. Tiket QR Pass Tamu
    if (!data.hideQrPass) {
      list.push({
        id: 'qr_pass',
        label: 'Tiket QR',
        render: () => (
          <div style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Ticket size={20} />
            </div>
            <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 800, color: theme.text }}>
              Official Guest Pass
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: 10.5, color: theme.subText }}>
              Gunakan tiket ini untuk check-in:
            </p>

            <div style={{
              background: '#ffffff',
              padding: '10px',
              borderRadius: 16,
              width: 'clamp(110px, 32vw, 140px)',
              margin: '0 auto 8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              boxSizing: 'border-box'
            }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(matchedGuest.qrSecretCode)}`}
                alt="QR Pass"
                style={{ width: '100%', height: 'auto', display: 'block' }}
               loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
            </div>

            <div style={{ fontSize: 12, fontWeight: 900, color: theme.accent, letterSpacing: '0.05em' }}>
              {matchedGuest.qrSecretCode}
            </div>
            <div style={{ fontSize: 10.5, color: theme.subText, marginTop: 3 }}>
              Nama: <strong>{guestName}</strong> ({matchedGuest.category || 'Tamu'})
            </div>
            <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginTop: 4 }}>
              Kuota: {matchedGuest.paxQuota || 2} Orang
            </div>
          </div>
        )
      });
    }

    // Modular Custom Blocks as Slides
    (data.customBlocks || []).forEach((block, idx) => {
      if (block.enabled !== false) {
        list.push({
          id: block.id || `custom-${idx}`,
          label: block.title || 'Widget',
          render: () => renderCustomBlock(block, theme, true)
        });
      }
    });

    return list;
  };

  const storySlides = getStorySlides();
  const totalSlides = Math.max(1, storySlides.length);

  return (
    <div style={getContainerStyle()}>

      {/* HTML5 Audio Background Music Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        src={data.musicUrl || 'https://assets.mixkit.co/music/preview/mixkit-romantic-wedding-689.mp3'}
        onPlay={() => setIsPlayingMusic(true)}
        onPause={() => setIsPlayingMusic(false)}
      />

      {/* Floating Transparent Glass Music Button (Shown only when cover is active or vertical scroll) */}
      {data.musicUrl && (!isOpen || !isSlideMode) && (
        <button
          type="button"
          onClick={handleToggleMusic}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 70,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s ease'
          }}
          title={isPlayingMusic ? 'Jeda Musik' : 'Putar Musik'}
        >
          {isPlayingMusic ? (
            <div style={{ animation: 'inviteSpin 6s linear infinite', display: 'flex' }}>
              <Volume2 size={16} />
            </div>
          ) : (
            <VolumeX size={16} />
          )}
        </button>
      )}



      {/* ── BACKGROUND PATTERN OVERLAY ── */}
      {data.backgroundPattern && data.backgroundPattern !== 'none' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            backgroundImage: 
              data.backgroundPattern === 'dots' 
                ? 'radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)'
                : data.backgroundPattern === 'grid'
                ? 'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)'
                : data.backgroundPattern === 'stars'
                ? 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 40px 70px, #eab308, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0))'
                : undefined,
            backgroundSize:
              data.backgroundPattern === 'dots'
                ? '20px 20px'
                : data.backgroundPattern === 'grid'
                ? '24px 24px'
                : data.backgroundPattern === 'stars'
                ? '120px 120px'
                : undefined
          }}
        />
      )}

      {/* ── 1. COVER OVERLAY (BUKA UNDANGAN / GERBANG PEMBUKA) ── */}
      {(forceCoverOpen || !isOpen) ? (
        <div
          style={{
            minHeight: isSlideMode ? '100%' : '100vh',
            height: isSlideMode ? '100%' : 'auto',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 20,
            ...(data.coverConfig?.bgType === 'image' && data.coverConfig?.bgImage
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,${data.coverConfig.bgOpacity ?? 0.55}), rgba(0,0,0,${data.coverConfig.bgOpacity ?? 0.55})), url("${data.coverConfig.bgImage}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }
              : data.coverConfig?.bgType === 'gradient' && data.coverConfig?.bgGradient
              ? { background: data.coverConfig.bgGradient }
              : data.coverConfig?.bgType === 'color' && data.coverConfig?.bgColor
              ? { backgroundColor: data.coverConfig.bgColor }
              : {})
          }}
          onClick={() => {
            if (isVisualEditMode) {
              onSelectBlock?.('cover');
            }
          }}
        >
          {/* Visual Edit Floating Studio Badge for Cover */}
          {isVisualEditMode && (
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCoverStudio?.();
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 99,
                  background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 6px 18px rgba(236,72,153,0.4)',
                  transition: 'all 0.2s'
                }}
              >
                <Sparkles size={14} /> Kustomisasi Desain Cover
              </button>
            </div>
          )}

          {/* Render Cover based on CoverConfig style */}
          {(() => {
            const cfg = data.coverConfig || {};
            const style = cfg.style || 'classic';
            const coverTitle = cfg.title || data.title || (persons.length >= 2 ? `${persons[0].nickname || persons[0].fullName} & ${persons[1].nickname || persons[1].fullName}` : (persons[0]?.fullName || `${data.groom.nickname} & ${data.bride.nickname}`));
            const coverBadge = cfg.badge || data.categoryBadge || (data.eventType === 'wedding' ? 'THE WEDDING OF' : 'OFFICIAL INVITATION');
            const coverDate = cfg.subtitle || (data.eventDate ? new Date(data.eventDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Save the Date');
            const coverBtnText = cfg.openButtonText || 'Buka Undangan';
            const guestLbl = cfg.guestLabel || 'Kepada Yth. Bapak/Ibu/Saudara/i:';

            if (style === 'poster') {
              return (
                <div
                  style={{
                    maxWidth: 440,
                    width: '100%',
                    background: 'rgba(10,10,14,0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `2px solid ${theme.border}`,
                    borderRadius: 20,
                    padding: '32px 24px',
                    boxSizing: 'border-box',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
                    position: 'relative',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: theme.accent, fontWeight: 900, marginBottom: 12 }}>
                    SPECIAL ISSUE // {coverBadge}
                  </div>
                  <div style={{ height: 2, width: 40, background: theme.accent, margin: '0 auto 16px' }} />
                  <h1 style={{ fontSize: 'clamp(26px, 7vw, 34px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                    {coverTitle}
                  </h1>
                  <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 6, background: `${theme.accent}20`, border: `1px solid ${theme.border}`, color: theme.accent, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 20 }}>
                    {coverDate}
                  </div>

                  {cfg.showCountdown && (
                    <div style={{ margin: '10px 0 18px' }}>
                      <CountdownDisplay
                        eventDate={data.eventDate}
                        themeAccent={theme.accent}
                        themeSubText={theme.subText}
                        themeBorder={theme.border}
                        maxWidth={320}
                        gap={6}
                      />
                    </div>
                  )}

                  {cfg.showGuestName !== false && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                      <span style={{ fontSize: 10.5, color: theme.subText, display: 'block', marginBottom: 3 }}>
                        {guestLbl}
                      </span>
                      <strong style={{ fontSize: 15, color: '#ffffff', display: 'block' }}>
                        {guestName}
                      </strong>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenInvitation}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: 12,
                      background: theme.accent,
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 900,
                      fontSize: 13,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: `0 8px 24px ${theme.accent}45`
                    }}
                  >
                    <MailOpen size={16} /> {coverBtnText}
                  </button>
                </div>
              );
            }

            if (style === 'luxury_arch') {
              return (
                <div
                  style={{
                    maxWidth: 420,
                    width: '100%',
                    background: 'rgba(18,14,10,0.88)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '2px solid rgba(234, 179, 8, 0.45)',
                    outline: '1px solid rgba(234, 179, 8, 0.2)',
                    outlineOffset: '-6px',
                    borderRadius: '160px 160px 28px 28px',
                    padding: '48px 24px 32px',
                    boxSizing: 'border-box',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(234, 179, 8, 0.2)',
                    position: 'relative',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                    <Sparkles size={24} />
                  </div>
                  <div style={{ fontSize: 10.5, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#eab308', fontWeight: 800, marginBottom: 10 }}>
                    {coverBadge}
                  </div>
                  <h1 style={{ fontSize: 'clamp(24px, 6vw, 30px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.25, color: '#fef08a', fontFamily: "'Playfair Display', serif" }}>
                    {coverTitle}
                  </h1>
                  <div style={{ fontSize: 12, color: '#d4d4d8', marginBottom: 20 }}>
                    {coverDate}
                  </div>

                  {cfg.showCountdown && (
                    <div style={{ margin: '0 0 18px' }}>
                      <CountdownDisplay
                        eventDate={data.eventDate}
                        themeAccent="#eab308"
                        themeSubText="#a1a1aa"
                        themeBorder="rgba(234, 179, 8, 0.3)"
                        maxWidth={320}
                        gap={6}
                      />
                    </div>
                  )}

                  {cfg.showGuestName !== false && (
                    <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: 16, padding: '12px 18px', marginBottom: 22 }}>
                      <span style={{ fontSize: 10.5, color: '#a1a1aa', display: 'block', marginBottom: 3 }}>
                        {guestLbl}
                      </span>
                      <strong style={{ fontSize: 14.5, color: '#ffffff', display: 'block' }}>
                        {guestName}
                      </strong>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenInvitation}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: 99,
                      background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                      color: '#000',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 13.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 8px 24px rgba(234, 179, 8, 0.4)'
                    }}
                  >
                    <MailOpen size={16} /> {coverBtnText}
                  </button>
                </div>
              );
            }

            if (style === 'hero_full') {
              return (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 440,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px 8px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ paddingTop: 30 }}>
                    <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 99, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 14 }}>
                      {coverBadge}
                    </div>
                    <h1 style={{ fontSize: 'clamp(26px, 7.5vw, 36px)', fontWeight: 900, margin: '0 0 10px', color: '#ffffff', textShadow: '0 4px 16px rgba(0,0,0,0.8)' }}>
                      {coverTitle}
                    </h1>
                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                      {coverDate}
                    </p>
                  </div>

                  <div
                    style={{
                      background: 'rgba(15,15,22,0.82)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderRadius: 24,
                      padding: '22px 20px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                    }}
                  >
                    {cfg.showGuestName !== false && (
                      <div style={{ marginBottom: 16 }}>
                        <span style={{ fontSize: 10.5, color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                          {guestLbl}
                        </span>
                        <strong style={{ fontSize: 15, color: '#ffffff' }}>
                          {guestName}
                        </strong>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenInvitation}
                      style={{
                        width: '100%',
                        padding: '13px 20px',
                        borderRadius: 99,
                        background: theme.accent,
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: 13.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: `0 8px 20px ${theme.accent}40`
                      }}
                    >
                      <MailOpen size={16} /> {coverBtnText}
                    </button>
                  </div>
                </div>
              );
            }

            if (style === 'modern') {
              return (
                <div
                  style={{
                    maxWidth: 420,
                    width: '100%',
                    background: 'rgba(15, 17, 23, 0.88)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 28,
                    padding: '36px 24px',
                    boxSizing: 'border-box',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ display: 'inline-flex', padding: '3px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, marginBottom: 16 }}>
                    {coverBadge}
                  </div>
                  <h1 style={{ fontSize: 'clamp(24px, 6.5vw, 32px)', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.2, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    {coverTitle}
                  </h1>
                  <p style={{ margin: '0 0 22px', fontSize: 12.5, color: '#94a3b8' }}>
                    {coverDate}
                  </p>

                  {cfg.showCountdown && (
                    <div style={{ margin: '0 0 20px' }}>
                      <CountdownDisplay
                        eventDate={data.eventDate}
                        themeAccent={theme.accent}
                        themeSubText={theme.subText}
                        themeBorder={theme.border}
                        maxWidth={320}
                        gap={6}
                      />
                    </div>
                  )}

                  {cfg.showGuestName !== false && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '12px 18px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 22 }}>
                      <span style={{ fontSize: 10.5, color: '#94a3b8', display: 'block', marginBottom: 2 }}>{guestLbl}</span>
                      <strong style={{ fontSize: 14.5, color: '#ffffff', display: 'block' }}>{guestName}</strong>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenInvitation}
                    style={{
                      width: '100%',
                      padding: '13px 20px',
                      borderRadius: 99,
                      background: theme.accent,
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: `0 8px 20px ${theme.accent}35`
                    }}
                  >
                    <MailOpen size={16} /> {coverBtnText}
                  </button>
                </div>
              );
            }

            // Default 'classic'
            return (
              <div
                style={{
                  maxWidth: 440,
                  width: '100%',
                  background: theme.card,
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: 24,
                  padding: 'clamp(22px, 4vh, 34px) clamp(16px, 4vw, 24px)',
                  boxSizing: 'border-box',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: `${theme.accent}18`,
                  color: theme.accent,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  {renderMainIcon(22, theme.accent)}
                </div>

                <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: theme.subText, fontWeight: 700, marginBottom: 8 }}>
                  {coverBadge}
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 10px', lineHeight: 1.25, color: theme.text }}>
                  {coverTitle}
                </h1>

                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: theme.subText }}>
                  {coverDate}
                </p>

                <div style={{ height: 1, width: 60, background: theme.border, margin: '0 auto 20px' }} />

                {cfg.showCountdown && (
                  <div style={{ margin: '0 0 18px' }}>
                    <CountdownDisplay
                      eventDate={data.eventDate}
                      themeAccent={theme.accent}
                      themeSubText={theme.subText}
                      themeBorder={theme.border}
                      maxWidth={320}
                      gap={6}
                    />
                  </div>
                )}

                {cfg.showGuestName !== false && (
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 16,
                    padding: '14px 18px',
                    marginBottom: 24
                  }}>
                    <span style={{ fontSize: 11, color: theme.subText, display: 'block', marginBottom: 4 }}>
                      {guestLbl}
                    </span>
                    <strong style={{ fontSize: 15, color: theme.text, display: 'block' }}>
                      {guestName}
                    </strong>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleOpenInvitation}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 99,
                    background: theme.accent,
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: `0 8px 20px ${theme.accent}40`
                  }}
                >
                  <MailOpen size={16} /> {coverBtnText}
                </button>
              </div>
            );
          })()}
        </div>
      ) : data.navigationMode === 'story_slide' ? (
        /* â”€â”€ 2A. MODE STORY SLIDE (HORIZONTAL SWIPE - STRICT NO VERTICAL SCROLL) â”€â”€ */
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{ 
            width: '100%',
            maxWidth: '100%', 
            height: '100%', 
            maxHeight: '100%',
            overflow: 'hidden', 
            margin: 0, 
            padding: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            boxSizing: 'border-box',
            flex: 1,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation',
            background: (() => {
              const slideBg = data.slideBackgrounds?.[activeSlideIndex];
              if (slideBg?.bgType === 'color' && slideBg.color) return slideBg.color;
              return theme.card;
            })(),
            backgroundImage: (() => {
              const slideBg = data.slideBackgrounds?.[activeSlideIndex];
              if (slideBg?.bgType === 'image' && slideBg.image) {
                const darkness = slideBg.opacity ?? 0.65;
                return `linear-gradient(rgba(10,10,16,${darkness}), rgba(10,10,16,${darkness + 0.1})), url(${slideBg.image})`;
              }
              if (data.backgroundType === 'image' && data.customBackgroundImage) {
                return `linear-gradient(rgba(10,10,16,0.65), rgba(10,10,16,0.82)), url(${data.customBackgroundImage})`;
              }
              return undefined;
            })(),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* ══ TOP STORY PROGRESS BARS — FLOATING AT TOP (Z=60) ══ */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            gap: 4,
            zIndex: 60,
            boxSizing: 'border-box'
          }}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSlideDirection(i > activeSlideIndex ? 'next' : 'prev');
                  setActiveSlideIndex(i);
                }}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 99,
                  background: i === activeSlideIndex ? theme.accent : i < activeSlideIndex ? `${theme.accent}99` : 'rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: i === activeSlideIndex ? `0 0 8px ${theme.accent}88` : 'none'
                }}
              />
            ))}
          </div>

          {/* ══ FRAME OVERLAY EDGE-TO-EDGE — EXACT 1080x1920 CANVAS (Z=30) ══ */}
          {data.frameOverlay?.enabled && frameUrl && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 30,
                backgroundImage: `url("${frameUrl}")`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                opacity: data.frameOverlay.opacity ?? 0.85
              }}
            />
          )}

          {/* ══ INSTAGRAM STORY TAP ZONES (LEFT 25% PREV, RIGHT 25% NEXT) ══ */}
          <div
            onClick={(e) => {
              const target = e.target;
              if (target && target.closest && target.closest('button, input, textarea, a, select')) return;
              if (activeSlideIndex > 0) {
                setSlideDirection('prev');
                setActiveSlideIndex(p => p - 1);
              }
            }}
            style={{
              position: 'absolute',
              top: 36,
              bottom: 60,
              left: 0,
              width: '25%',
              zIndex: 35,
              cursor: activeSlideIndex > 0 ? 'pointer' : 'default'
            }}
            title="Ketuk untuk slide sebelumnya"
          />
          <div
            onClick={(e) => {
              const target = e.target;
              if (target && target.closest && target.closest('button, input, textarea, a, select')) return;
              if (activeSlideIndex < totalSlides - 1) {
                setSlideDirection('next');
                setActiveSlideIndex(p => p + 1);
              }
            }}
            style={{
              position: 'absolute',
              top: 36,
              bottom: 60,
              right: 0,
              width: '25%',
              zIndex: 35,
              cursor: activeSlideIndex < totalSlides - 1 ? 'pointer' : 'default'
            }}
            title="Ketuk untuk slide berikutnya"
          />

          {/* ══ DYNAMIC SLIDE CONTENT — FULL BLEED 9:16 CANVAS WITH VERTICAL CENTERING (Z=40) ══ */}
          <div style={{
            flex: 1,
            width: '100%',
            height: '100%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'clamp(36px, 6vh, 48px) clamp(16px, 4vw, 22px) clamp(64px, 9vh, 76px) clamp(16px, 4vw, 22px)',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 40,
            overflowY: 'auto',
            scrollbarWidth: 'none'
          }}>
            {storySlides[activeSlideIndex] && (
              <div
                key={activeSlideIndex}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  ...getSlideAnimationStyle()
                }}
              >
                {storySlides[activeSlideIndex].render()}
              </div>
            )}
          </div>

          {/* ══ BOTTOM STORY CONTROLS: FLOATING AT BOTTOM (Z=65) ══ */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            zIndex: 65,
            pointerEvents: 'auto',
            boxSizing: 'border-box'
          }}>
            {/* Prev Button */}
            <button
              type="button"
              disabled={activeSlideIndex === 0}
              onClick={() => {
                setSlideDirection('prev');
                setActiveSlideIndex(prev => Math.max(0, prev - 1));
              }}
              title="Sebelumnya"
              className="invite-btn-cinema"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: activeSlideIndex === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                color: activeSlideIndex === 0 ? 'rgba(255,255,255,0.2)' : theme.text,
                border: '1px solid rgba(255,255,255,0.14)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                cursor: activeSlideIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: activeSlideIndex === 0 ? 'none' : '0 4px 14px rgba(0,0,0,0.35)'
              }}
            >
              <ChevronLeft size={20} />
            </button>

            {/* Music Toggle (if musicUrl present) */}
            {data.musicUrl && (
              <button
                type="button"
                onClick={handleToggleMusic}
                title={isPlayingMusic ? 'Jeda Musik' : 'Putar Musik'}
                className="invite-btn-cinema"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: isPlayingMusic ? `${theme.accent}30` : 'rgba(255,255,255,0.12)',
                  color: isPlayingMusic ? theme.accent : theme.text,
                  border: isPlayingMusic ? `1.5px solid ${theme.accent}` : '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isPlayingMusic ? `0 0 14px ${theme.accent}55` : '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                {isPlayingMusic ? (
                  <div style={{ animation: 'inviteSpin 6s linear infinite', display: 'flex' }}>
                    <Volume2 size={17} />
                  </div>
                ) : (
                  <VolumeX size={17} />
                )}
              </button>
            )}

            {/* QR Pass Button */}
            {!data.hideQrPass && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                title="Tiket QR Undangan"
                className="invite-btn-cinema"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: `${theme.accent}22`,
                  color: theme.accent,
                  border: `1.5px solid ${theme.accent}`,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 14px ${theme.accent}35`
                }}
              >
                <QrCode size={18} />
              </button>
            )}

            {/* Next Button */}
            <button
              type="button"
              disabled={activeSlideIndex === totalSlides - 1}
              onClick={() => {
                setSlideDirection('next');
                setActiveSlideIndex(prev => Math.min(totalSlides - 1, prev + 1));
              }}
              title="Selanjutnya"
              className="invite-btn-cinema"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: activeSlideIndex === totalSlides - 1 ? 'rgba(255,255,255,0.05)' : theme.accent,
                color: '#fff',
                border: 'none',
                cursor: activeSlideIndex === totalSlides - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: activeSlideIndex === totalSlides - 1 ? 'none' : `0 4px 16px ${theme.accent}60`
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

        </div>

      ) : (

        /* ── 2B. ISI LENGKAP UNDANGAN (VERTICAL SCROLL) ── */
        <div style={{ width: '100%', maxWidth: 440, margin: '0 auto', padding: '20px 16px 80px', boxSizing: 'border-box', position: 'relative' }}>

          {/* Frame Overlay in Vertical Scroll Mode */}
          {data.frameOverlay?.enabled && frameUrl && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: 440,
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 35,
                backgroundImage: `url("${frameUrl}")`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                opacity: data.frameOverlay.opacity ?? 0.85
              }}
            />
          )}

          {/* Hero Banner */}
          <VisualBlockWrapper
            blockId="hero"
            blockLabel="Sampul & Banner"
            icon="👑"
            isSelected={selectedBlockId === 'hero'}
            isVisualEditMode={isVisualEditMode}
            onSelect={() => onSelectBlock?.('hero')}
            onInsertBelow={() => onOpenAddWidget?.('hero')}
          >
            <ScrollRevealSection delay={0.05}>
              <div style={{
                textAlign: 'center',
                padding: '40px 20px 30px',
                background: theme.card,
                borderRadius: 32,
                border: `1px solid ${theme.border}`,
                marginBottom: 20,
                position: 'relative'
              }}>
                <div style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: theme.subText, fontWeight: 800, marginBottom: 8 }}>
                  {data.categoryBadge || (data.eventType === 'wedding' ? "WALIMATUL 'URS" : "OFFICIAL INVITATION")}
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 10px', color: theme.text }}>
                  {data.title || (persons.length >= 2 ? `${persons[0].nickname || persons[0].fullName} & ${persons[1].nickname || persons[1].fullName}` : (persons[0]?.fullName || `${data.groom.nickname} & ${data.bride.nickname}`))}
                </h1>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: theme.subText }}>
                  {new Date(data.eventDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                {/* Countdown Grid */}
                {widgets.countdown !== false && (
                  <CountdownDisplay
                    eventDate={data.eventDate}
                    themeAccent={theme.accent}
                    themeSubText={theme.subText}
                    themeBorder={theme.border}
                    maxWidth={340}
                    gap={8}
                  />
                )}

                {/* Guest Pass Shortcut Banner */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 20,
                  padding: '12px 18px',
                  border: `1px solid ${theme.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: 10.5, color: theme.subText, display: 'block' }}>Tamu Terhormat:</span>
                    <strong style={{ fontSize: 14, color: theme.text }}>{guestName}</strong>
                  </div>
                  {!data.hideQrPass && (
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 99,
                        background: theme.accent,
                        color: '#fff',
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      <QrCode size={13} /> Tiket QR Pass
                    </button>
                  )}
                </div>
              </div>
            </ScrollRevealSection>
          </VisualBlockWrapper>

          {/* Ayat / Quote */}
          {widgets.quote !== false && data.quote && (
            <VisualBlockWrapper
              blockId="quote"
              blockLabel="Kutipan Ayat / Doa"
              icon="✨"
              isSelected={selectedBlockId === 'quote'}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.('quote')}
              onDelete={() => onDeleteBlock?.('quote')}
              onInsertBelow={() => onOpenAddWidget?.('quote')}
            >
              <ScrollRevealSection animationStyle={data.animationStyle} delay={0.08}>
                <div style={{
                  background: theme.card,
                  borderRadius: 24,
                  padding: '24px 22px',
                  border: `1px solid ${theme.border}`,
                  textAlign: 'center',
                  marginBottom: 20
                }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.6, color: theme.text }}>
                    {data.quote}
                  </p>
                  <span style={{ fontSize: 11, fontWeight: 800, color: theme.accent }}>
                    {data.quoteSource}
                  </span>
                </div>
              </ScrollRevealSection>
            </VisualBlockWrapper>
          )}

          {/* Profil Mempelai / Tokoh / Pemateri */}
          {widgets.mempelai !== false && (
            <VisualBlockWrapper
              blockId="mempelai"
              blockLabel="Profil Mempelai / Tokoh"
              icon="💍"
              isSelected={selectedBlockId === 'mempelai'}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.('mempelai')}
              onDelete={() => onDeleteBlock?.('mempelai')}
              onInsertBelow={() => onOpenAddWidget?.('mempelai')}
            >
              <ScrollRevealSection animationStyle={data.animationStyle} delay={0.1}>
              <div id="mempelai" style={{
                background: theme.card,
                borderRadius: 32,
                padding: '30px 22px',
                border: `1px solid ${theme.border}`,
                marginBottom: 20,
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 24px', fontSize: 16, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.accent }}>
                  {data.personsLabel || (((data.eventType === 'wedding' || !data.eventType) && persons.length === 2) ? 'Mempelai Yang Berbahagia' : 'Tokoh & Pemateri Acara')}
                </h3>

                {((data.eventType === 'wedding' || !data.eventType) && persons.length === 2) ? (
                  <>
                    {/* Groom */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ width: 104, height: 104, borderRadius: '50%', border: `3px solid ${theme.accent}`, overflow: 'hidden', margin: '0 auto 12px' }}>
                        <img src={persons[0].photo || data.groom.photo} alt="Pria" style={{ width: '100%', height: '100%', objectFit: 'cover' }}  loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                      </div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900, color: theme.text }}>
                        {persons[0].fullName || data.groom.fullName}
                      </h4>
                      <p style={{ margin: 0, fontSize: 11.5, color: theme.subText }}>
                        {persons[0].parents || data.groom.parents}
                      </p>
                      {persons[0].instagram && (
                        <span style={{ fontSize: 11, color: theme.accent, display: 'block', marginTop: 4 }}>
                          @{persons[0].instagram.replace(/^@/, '')}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 24, color: theme.accent, margin: '12px 0' }}>&</div>

                    {/* Bride */}
                    <div>
                      <div style={{ width: 104, height: 104, borderRadius: '50%', border: `3px solid ${theme.accent}`, overflow: 'hidden', margin: '0 auto 12px' }}>
                        <img src={persons[1].photo || data.bride.photo} alt="Wanita" style={{ width: '100%', height: '100%', objectFit: 'cover' }}  loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                      </div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 900, color: theme.text }}>
                        {persons[1].fullName || data.bride.fullName}
                      </h4>
                      <p style={{ margin: 0, fontSize: 11.5, color: theme.subText }}>
                        {persons[1].parents || data.bride.parents}
                      </p>
                      {persons[1].instagram && (
                        <span style={{ fontSize: 11, color: theme.accent, display: 'block', marginTop: 4 }}>
                          @{persons[1].instagram.replace(/^@/, '')}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: persons.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 16,
                    justifyContent: 'center'
                  }}>
                    {persons.map((person, idx) => (
                      <div
                        key={person.id || idx}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 20,
                          padding: '18px 12px',
                          border: `1px solid ${theme.border}`,
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{
                          width: 84,
                          height: 84,
                          borderRadius: '50%',
                          border: `2.5px solid ${theme.accent}`,
                          overflow: 'hidden',
                          marginBottom: 10,
                          boxShadow: `0 4px 14px ${theme.accent}30`
                        }}>
                          <img src={person.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                            alt={person.fullName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                           loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                        </div>
                        {person.role && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: theme.accent,
                            background: `${theme.accent}18`,
                            padding: '2px 8px',
                            borderRadius: 20,
                            marginBottom: 6,
                            display: 'inline-block',
                            letterSpacing: '0.04em'
                          }}>
                            {person.role}
                          </span>
                        )}
                        <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: theme.text, lineHeight: 1.3 }}>
                          {person.fullName || person.nickname}
                        </h4>
                        {person.parents && (
                          <p style={{ margin: '0 0 6px', fontSize: 11, color: theme.subText, lineHeight: 1.4 }}>
                            {person.parents}
                          </p>
                        )}
                        {person.instagram && (
                          <a
                            href={`https://instagram.com/${person.instagram.replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 11,
                              color: theme.accent,
                              textDecoration: 'none',
                              fontWeight: 700
                            }}
                          >
                            @{person.instagram.replace(/^@/, '')}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollRevealSection>
          </VisualBlockWrapper>
        )}

          {/* Love Story Timeline */}
          {widgets.story !== false && data.loveStories && data.loveStories.length > 0 && (
            <VisualBlockWrapper
              blockId="story"
              blockLabel="Cerita Kisah Cinta"
              icon="📖"
              isSelected={selectedBlockId === 'story'}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.('story')}
              onDelete={() => onDeleteBlock?.('story')}
              onInsertBelow={() => onOpenAddWidget?.('story')}
            >
              <ScrollRevealSection delay={0.1}>
              <div id="story" style={{
                background: theme.card,
                borderRadius: 32,
                padding: '30px 22px',
                border: `1px solid ${theme.border}`,
                marginBottom: 20
              }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: theme.accent, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <Heart size={14} /> Kisah Cinta Kami
                  </div>
                  <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 900, color: theme.text }}>
                    Our Love Journey
                  </h3>
                </div>

                <div style={{ position: 'relative', paddingLeft: 20, borderLeft: `2px dashed ${theme.border}` }}>
                  {data.loveStories.map((story, idx) => (
                    <div key={story.id || idx} style={{ marginBottom: 22, position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: -29,
                        top: 4,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: theme.accent,
                        border: `3px solid ${theme.card}`
                      }} />
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: theme.accent,
                        background: `${theme.accent}18`,
                        padding: '2px 8px',
                        borderRadius: 99,
                        display: 'inline-block',
                        marginBottom: 4
                      }}>
                        {story.yearOrPhase}
                      </span>
                      <h4 style={{ margin: '4px 0 6px', fontSize: 14, fontWeight: 800, color: theme.text }}>
                        {story.title}
                      </h4>
                      <p style={{ margin: '0 0 10px', fontSize: 11.5, color: theme.subText, lineHeight: 1.5 }}>
                        {story.story}
                      </p>
                      {story.photo && (
                        <div style={{ borderRadius: 16, overflow: 'hidden', maxHeight: 180, border: `1px solid ${theme.border}` }}>
                          <img src={story.photo} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}  loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollRevealSection>
          </VisualBlockWrapper>
        )}

          {/* Acara (Akad & Resepsi / Sesi Acara) */}
          {widgets.acara !== false && (
            <VisualBlockWrapper
              blockId="acara"
              blockLabel="Rangkaian Acara"
              icon="📅"
              isSelected={selectedBlockId === 'acara'}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.('acara')}
              onDelete={() => onDeleteBlock?.('acara')}
              onInsertBelow={() => onOpenAddWidget?.('acara')}
            >
              <ScrollRevealSection delay={0.1}>
              <div id="acara" style={{
                background: theme.card,
                borderRadius: 32,
                padding: '30px 22px',
                border: `1px solid ${theme.border}`,
                marginBottom: 20
              }}>
                <h3 style={{ margin: '0 0 20px', textAlign: 'center', fontSize: 16, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.accent }}>
                  {data.sessionsLabel || (data.eventType === 'wedding' ? 'Rangkaian Acara' : 'Jadwal & Agenda Acara')}
                </h3>

                {/* Akad Box */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 20,
                  padding: '18px 20px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: 16
                }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    {data.akad.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: theme.text, marginBottom: 4 }}>
                    <Clock size={14} color={theme.accent} /> {data.akad.time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: theme.text, marginBottom: 4 }}>
                    <MapPin size={14} color={theme.accent} /> {data.akad.venue}
                  </div>
                  <p style={{ margin: '6px 0 12px', fontSize: 11, color: theme.subText }}>
                    {data.akad.address}
                  </p>
                  <a
                    href={data.akad.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 99,
                      background: `${theme.accent}20`,
                      color: theme.accent,
                      fontSize: 11,
                      fontWeight: 800,
                      textDecoration: 'none'
                    }}
                  >
                    <MapPin size={12} /> Buka Google Maps
                  </a>
                </div>

                {/* Resepsi Box */}
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 20,
                  padding: '18px 20px',
                  border: `1px solid ${theme.border}`,
                  marginBottom: 16
                }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: theme.accent, display: 'block', marginBottom: 6 }}>
                    {data.reception.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: theme.text, marginBottom: 4 }}>
                    <Clock size={14} color={theme.accent} /> {data.reception.time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: theme.text, marginBottom: 4 }}>
                    <MapPin size={14} color={theme.accent} /> {data.reception.venue}
                  </div>
                  <p style={{ margin: '6px 0 12px', fontSize: 11, color: theme.subText }}>
                    {data.reception.address}
                  </p>
                  <a
                    href={data.reception.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 99,
                      background: `${theme.accent}20`,
                      color: theme.accent,
                      fontSize: 11,
                      fontWeight: 800,
                      textDecoration: 'none'
                    }}
                  >
                    <MapPin size={12} /> Buka Google Maps
                  </a>
                </div>

                {/* Calendar Integration Section */}
                <div style={{
                  background: `${theme.accent}15`,
                  borderRadius: 20,
                  padding: '16px',
                  border: `1px dashed ${theme.accent}55`,
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: theme.text, display: 'block', marginBottom: 6 }}>
                    Ingatkan Saya di Kalender
                  </span>
                  <p style={{ margin: '0 0 12px', fontSize: 11, color: theme.subText }}>
                    Simpan tanggal acara ini agar Anda tidak melewatkan momen spesial kami.
                  </p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => window.open(generateGoogleCalendarUrl(data), '_blank')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 99,
                        background: theme.accent,
                        color: '#fff',
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <CalendarPlus size={13} /> Google Calendar
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(data)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 99,
                        background: 'rgba(255,255,255,0.08)',
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Download size={13} /> Unduh .ICS (Apple/Outlook)
                    </button>
                  </div>
                </div>

              </div>
            </ScrollRevealSection>
          </VisualBlockWrapper>
        )}

          {/* Video Teaser Widget */}
          {widgets.video !== false && data.videoUrl && (
            <VisualBlockWrapper
              blockId="video"
              blockLabel="Video Acara / Teaser"
              icon="🎬"
              isSelected={selectedBlockId === 'video'}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.('video')}
              onDelete={() => onDeleteBlock?.('video')}
              onInsertBelow={() => onOpenAddWidget?.('video')}
            >
              <ScrollRevealSection delay={0.1}>
              <div id="video" style={{
                background: theme.card,
                borderRadius: 32,
                padding: '28px 22px',
                border: `1px solid ${theme.border}`,
                marginBottom: 20,
                textAlign: 'center'
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: theme.accent, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  <Film size={14} /> Video Teaser Prewedding
                </div>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: theme.text }}>
                  Our Cinematic Story
                </h3>

                <div style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  height: 0,
                  overflow: 'hidden',
                  borderRadius: 20,
                  border: `1px solid ${theme.border}`,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
                }}>
                  <iframe
                    src={getYoutubeEmbedUrl(data.videoUrl)}
                    title="Wedding Teaser"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </ScrollRevealSection>
          </VisualBlockWrapper>
        )}

          {/* Galeri Foto Widget */}
          {widgets.gallery !== false && (
            <VisualBlockWrapper
              blockId="galeri"
              blockLabel="Galeri Foto"
              icon="🖼️"
              isSelected={selectedBlockId === 'galeri'}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.('galeri')}
              onDelete={() => onDeleteBlock?.('galeri')}
              onInsertBelow={() => onOpenAddWidget?.('galeri')}
            >
              <ScrollRevealSection delay={0.1}>
              <div id="galeri" style={{
                background: theme.card,
                borderRadius: 32,
                padding: '28px 22px',
                border: `1px solid ${theme.border}`,
                marginBottom: 20,
                textAlign: 'center'
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: theme.accent, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  <ImageIcon size={14} /> Galeri Foto
                </div>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: theme.text }}>
                  Dokumentasi Momen Bahagia
                </h3>

                {/* Category Filter Tabs */}
                {galleryCategories.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                    {['Semua', ...galleryCategories].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveGalleryCategory(cat)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 99,
                          background: activeGalleryCategory === cat ? theme.accent : 'rgba(255,255,255,0.06)',
                          color: activeGalleryCategory === cat ? '#fff' : theme.subText,
                          border: `1px solid ${activeGalleryCategory === cat ? theme.accent : theme.border}`,
                          fontSize: 11,
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Photo Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10
                }}>
                  {filteredGallery.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        const actualIdx = galleryList.findIndex(g => g.url === item.url);
                        setLightboxIndex(actualIdx >= 0 ? actualIdx : idx);
                      }}
                      style={{
                        borderRadius: 16,
                        overflow: 'hidden',
                        aspectRatio: idx % 3 === 0 ? '4/5' : '1/1',
                        border: `1px solid ${theme.border}`,
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <img src={item.url}
                        alt={item.title || `Foto ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                       loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                      {item.category && (
                        <span style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: 9.5,
                          fontWeight: 800,
                          backdropFilter: 'blur(4px)'
                        }}>
                          {item.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollRevealSection>
          </VisualBlockWrapper>
        )}

          {/* Amplop Digital (Wedding Gift) */}
          {widgets.hadiah !== false && (
            <VisualBlockWrapper
              blockId="hadiah"
              blockLabel="Kado Digital & Rekening"
              icon="🎁"
              isSelected={selectedBlockId === 'hadiah'}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.('hadiah')}
              onDelete={() => onDeleteBlock?.('hadiah')}
              onInsertBelow={() => onOpenAddWidget?.('hadiah')}
            >
              <ScrollRevealSection delay={0.1}>
              <div id="hadiah" style={{
                background: theme.card,
                borderRadius: 32,
                padding: '30px 22px',
                border: `1px solid ${theme.border}`,
                marginBottom: 20,
                textAlign: 'center'
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${theme.accent}20`, color: theme.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Gift size={22} />
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: theme.text }}>
                  Amplop Digital & Kado
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: 11.5, color: theme.subText }}>
                  Doa restu Anda merupakan hadiah terindah bagi kami. Namun jika Anda ingin memberi hadiah tanda kasih, Anda dapat mengirimkannya melalui:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.bankAccounts.map((b, idx) => {
                    const isCopied = copiedAccount === b.accountNumber;
                    return (
                      <div key={idx} style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '16px 18px',
                        borderRadius: 20,
                        border: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: theme.accent, display: 'block' }}>
                            {b.bank}
                          </span>
                          <strong style={{ fontSize: 15, color: theme.text, letterSpacing: '0.04em' }}>
                            {b.accountNumber}
                          </strong>
                          <div style={{ fontSize: 10.5, color: theme.subText }}>
                            a.n {b.accountName}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(b.accountNumber)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 12,
                            background: isCopied ? '#10b981' : theme.accent,
                            color: '#fff',
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          {isCopied ? 'Tersalin' : 'Salin'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollRevealSection>
          </VisualBlockWrapper>
        )}

          {/* Custom Modular Blocks */}
          {(data.customBlocks || []).map((block, idx) => (
            <VisualBlockWrapper
              key={block.id || `custom-${idx}`}
              blockId={block.id}
              blockLabel={block.title || 'Widget Kustom'}
              icon={block.icon || '✨'}
              isSelected={selectedBlockId === block.id}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.(block.id)}
              onDelete={() => onDeleteBlock?.(block.id)}
              onMoveUp={idx > 0 ? () => onMoveBlock?.(block.id, 'up') : undefined}
              onMoveDown={idx < (data.customBlocks?.length || 0) - 1 ? () => onMoveBlock?.(block.id, 'down') : undefined}
              onInsertBelow={() => onOpenAddWidget?.(block.id)}
            >
              <ScrollRevealSection animationStyle={data.animationStyle} delay={0.08}>
                {renderCustomBlock(block, theme)}
              </ScrollRevealSection>
            </VisualBlockWrapper>
          ))}

          {/* Form Konfirmasi Kehadiran & Doa (RSVP) */}
          {widgets.ucapan !== false && (
            <VisualBlockWrapper
              blockId="ucapan"
              blockLabel="Buku Tamu & RSVP"
              icon="💌"
              isSelected={selectedBlockId === 'ucapan'}
              isVisualEditMode={isVisualEditMode}
              onSelect={() => onSelectBlock?.('ucapan')}
              onDelete={() => onDeleteBlock?.('ucapan')}
              onInsertBelow={() => onOpenAddWidget?.('ucapan')}
            >
              <ScrollRevealSection delay={0.1}>
              <div id="ucapan" style={{
                background: theme.card,
                borderRadius: 32,
                padding: '30px 22px',
                border: `1px solid ${theme.border}`,
                marginBottom: 20
              }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, textAlign: 'center', color: theme.text }}>
                  Buku Tamu & Ucapan Doa
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: 11.5, textAlign: 'center', color: theme.subText }}>
                  Mohon konfirmasi kehadiran serta kirimkan doa restu untuk kedua mempelai.
                </p>

                <form onSubmit={handleSubmitRsvp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="invite-label" style={{ color: theme.subText }}>Nama Lengkap</label>
                    <input
                      className="invite-input"
                      value={rsvpName}
                      onChange={e => setRsvpName(e.target.value)}
                      placeholder="Nama Anda..."
                      required
                    />
                  </div>

                  <div>
                    <label className="invite-label" style={{ color: theme.subText }}>Konfirmasi Kehadiran</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[
                        { id: 'hadir', label: 'Pasti Hadir' },
                        { id: 'ragu', label: 'Masih Ragu' },
                        { id: 'tidak_hadir', label: 'Tidak Hadir' }
                      ].map(att => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => setRsvpAttendance(att.id as any)}
                          style={{
                            padding: '10px 6px',
                            borderRadius: 12,
                            border: rsvpAttendance === att.id ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                            background: rsvpAttendance === att.id ? `${theme.accent}25` : 'rgba(0,0,0,0.2)',
                            color: rsvpAttendance === att.id ? theme.text : theme.subText,
                            fontSize: 11,
                            fontWeight: 750,
                            cursor: 'pointer'
                          }}
                        >
                          {att.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {rsvpAttendance === 'hadir' && (
                    <div>
                      <label className="invite-label" style={{ color: theme.subText }}>Jumlah Tamu Hadir</label>
                      <select
                        className="invite-input"
                        value={rsvpCount}
                        onChange={e => setRsvpCount(Number(e.target.value))}
                      >
                        <option value={1}>1 Orang</option>
                        <option value={2}>2 Orang</option>
                        <option value={3}>3 Orang</option>
                        <option value={4}>4 Orang</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="invite-label" style={{ color: theme.subText }}>Ucapan & Doa Restu</label>
                    <textarea
                      className="invite-input"
                      style={{ minHeight: 80, resize: 'vertical' }}
                      value={rsvpMessage}
                      onChange={e => setRsvpMessage(e.target.value)}
                      placeholder="Tuliskan ucapan dan doa tulus Anda..."
                      required
                    />
                  </div>

                  {rsvpSuccess && (
                    <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} /> Ucapan dan konfirmasi kehadiran Anda berhasil dikirim!
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{
                      padding: '12px 20px',
                      borderRadius: 99,
                      background: theme.accent,
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: 6
                    }}
                  >
                    <Send size={14} /> Kirim Ucapan RSVP
                  </button>
                </form>

                {/* List Ucapan Tamu Lain */}
                <div style={{ marginTop: 24, borderTop: `1px solid ${theme.border}`, paddingTop: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: theme.subText, display: 'block', marginBottom: 12 }}>
                    Ucapan Terkirim ({data.rsvps.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
                    {data.rsvps.map(r => (
                      <div key={r.id} style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 14px', borderRadius: 16, border: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ fontSize: 12, color: theme.text }}>{r.name}</strong>
                          <span style={{ fontSize: 9.5, color: theme.subText }}>{r.createdAt}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11.5, color: theme.subText, lineHeight: 1.5 }}>
                          "{r.message}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </ScrollRevealSection>
          </VisualBlockWrapper>
        )}

          {/* Bottom Add Widget Button in Visual Edit Mode */}
          {isVisualEditMode && (
            <div style={{ textAlign: 'center', margin: '24px 0 16px' }}>
              <button
                type="button"
                onClick={() => onOpenAddWidget?.()}
                style={{
                  padding: '12px 24px',
                  borderRadius: 99,
                  background: 'linear-gradient(135deg, #ec4899, #db2777)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 6px 20px rgba(236,72,153,0.4)',
                  transition: 'all 0.2s'
                }}
              >
                <Plus size={16} /> Tambah Widget Baru
              </button>
            </div>
          )}

          {/* Footer Note */}
          <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: theme.subText }}>
            Dibuat dengan cinta menggunakan <strong style={{ color: theme.accent }}>sumr.day Invitation Studio</strong>
          </div>

          {/* â”€â”€ FLOATING BOTTOM NAVBAR (VERTICAL SCROLL) â€” sticky inside scroll container â”€â”€ */}
          {data.bottomNavbarEnabled !== false && widgets.navbar !== false && (
            <div style={
              data.navbarStyle === 'solid_dock' ? {
                position: 'sticky',
                bottom: 0,
                zIndex: 90,
                background: '#090a10',
                borderTop: `1px solid ${theme.border}`,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                flexShrink: 0
              } : data.navbarStyle === 'pill_minimal' ? {
                position: 'sticky',
                bottom: 10,
                zIndex: 90,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 0',
                flexShrink: 0
              } : {
                // Default: floating_glass
                position: 'sticky',
                bottom: 10,
                zIndex: 90,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 0',
                flexShrink: 0
              }
            }>
              <div style={
                data.navbarStyle === 'solid_dock' ? {
                  display: 'flex', alignItems: 'center', gap: 6
                } : data.navbarStyle === 'pill_minimal' ? {
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(10, 10, 14, 0.92)',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 99,
                  padding: '4px 8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                } : {
                  // floating_glass
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(15, 15, 20, 0.88)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1.5px solid ${theme.border}`,
                  borderRadius: 99,
                  padding: '6px 12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                  maxWidth: '92%'
                }
              }>
              {widgets.mempelai !== false && (
                <a
                  href="#mempelai"
                  title="Mempelai"
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    color: theme.subText,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Heart size={16} color={theme.accent} />
                </a>
              )}
              {widgets.acara !== false && (
                <a
                  href="#acara"
                  title="Acara"
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    color: theme.subText,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Calendar size={16} color={theme.accent} />
                </a>
              )}
              {widgets.gallery !== false && (
                <a
                  href="#galeri"
                  title="Galeri"
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    color: theme.subText,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ImageIcon size={16} color={theme.accent} />
                </a>
              )}
              {widgets.hadiah !== false && (
                <a
                  href="#hadiah"
                  title="Kado & Hadiah"
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    color: theme.subText,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Gift size={16} color={theme.accent} />
                </a>
              )}
              {widgets.ucapan !== false && (
                <a
                  href="#ucapan"
                  title="Buku Tamu & Ucapan"
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    color: theme.subText,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={16} color={theme.accent} />
                </a>
              )}
              {/* QR Icon-only button â€” hidden when hideQrPass */}
              {!data.hideQrPass && (
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  title="Tiket QR Pass"
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    background: 'transparent',
                    color: theme.accent,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <QrCode size={16} color={theme.accent} />
                </button>
              )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* â”€â”€ 3. MODAL GUEST PASS & QR CODE CHECK-IN â”€â”€ */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
            borderRadius: 28,
            maxWidth: 380,
            width: '100%',
            padding: '24px 20px',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
            animation: 'inviteFadeIn 0.3s ease'
          }}>
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: theme.subText,
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${theme.accent}20`, color: theme.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ticket size={22} />
            </div>

            <div style={{ fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: theme.accent, fontWeight: 900 }}>
              OFFICIAL GUEST PASS
            </div>
            <h3 style={{ margin: '4px 0 12px', fontSize: 18, fontWeight: 900, color: theme.text }}>
              {guestName}
            </h3>

            {/* QR Card Graphic */}
            <div style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 20,
              display: 'inline-block',
              margin: '0 auto 14px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
            }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(matchedGuest.qrSecretCode)}`}
                alt="QR Code Tiket"
                style={{ width: 170, height: 170, display: 'block' }}
               loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, color: theme.accent, letterSpacing: '0.05em' }}>
              {matchedGuest.qrSecretCode}
            </div>

            <div style={{
              marginTop: 12,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 14,
              padding: '10px 14px',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'space-around',
              fontSize: 11
            }}>
              <div>
                <span style={{ color: theme.subText, display: 'block', fontSize: 10 }}>Kategori</span>
                <strong style={{ color: theme.text }}>{matchedGuest.category || 'Tamu VIP'}</strong>
              </div>
              <div>
                <span style={{ color: theme.subText, display: 'block', fontSize: 10 }}>Kuota Hadir</span>
                <strong style={{ color: theme.text }}>{matchedGuest.paxQuota || 2} Orang</strong>
              </div>
              <div>
                <span style={{ color: theme.subText, display: 'block', fontSize: 10 }}>Status</span>
                <strong style={{ color: matchedGuest.hasCheckedIn ? '#10b981' : '#eab308' }}>
                  {matchedGuest.hasCheckedIn ? 'âœ“ Hadir' : 'Menunggu'}
                </strong>
              </div>
            </div>

            <p style={{ margin: '14px 0 0', fontSize: 10.5, color: theme.subText, lineHeight: 1.4 }}>
              Tunjukkan QR Code ini kepada panitia penerima tamu pada Hari-H saat tiba di lokasi acara.
            </p>
          </div>
        </div>
      )}

      {/* â”€â”€ 4. LIGHTBOX MODAL PREVIEW FOTO DENGAN DETAIL & NAVIGASI â”€â”€ */}
      {lightboxIndex !== null && galleryList[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(0,0,0,0.94)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={20} />
          </button>

          {/* Prev Button */}
          {galleryList.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : galleryList.length - 1));
              }}
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image & details */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 720,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}
          >
            <img src={galleryList[lightboxIndex].url}
              alt={galleryList[lightboxIndex].title || 'Foto Galeri'}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 16,
                objectFit: 'contain',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
              }}
             loading="lazy" decoding="async" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                {galleryList[lightboxIndex].title || `Foto ${lightboxIndex + 1}`}
              </div>
              {galleryList[lightboxIndex].caption && (
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#cbd5e1', maxWidth: 440 }}>
                  {galleryList[lightboxIndex].caption}
                </p>
              )}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {lightboxIndex + 1} dari {galleryList.length}
              </div>
            </div>
          </div>

          {/* Next Button */}
          {galleryList.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(prev => (prev !== null && prev < galleryList.length - 1 ? prev + 1 : 0));
              }}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      )}

    </div>
  );
}
