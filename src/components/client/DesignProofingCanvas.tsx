import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, X, Trash2, Send, PenTool,
  ZoomIn, ZoomOut, MessageSquare, ChevronLeft, ChevronRight,
  Copy, Check, Layers, Box
} from 'lucide-react';
import ProtectedPreviewImage from '../common/ProtectedPreviewImage';
import Model3DViewer from '../common/Model3DViewer';
import { storage } from '../../utils/storage';
import { syncProofingApprovalToLifecycle } from '../../utils/studioLifecycleBridge';
import { openSmartWhatsApp } from '../../utils/smartWhatsAppRouter';
import { requestScreenWakeLock, releaseScreenWakeLock } from '../../utils/browserPowerHacks';

export interface RevisionPin {
  id: string;
  xPercent: number;
  yPercent: number;
  comment: string;
  createdAt: string;
  slideIndex?: number;
}

export interface DesignProofingCanvasProps {
  orderId: string;
  projectName: string;
  previewUrl: string;
  images?: string[];
  initialSlideIndex?: number;
  clientName: string;
  isPaid: boolean;
  onClose?: () => void;
  onRevisionSubmitted?: (pins: RevisionPin[]) => void;
  onDesignApproved?: (approvalData: { signerName: string; signatureUrl: string; approvedAt: string }) => void;
}

