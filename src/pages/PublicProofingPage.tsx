import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, ShieldCheck, Lock, KeyRound, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';
import { DesignProofingCanvas } from '../components/client/DesignProofingCanvas';
import { storage } from '../utils/storage';
import SEOHelmet from '../components/SEOHelmet';

export default function PublicProofingPage() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const projectId = routeParams.id || searchParams.get('id') || searchParams.get('orderId') || '';
  const initialSlideParam = searchParams.get('file') || searchParams.get('slide');
  const initialSlideIndex = initialSlideParam ? Math.max(0, parseInt(initialSlideParam, 10) - 1) : 0;

  const [projectData, setProjectData] = useState<{
    id: string;
    title: string;
    previewUrl: string;
    images: string[];
    clientName: string;
    isPaid: boolean;
    isPasswordProtected?: boolean;
    password?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [studioPhone, setStudioPhone] = useState('6281234567890');

  // Load project data
  useEffect(() => {
    let isMounted = true;
    async function fetchProject() {
      setIsLoading(true);
      try {
        const storedProjects = (await storage.getItem<any[]>('porto_projects', [])) || [];
        const storedOrders = (await storage.getItem<any[]>('sumr_client_orders', [])) || [];

        // Fetch studio contact phone
        storage.getItem<any>('porto_business_profile').then(prof => {
          if (prof?.whatsapp) setStudioPhone(prof.whatsapp);
          else if (prof?.phone) setStudioPhone(prof.phone);
        }).catch(() => {});

        // Search in projects or orders
        let matched = storedProjects.find(p => p.id === projectId || p.title?.toLowerCase() === projectId?.toLowerCase());
        if (!matched) {
          matched = storedOrders.find(o => o.id === projectId || o.orderNumber === projectId);
        }

        // Cloud fallback if visitor has stale local cache
        if (!matched && projectId) {
          const [freshProjects, freshOrders] = await Promise.all([
            storage.getItem<any[]>('porto_projects', [], true),
            storage.getItem<any[]>('sumr_client_orders', [], true)
          ]);
          matched = (freshProjects || []).find(p => p.id === projectId || p.title?.toLowerCase() === projectId?.toLowerCase());
          if (!matched) {
            matched = (freshOrders || []).find(o => o.id === projectId || o.orderNumber === projectId);
          }
        }

        if (matched) {
          // Extract multi-slide preview images
          const images: string[] = [];
          if (Array.isArray(matched.proofingImages) && matched.proofingImages.length > 0) {
            images.push(...matched.proofingImages);
          } else {
            if (matched.coverImage) images.push(matched.coverImage);
            if (matched.previewUrl && !images.includes(matched.previewUrl)) images.push(matched.previewUrl);
            if (Array.isArray(matched.files)) {
              matched.files.forEach((f: any) => {
                if (f?.url && !images.includes(f.url)) images.push(f.url);
              });
            }
          }
          if (images.length === 0) {
            images.push('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85');
          }

          const isPaid = matched.status === 'Selesai' || matched.paymentStatus === 'lunas' || matched.paid === true;
          const isProtected = Boolean(matched.isPasswordProtected && matched.password);

          // Check if session already authorized
          const sessionKey = `sumr_proofing_auth_${matched.id || projectId}`;
          const alreadyAuth = sessionStorage.getItem(sessionKey) === 'true';

          if (isMounted) {
            setProjectData({
              id: matched.id || projectId,
              title: matched.title || matched.projectName || 'Proyek Desain Studio',
              previewUrl: images[0],
              images,
              clientName: matched.client || matched.clientName || 'Klien sumr.day',
              isPaid,
              isPasswordProtected: isProtected,
              password: matched.password
            });

            if (!isProtected || alreadyAuth) {
              setIsUnlocked(true);
            }
          }
        } else {
          // Fallback to high-quality multi-image demo if project ID is not found or empty
          if (isMounted) {
            setProjectData({
              id: projectId || 'DEMO-PROOFING',
              title: 'Visual Identity & Brand System (Demo)',
              previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85',
              images: [
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=85',
                'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1400&q=85',
                'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1400&q=85'
              ],
              clientName: 'Klien Studio',
              isPaid: false,
              isPasswordProtected: false
            });
            setIsUnlocked(true);
          }
        }
      } catch (err) {
        console.error('Error fetching proofing project:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchProject();
    return () => { isMounted = false; };
  }, [projectId]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectData || !projectData.password) return;

    if (inputPin.trim() === projectData.password.trim()) {
      setIsUnlocked(true);
      setPinError(false);
      sessionStorage.setItem(`sumr_proofing_auth_${projectData.id}`, 'true');
    } else {
      setPinError(true);
    }
  };

  const handleAskPasswordWA = () => {
    if (!projectData) return;
    const cleanPhone = studioPhone.replace(/[^0-9]/g, '');
    const message = `Halo Studio, saya ingin meninjau desain *${projectData.title}* (#${projectData.id}), mohon info PIN aksesnya ya. Terima kasih!`;
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#090a11',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: '#94a3b8',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <RefreshCw size={28} className="animate-spin" color="#38bdf8" />
        <span style={{ fontSize: 13, fontWeight: 700 }}>Menyiapkan Kanvas Proofing...</span>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#090a11',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        padding: 20,
        textAlign: 'center'
      }}>
        <ShieldCheck size={48} color="#ef4444" style={{ opacity: 0.8 }} />
        <div style={{ fontSize: 18, fontWeight: 800 }}>Proyek Tidak Ditemukan</div>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', maxWidth: 360 }}>
          Pastikan link atau kode ID proyek yang Anda buka dari WhatsApp valid.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            marginTop: 8,
            padding: '8px 18px',
            borderRadius: 6,
            border: 'none',
            background: '#38bdf8',
            color: '#090a11',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // 🔒 PASSWORD SECURITY GATE SCREEN
  if (projectData.isPasswordProtected && !isUnlocked) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#080a13',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'system-ui, sans-serif',
        color: '#f8fafc'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: '#0f1322',
          border: '1.5px solid rgba(236, 72, 153, 0.35)',
          borderRadius: 20,
          padding: '32px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(236, 72, 153, 0.15)'
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            background: 'rgba(236, 72, 153, 0.15)',
            border: '1px solid rgba(236, 72, 153, 0.35)',
            color: '#ec4899',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Lock size={28} />
          </div>

          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#ffffff' }}>
            Desain Terproteksi
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94a3b8', lineHeight: 1.45 }}>
            Berkas desain untuk <strong style={{ color: '#fff' }}>{projectData.clientName}</strong> dilindungi PIN keamanan studio.
          </p>

          <form onSubmit={handleVerifyPin}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                autoFocus
                required
                value={inputPin}
                onChange={e => {
                  setInputPin(e.target.value);
                  if (pinError) setPinError(false);
                }}
                placeholder="Masukkan PIN / Sandi"
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 10,
                  border: pinError ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 255, 255, 0.15)',
                  background: '#070911',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 800,
                  textAlign: 'center',
                  letterSpacing: '0.15em',
                  boxSizing: 'border-box',
                  outline: 'none',
                  boxShadow: pinError ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
                }}
              />
              {pinError && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#ef4444', fontSize: 11.5, fontWeight: 700, marginTop: 6 }}>
                  <AlertCircle size={13} />
                  <span>PIN tidak sesuai, mohon cek pesan WhatsApp Anda.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                height: 44,
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                color: '#ffffff',
                fontSize: 13.5,
                fontWeight: 850,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Buka Desain</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              onClick={handleAskPasswordWA}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <MessageSquare size={13} />
              <span>Belum dapat PIN? Hubungi Studio via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet 
        title={`Review & ACC Desain — ${projectData.title}`}
        description="Kanvas interaktif peninjauan visual desain, pin revisi presisi, dan persetujuan digital resmi sumr.day Studio."
      />

      <DesignProofingCanvas
        orderId={projectData.id}
        projectName={projectData.title}
        previewUrl={projectData.previewUrl}
        images={projectData.images}
        initialSlideIndex={initialSlideIndex}
        clientName={projectData.clientName}
        isPaid={projectData.isPaid}
        onClose={() => navigate('/')}
        onRevisionSubmitted={(pins) => {
          console.log('Revisi berhasil disubmit:', pins);
        }}
        onDesignApproved={(approval) => {
          console.log('Desain disetujui:', approval);
        }}
      />
    </>
  );
}
