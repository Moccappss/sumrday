import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, RefreshCw, LogOut, AlertCircle, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface WaitingApprovalScreenProps {
  user: any;
  userData: any;
  onApproved: (updatedUserData: any) => void;
  onSignOut: () => void;
}

export const WaitingApprovalScreen: React.FC<WaitingApprovalScreenProps> = ({
  user,
  userData,
  onApproved,
  onSignOut
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkStatus, setCheckStatus] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState(false);

  // Realtime listener to auto-detect when Super Admin approves this account
  useEffect(() => {
    if (!user?.uid) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const role = data.role;
        const status = data.status;

        // If approved by Super Admin
        if (role && role !== 'Pending' && status !== 'Pending') {
          setJustApproved(true);
          setTimeout(() => {
            onApproved({ id: user.uid, ...data });
          }, 1200);
        }
      }
    }, (err) => {
      console.warn('[WaitingApprovalScreen] Snapshot warning:', err.message);
    });

    return () => unsubscribe();
  }, [user?.uid, onApproved]);

  const handleManualCheck = async () => {
    if (!user?.uid) return;
    setIsChecking(true);
    setCheckStatus(null);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.role && data.role !== 'Pending' && data.status !== 'Pending') {
          setJustApproved(true);
          setCheckStatus('Selamat! Akun Anda telah disetujui. Membuka dashboard...');
          setTimeout(() => {
            onApproved({ id: user.uid, ...data });
          }, 1200);
          return;
        }
      }
      setCheckStatus('Akun Anda masih dalam status Menunggu Persetujuan Super Admin.');
    } catch (err: any) {
      setCheckStatus(`Gagal memeriksa status: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const displayName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Pengguna';
  const email = userData?.email || user?.email || '-';
  const avatarUrl = userData?.avatar || user?.photoURL;

  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 50%, #030712 100%)',
        padding: 20,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#f8fafc'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 24,
          padding: '36px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow Accent Top */}
        <div 
          style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: 120,
            background: justApproved 
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }}
        />

        {/* Animated Icon Badge */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            background: justApproved 
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
            border: justApproved 
              ? '2px solid #34d399'
              : '2px solid rgba(245, 158, 11, 0.35)',
            color: justApproved ? '#ffffff' : '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 22,
            boxShadow: justApproved 
              ? '0 12px 30px rgba(16, 185, 129, 0.4)'
              : '0 12px 30px rgba(245, 158, 11, 0.25)',
            transition: 'all 0.4s ease'
          }}
        >
          {justApproved ? (
            <CheckCircle2 size={40} strokeWidth={2.4} />
          ) : (
            <Clock size={38} strokeWidth={2.2} style={{ animation: 'cmsPulse 2s infinite ease-in-out' }} />
          )}
        </div>

        {/* Title */}
        <h2 
          style={{ 
            fontSize: 22, 
            fontWeight: 900, 
            margin: '0 0 8px', 
            letterSpacing: '-0.02em',
            color: justApproved ? '#34d399' : '#f8fafc' 
          }}
        >
          {justApproved ? 'Akses Disetujui!' : 'Menunggu Persetujuan Admin'}
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 390 }}>
          {justApproved ? (
            'Selamat! Super Admin telah mengonfirmasi peran Anda. Anda dialihkan ke dashboard...'
          ) : (
            'Akun Anda berhasil didaftarkan ke sistem, namun memerlukan persetujuan dari Super Admin sebelum dapat mengakses dashboard CMS.'
          )}
        </p>

        {/* User Card Profile Box */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
            textAlign: 'left'
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Clock size={10} /> Status: Menunggu Persetujuan
              </span>
            </div>
          </div>
        </div>

        {/* Realtime Live Pulse Banner */}
        <div
          style={{
            width: '100%',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 12,
            padding: '12px 14px',
            fontSize: 11.5,
            color: '#7dd3fc',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 24,
            textAlign: 'left'
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8', flexShrink: 0 }} />
          <span>
            Halaman ini mendeteksi persetujuan secara <strong>otomatis (realtime)</strong>. Begitu Super Admin menyetujui, Anda langsung masuk tanpa perlu refresh.
          </span>
        </div>

        {/* Feedback message if manual check was run */}
        {checkStatus && (
          <div 
            style={{
              width: '100%',
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 11.5,
              fontWeight: 600,
              background: justApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: justApproved ? '#4ade80' : '#cbd5e1',
              border: `1px solid ${justApproved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
            }}
          >
            {checkStatus}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isChecking || justApproved}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isChecking ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={15} className={isChecking ? 'cms-spin' : ''} />
            <span>{isChecking ? 'Memeriksa ke server...' : 'Cek Status Persetujuan'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            style={{
              width: '100%',
              height: 40,
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={14} />
            <span>Keluar / Logout Sementara</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default WaitingApprovalScreen;