export const DesignProofingCanvas: React.FC<DesignProofingCanvasProps> = ({
  orderId,
  projectName,
  previewUrl,
  images,
  initialSlideIndex = 0,
  clientName,
  isPaid,
  onClose,
  onRevisionSubmitted,
  onDesignApproved
}) => {
  // Normalize multi-slide images
  const slideImages = useMemo(() => {
    if (Array.isArray(images) && images.length > 0) return images;
    if (previewUrl) return [previewUrl];
    return ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85'];
  }, [images, previewUrl]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(() => {
    if (typeof initialSlideIndex === 'number' && initialSlideIndex >= 0) {
      return Math.min(initialSlideIndex, Math.max(0, (images?.length || 1) - 1));
    }
    return 0;
  });

  // Keep URL updated with active slide index
  useEffect(() => {
    if (slideImages.length > 1) {
      const url = new URL(window.location.href);
      url.searchParams.set('file', String(activeSlideIndex + 1));
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeSlideIndex, slideImages.length]);
  const [pins, setPins] = useState<RevisionPin[]>([]);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [signerName, setSignerName] = useState(clientName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [studioPhone, setStudioPhone] = useState('6281234567890');
  const [approvalDoneData, setApprovalDoneData] = useState<{ signerName: string; approvedAt: string } | null>(null);

  // Signature Pad Refs & State
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Keep screen awake while client is proofing artwork
  useEffect(() => {
    requestScreenWakeLock();
    return () => {
      releaseScreenWakeLock();
    };
  }, []);

  // Load existing pins from storage
  useEffect(() => {
    const storageKey = `sumr_proofing_pins_${orderId}`;
    storage.getItem<RevisionPin[]>(storageKey, []).then(saved => {
      if (saved && Array.isArray(saved)) {
        setPins(saved);
      }
    }).catch(() => {});

    storage.getItem<any>('porto_business_profile').then(prof => {
      if (prof?.whatsapp) setStudioPhone(prof.whatsapp);
      else if (prof?.phone) setStudioPhone(prof.phone);
    }).catch(() => {});
  }, [orderId]);

  // Current Slide image & active pins
  const currentImage = slideImages[activeSlideIndex] || slideImages[0];
  const is3DModel = Boolean(
    currentImage && (
      currentImage.toLowerCase().endsWith('.glb') || 
      currentImage.toLowerCase().endsWith('.gltf') || 
      currentImage.includes('/raw/upload/')
    )
  );
  const activeSlidePins = useMemo(() => {
    return pins.filter(p => (p.slideIndex ?? 0) === activeSlideIndex);
  }, [pins, activeSlideIndex]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPin) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = Math.max(2, Math.min(98, Math.round((x / rect.width) * 100)));
    const yPercent = Math.max(2, Math.min(98, Math.round((y / rect.height) * 100)));

    const newPin: RevisionPin = {
      id: `pin_${Date.now()}`,
      xPercent,
      yPercent,
      comment: '',
      createdAt: new Date().toISOString(),
      slideIndex: activeSlideIndex
    };

    setPins(prev => [...prev, newPin]);
    setActivePinId(newPin.id);
    setNewComment('');
    setIsAddingPin(false);
    setIsSidebarOpen(true);
  };

  const handleSavePinComment = (pinId: string) => {
    if (!newComment.trim()) return;
    setPins(prev => prev.map(p => p.id === pinId ? { ...p, comment: newComment.trim() } : p));
    setActivePinId(null);
    setNewComment('');
  };

  const handleDeletePin = (pinId: string) => {
    setPins(prev => prev.filter(p => p.id !== pinId));
    if (activePinId === pinId) {
      setActivePinId(null);
      setNewComment('');
    }
  };

  const handleSubmitAllRevisions = async () => {
    if (pins.length === 0) {
      alert('Tambahkan minimal 1 pin revisi sebelum mengirim.');
      return;
    }

    const unfinished = pins.filter(p => !p.comment.trim());
    if (unfinished.length > 0) {
      alert('Ada pin revisi yang belum memiliki teks catatan.');
      return;
    }

    setIsSubmitting(true);
    const storageKey = `sumr_proofing_pins_${orderId}`;
    await storage.setItem(storageKey, pins);

    const existingRevs = (await storage.getItem<any[]>('sumr_client_revisions', [])) || [];
    const newRevTicket = {
      id: `REV-${Date.now().toString().slice(-6)}`,
      orderId,
      projectName,
      clientName,
      createdAt: new Date().toISOString(),
      status: 'Menunggu Review',
      description: `Revisi Kanvas (${pins.length} titik): \n` + 
        pins.map((p, idx) => `[Titik #${idx + 1}] (Slide ${ (p.slideIndex ?? 0) + 1 }): ${p.comment}`).join('\n'),
      pins,
      screenshotUrl: currentImage
    };

    await storage.setItem('sumr_client_revisions', [newRevTicket, ...existingRevs]);

    setIsSubmitting(false);
    setToastMessage(`Catatan revisi tersimpan! Kirim via WA untuk konfirmasi.`);
    if (onRevisionSubmitted) {
      onRevisionSubmitted(pins);
    }
  };

  const handleSendRevisionsToWhatsApp = (revisionsToSend: RevisionPin[]) => {
    const pinDetails = revisionsToSend.map((p, idx) => `• Titik #${idx + 1} (Slide ${(p.slideIndex ?? 0) + 1}): ${p.comment}`).join('\n');
    const message = `Halo sumr.day, saya ${clientName || 'Klien'} mengirim catatan revisi untuk proyek *${projectName}* (#${orderId}).\n\n📌 *Daftar Titik Revisi (${revisionsToSend.length}):*\n${pinDetails}\n\nMohon dicek ya, terima kasih!`;
    openSmartWhatsApp(studioPhone, {
      type: 'general',
      customMessage: message,
      clientName,
      title: projectName
    }, 'proofing_revision');
  };

  const handleSendApprovalToWhatsApp = (signer: string) => {
    const message = `Halo sumr.day, saya *${signer}* mengonfirmasi desain proyek *${projectName}* (#${orderId}) telah resmi saya *ACC / Disetujui*.\n\nSilakan diproses untuk tahap penyerahan file akhir. Terima kasih!`;
    openSmartWhatsApp(studioPhone, {
      type: 'general',
      customMessage: message,
      clientName: signer,
      title: projectName
    }, 'proofing_approval');
  };

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    if (slideImages.length > 1) {
      url.searchParams.set('file', String(activeSlideIndex + 1));
    }
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setToastMessage(slideImages.length > 1 ? `Tautan File #${activeSlideIndex + 1} tersalin!` : 'Tautan unik tersalin!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Signature canvas
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return { x: 0, y: 0, scale: 1 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY, scale: scaleX };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y, scale } = getCanvasPoint(e);
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirmApproval = async () => {
    if (!hasSignature || !sigCanvasRef.current) {
      alert('Bubuhkan tanda tangan pada kotak tanda tangan.');
      return;
    }
    if (!signerName.trim()) {
      alert('Isi nama lengkap penandatangan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const signatureDataUrl = sigCanvasRef.current.toDataURL('image/png');
      const nowIso = new Date().toISOString();

      await syncProofingApprovalToLifecycle(orderId, {
        signerName: signerName.trim(),
        signatureUrl: signatureDataUrl,
        approvedAt: nowIso
      });

      setApprovalDoneData({ signerName: signerName.trim(), approvedAt: nowIso });
      setShowApprovalModal(false);
      setToastMessage(`Desain disetujui (ACC)!`);

      if (onDesignApproved) {
        onDesignApproved({
          signerName: signerName.trim(),
          signatureUrl: signatureDataUrl,
          approvedAt: nowIso
        });
      }
    } catch (err: any) {
      alert('Gagal menyimpan persetujuan: ' + (err?.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#090a11',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: 9999,
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      {/* ── 1. STUDIO TOP BAR (48px) ── */}
      <header style={{
        height: 48,
        minHeight: 48,
        maxHeight: 48,
        background: '#0e1019',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        gap: 12,
        zIndex: 50
      }}>
        {/* Left: Project Brand & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0
          }}>
            <span style={{ color: '#38bdf8' }}>sumr</span><span style={{ opacity: 0.6 }}>studio</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#e2e8f0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 220
          }} title={projectName}>
            {projectName}
          </div>
          <span style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 6,
            background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: isPaid ? '#34d399' : '#fbbf24',
            border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            flexShrink: 0
          }}>
            {isPaid ? 'Lunas' : 'Draft'}
          </span>
          {is3DModel && (
            <span style={{
              fontSize: 10.5,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(245,158,11,0.35)'
            }}>
              <Box size={10} /> 3D Model
            </span>
          )}
        </div>

        {/* Center: Slide Switcher (if multi-image) */}
        {slideImages.length > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '2px 8px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={activeSlideIndex === 0}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeSlideIndex === 0 ? '#475569' : '#cbd5e1',
                cursor: activeSlideIndex === 0 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2
              }}
              title="Slide Sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#e2e8f0' }}>
              {activeSlideIndex + 1} / {slideImages.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveSlideIndex(prev => Math.min(slideImages.length - 1, prev + 1))}
              disabled={activeSlideIndex === slideImages.length - 1}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeSlideIndex === slideImages.length - 1 ? '#475569' : '#cbd5e1',
                cursor: activeSlideIndex === slideImages.length - 1 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2
              }}
              title="Slide Berikutnya"
            >
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 6,
                color: '#38bdf8',
                fontSize: 10.5,
                fontWeight: 750,
                padding: '2px 7px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginLeft: 4
              }}
              title={`Salin tautan unik untuk File #${activeSlideIndex + 1}`}
            >
              <Copy size={11} />
              <span>Link File</span>
            </button>
          </div>
        )}

        {/* Right: Actions (1-2 words / icon-only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2 }}>
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.max(1, +(prev - 0.25).toFixed(2)))}
              disabled={zoomScale <= 1}
              title="Zoom Out"
              style={{ background: 'none', border: 'none', color: zoomScale <= 1 ? '#475569' : '#94a3b8', padding: 4, cursor: zoomScale <= 1 ? 'default' : 'pointer' }}
            >
              <ZoomOut size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 10.5, fontWeight: 700, padding: '2px 4px', cursor: 'pointer' }}
              title="Reset Zoom"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(prev => Math.min(2.5, +(prev + 0.25).toFixed(2)))}
              disabled={zoomScale >= 2.5}
              title="Zoom In"
              style={{ background: 'none', border: 'none', color: zoomScale >= 2.5 ? '#475569' : '#94a3b8', padding: 4, cursor: zoomScale >= 2.5 ? 'default' : 'pointer' }}
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Toggle Pin Mode Button */}
          <button
            type="button"
            onClick={() => setIsAddingPin(!isAddingPin)}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 6,
              border: isAddingPin ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
              background: isAddingPin ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isAddingPin ? '#38bdf8' : '#e2e8f0',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease'
            }}
            title="Klik untuk menyematkan titik catatan revisi pada visual"
          >
            <PenTool size={13} />
            <span>Pin</span>
          </button>

          {/* ACC Design Button */}
          <button
            type="button"
            onClick={() => setShowApprovalModal(true)}
            style={{
              height: 32,
              padding: '0 12px',
              borderRadius: 6,
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
            title="ACC dan sahkan persetujuan desain resmi"
          >
            <CheckCircle2 size={13} />
            <span>ACC</span>
          </button>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            style={{
              height: 32,
              padding: '0 8px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: copiedLink ? '#34d399' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Salin Tautan Proofing Klien"
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
          </button>

          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={() => {
              if (approvalDoneData) {
                handleSendApprovalToWhatsApp(approvalDoneData.signerName);
              } else if (pins.length > 0) {
                handleSendRevisionsToWhatsApp(pins);
              } else {
                const message = `Halo sumr.day, saya ingin meninjau proyek *${projectName}* (#${orderId}).`;
                openSmartWhatsApp(studioPhone, {
                  type: 'general',
                  customMessage: message,
                  clientName,
                  title: projectName
                }, 'proofing_chat');
              }
            }}
            style={{
              height: 32,
              padding: '0 8px',
              borderRadius: 6,
              border: 'none',
              background: '#25D366',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Kirim pesan langsung ke WhatsApp Studio"
          >
            <MessageSquare size={14} />
          </button>

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              height: 32,
              padding: '0 8px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: isSidebarOpen ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isSidebarOpen ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700
            }}
            title="Buka / Tutup Panel Catatan"
          >
            <Layers size={13} />
            <span>{pins.length}</span>
          </button>

          {/* Close Canvas */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 32,
                width: 32,
                borderRadius: 6,
                border: 'none',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Tutup"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Toast Notification Pill */}
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#f8fafc',
          padding: '8px 16px',
          borderRadius: 100,
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          fontSize: 12,
          fontWeight: 700,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none'
        }}>
          <CheckCircle2 size={14} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 2. STUDIO WORKSPACE BODY ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* CENTER VIEWPORT (IMAGE AREA) */}
        <div style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative',
          background: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px) 0 0 / 24px 24px, #080911'
        }}>
          {/* Instructions banner when adding pin */}
          {isAddingPin && (
            <div style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              background: 'rgba(56, 189, 248, 0.95)',
              color: '#090a11',
              padding: '6px 14px',
              borderRadius: 100,
              fontSize: 11.5,
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              pointerEvents: 'none'
            }}>
              🎯 Klik pada visual untuk menyematkan catatan
            </div>
          )}

          {/* Image Display Area (Anti-Crop, Fully Contained) */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            minHeight: 0,
            overflow: 'auto',
            boxSizing: 'border-box'
          }}>
            <div
              onClick={handleImageClick}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '100%',
                maxHeight: '100%',
                cursor: isAddingPin ? 'crosshair' : 'default',
                transform: `scale(${zoomScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.18s ease',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                borderRadius: 8,
                overflow: 'hidden',
                border: isAddingPin ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)'
              }}
            >
              {/* 3D Model or Protected Image With Anti-Inspect & Soft Burn-in */}
              {is3DModel ? (
                <div style={{ width: '85vw', maxWidth: 960, height: '65vh', position: 'relative' }}>
                  <Model3DViewer
                    src={currentImage}
                    title={projectName}
                    height="100%"
                    allowLocalUpload={false}
                  />
                </div>
              ) : (
                <ProtectedPreviewImage
                  src={currentImage}
                  alt={projectName}
                  isPaid={isPaid}
                  clientName={clientName}
                  showControls={false}
                  enableBurnIn={true}
                />
              )}

              {/* Revision Pins Layer */}
              {activeSlidePins.map((pin, idx) => {
                const isActive = activePinId === pin.id;
                return (
                  <div
                    key={pin.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePinId(pin.id);
                      setNewComment(pin.comment);
                      setIsSidebarOpen(true);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${pin.xPercent}%`,
                      top: `${pin.yPercent}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: isActive ? '#ef4444' : '#38bdf8',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 900,
                      boxShadow: isActive ? '0 0 14px #ef4444' : '0 2px 8px rgba(0,0,0,0.7)',
                      cursor: 'pointer',
                      zIndex: 20,
                      border: '2px solid #ffffff',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Catatan #${idx + 1}: ${pin.comment || 'Belum diisi'}`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 3. BOTTOM CAROUSEL THUMBNAIL STRIP (If > 1 image) ── */}
          {slideImages.length > 1 && (
            <div style={{
              height: 56,
              minHeight: 56,
              background: '#0b0d16',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '0 16px',
              overflowX: 'auto',
              flexShrink: 0
            }}>
              {slideImages.map((imgUrl, idx) => {
                const slidePinsCount = pins.filter(p => (p.slideIndex ?? 0) === idx).length;
                const isCurrent = activeSlideIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    style={{
                      height: 40,
                      width: 40,
                      borderRadius: 6,
                      border: isCurrent ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                      padding: 0,
                      background: '#151824',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      opacity: isCurrent ? 1 : 0.6,
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Slide ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {slidePinsCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                      }}>
                        {slidePinsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 4. RIGHT DOCKED PANEL: REVISION NOTES (300px) ── */}
        {isSidebarOpen && (
          <aside style={{
            width: 300,
            minWidth: 300,
            maxWidth: 300,
            height: '100%',
            background: '#0d0f18',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 40
          }}>
            {/* Panel Header */}
            <div style={{
              height: 44,
              minHeight: 44,
              padding: '0 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#e2e8f0' }}>
                Catatan Revisi ({activeSlidePins.length})
              </div>
              {pins.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Hapus semua pin revisi?')) setPins([]);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <Trash2 size={11} /> Reset
                </button>
              )}
            </div>

            {/* Active Pin Edit Box */}
            {activePinId && (
              <div style={{
                padding: 12,
                background: 'rgba(56, 189, 248, 0.08)',
                borderBottom: '1px solid rgba(56, 189, 248, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#38bdf8' }}>
                    Titik #{pins.findIndex(p => p.id === activePinId) + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeletePin(activePinId)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}
                  >
                    Hapus
                  </button>
                </div>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Ketik catatan perbaikan..."
                  rows={3}
                  autoFocus
                  style={{
                    width: '100%',
                    background: '#090a11',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    padding: 8,
                    color: '#ffffff',
                    fontSize: 12,
                    boxSizing: 'border-box',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setActivePinId(null)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePinComment(activePinId)}
                    style={{
                      background: '#38bdf8',
                      border: 'none',
                      color: '#090a11',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}

            {/* Pins List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              {activeSlidePins.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 12px', color: '#64748b' }}>
                  <PenTool size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>Belum Ada Catatan</div>
                  <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
                    Klik tombol <strong>Pin</strong> di atas untuk menandai bagian visual yang ingin direvisi.
                  </div>
                </div>
              ) : (
                activeSlidePins.map((pin, idx) => (
                  <div
                    key={pin.id}
                    onClick={() => {
                      setActivePinId(pin.id);
                      setNewComment(pin.comment);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: activePinId === pin.id ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)',
                      border: activePinId === pin.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#e2e8f0' }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: 10, color: '#475569' }}>
                        {pin.xPercent}%, {pin.yPercent}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: pin.comment ? '#cbd5e1' : '#f59e0b', lineHeight: 1.35 }}>
                      {pin.comment || 'Belum ada catatan'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Submit Action */}
            {pins.length > 0 && (
              <div style={{
                padding: 12,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#090a11'
              }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitAllRevisions}
                  style={{
                    width: '100%',
                    height: 36,
                    borderRadius: 6,
                    border: 'none',
                    background: '#38bdf8',
                    color: '#090a11',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Send size={13} />
                  <span>Kirim Revisi</span>
                </button>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── 5. ACC APPROVAL MODAL (DIGITAL SIGNATURE) ── */}
      {showApprovalModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            width: '100%',
            maxWidth: 420,
            background: '#0f121d',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>ACC Desain</span>
              </div>
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
              Dengan menandatangani ini, Anda menyatakan desain telah disetujui (ACC).
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                Nama Penandatangan
              </label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Nama Lengkap"
                style={{
                  width: '100%',
                  height: 36,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: '#080911',
                  color: '#fff',
                  fontSize: 12,
                  padding: '0 10px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>Tanda Tangan Digital</span>
                {hasSignature && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 10.5, cursor: 'pointer' }}
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div style={{
                borderRadius: 8,
                border: '1px dashed rgba(255,255,255,0.2)',
                background: '#080911',
                height: 120,
                position: 'relative'
              }}>
                <canvas
                  ref={sigCanvasRef}
                  width={380}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
                />
                {!hasSignature && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 11, pointerEvents: 'none' }}>
                    Tanda tangan di sini
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: '#cbd5e1',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmApproval}
                style={{
                  flex: 1.5,
                  height: 38,
                  borderRadius: 6,
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {isSubmitting ? 'Memproses...' : 'Setujui (ACC)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignProofingCanvas;
