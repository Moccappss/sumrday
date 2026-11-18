import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderKanban, ShieldCheck, Receipt, MessageCircle, MessageSquareMore, Users
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { AdminPortalFeatureCard } from './AdminPortalFeatureCard';

interface ManagementPortalProps {
  onNavigate?: (page: string) => void;
  notify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
}

export const ManagementPortal: React.FC<ManagementPortalProps> = ({
  onNavigate,
  notify,
  isDarkMode = true
}) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [stats, setStats] = useState({
    projectsCount: 0,
    proofingCount: 0,
    transactionsCount: 0,
    usersCount: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [projects, proofing, transactions, users] = await Promise.all([
          storage.getItem('porto_projects', []),
          storage.getItem('porto_proofing_projects', []),
          storage.getItem('porto_transactions', []),
          storage.getItem('porto_users', [])
        ]);

        setStats({
          projectsCount: Array.isArray(projects) ? projects.length : 0,
          proofingCount: Array.isArray(proofing) ? proofing.length : 0,
          transactionsCount: Array.isArray(transactions) ? transactions.length : 0,
          usersCount: Array.isArray(users) ? users.length : 0
        });
      } catch (err) {
        console.error('Failed to load management stats:', err);
      }
    };

    loadStats();
  }, []);

  const cards = useMemo(() => [
    {
      key: 'projects',
      title: 'Proyek',
      badge: stats.projectsCount ? `${stats.projectsCount} Proyek` : 'Alur Kerja',
      subtitle: 'Kanban, daftar & kalender proyek',
      icon: FolderKanban,
      paletteIndex: 1,
    },
    {
      key: 'proofing',
      title: 'Proofing',
      badge: stats.proofingCount ? `${stats.proofingCount} Proofing` : 'Review',
      subtitle: 'Revisi & persetujuan hasil karya',
      icon: ShieldCheck,
      paletteIndex: 3,
    },
    {
      key: 'transactions',
      title: 'Kasir',
      badge: stats.transactionsCount ? `${stats.transactionsCount} Transaksi` : 'Arus Kas',
      subtitle: 'Invoice, pembayaran & laporan kas',
      icon: Receipt,
      paletteIndex: 0,
    },
    {
      key: 'whatsapp',
      title: 'WA Studio',
      badge: 'Notifikasi',
      subtitle: 'Otomatisasi pesan & tindak lanjut',
      icon: MessageCircle,
      paletteIndex: 7,
    },
    {
      key: 'chat',
      title: 'Live Chat',
      badge: 'Konsultasi',
      subtitle: 'Ruang percakapan langsung klien',
      icon: MessageSquareMore,
      paletteIndex: 2,
    },
    {
      key: 'users',
      title: 'CRM',
      badge: stats.usersCount ? `${stats.usersCount} Akun` : 'Tim & Klien',
      subtitle: 'Direktori mitra, tim & pelanggan',
      icon: Users,
      paletteIndex: 5,
    }
  ], [stats]);

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: isMobile ? 'flex-start' : 'center',
      alignItems: 'center',
      boxSizing: 'border-box',
      padding: isMobile ? '20px 16px 8px' : '28px 32px 60px',
      color: 'var(--cms-text, currentColor)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ maxWidth: 1140, width: '100%', margin: isMobile ? '0 auto' : 'auto' }}>

        {/* ── HEADER (Tanpa Keterangan Berlebihan) ── */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
            borderRadius: 100,
            background: 'var(--cms-accent-soft, rgba(217, 86, 41, 0.12))',
            color: 'var(--cms-accent, #D95629)',
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 8
          }}>
            <FolderKanban size={13} strokeWidth={2.4} />
            <span>Operasional Studio</span>
          </div>

          <h1 style={{
            margin: 0,
            fontSize: isMobile ? 26 : 32,
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
            letterSpacing: '-0.03em',
            color: isDarkMode ? 'var(--cms-text, #f8fafc)' : 'var(--cms-text, #0f172a)',
            WebkitFontSmoothing: 'antialiased',
          }}>
            Manajemen
          </h1>
        </div>

        {/* ── EDITORIAL WAVE FEATURE CARDS GRID ── */}
        <div className="admin-feature-portal-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(3, minmax(0, 1fr))',
            gap: isMobile ? 14 : 18
          }}>
          {cards.map((card, idx) => (
            <AdminPortalFeatureCard
              key={card.key}
              index={idx}
              title={card.title}
              badge={card.badge}
              subtitle={card.subtitle}
              tagLabel="ops"
              routeKey={card.key}
              icon={card.icon}
              paletteIndex={card.paletteIndex}
              variant="fluted"
              isMobile={isMobile}
              isDarkMode={isDarkMode}
              onClick={() => onNavigate?.(card.key)}
            />
          ))}
        </div>

        {/* Dedicated Mobile Bottom Spacer to ensure the last card (CRM) is never covered by bottom dock */}
        {isMobile && <div style={{ height: 110, width: '100%', flexShrink: 0 }} />}

      </div>
    </div>
  );
};

export default ManagementPortal;
