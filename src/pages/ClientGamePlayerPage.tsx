import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameInstance, ClientGameLicense } from '../types/gameLicense';
import { getLicenses, getGames } from '../services/gameService';
import { getOfflineLicenses } from '../utils/offlineLicenseDb';
import { generateGameEngineHtml } from '../utils/gameEngineBuilder';
import { ArrowLeft, Maximize2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export const ClientGamePlayerPage: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [license, setLicense] = useState<ClientGameLicense | null>(null);
  const [game, setGame] = useState<GameInstance | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const loadGameInstance = async () => {
      if (!instanceId) {
        setError('ID Lisensi Game Klien tidak valid.');
        setLoading(false);
        return;
      }

      try {
        // 1. Cek dari Offline Cache IndexedDB dulu (Offline-first Zero-Firestore Read)
        const offlineList = await getOfflineLicenses();
        let foundLic = offlineList.find(l => l.id === instanceId);

        // 2. Jika tidak ada di cache offline, query dari Firestore
        if (!foundLic) {
          const remoteList = await getLicenses();
          foundLic = remoteList.find(l => l.id === instanceId);
        }

        if (!foundLic) {
          setError(`Lisensi dengan ID "${instanceId}" tidak ditemukan atau belum didaftarkan.`);
          setLoading(false);
          return;
        }

        // Cek status masa berlaku
        if (foundLic.model === 'rental' && foundLic.expiryDate && Date.now() > foundLic.expiryDate) {
          setError(`Masa sewa lisensi game ini telah kedaluwarsa pada ${new Date(foundLic.expiryDate).toLocaleDateString('id-ID')}. Silakan hubungi admin untuk perpanjangan.`);
          setLoading(false);
          return;
        }

        setLicense(foundLic);

        // Ambil data Game Master untuk spesifikasi input
        const allGames = await getGames();
        const foundGame = allGames.find(g => g.id === foundLic.gameId);
        if (foundGame) {
          setGame(foundGame);
        } else {
          // Buat placeholder GameInstance dari data license
          setGame({
            id: foundLic.gameId,
            title: foundLic.gameTitle,
            slug: foundLic.gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            engineType: 'HTML5 Single File',
            defaultConfig: foundLic.customConfig || { themeColor: '#7c3aed' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true
          });
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat instance game.');
      } finally {
        setLoading(false);
      }
    };

    loadGameInstance();
  }, [instanceId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#09090e', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        fontFamily: "'Outfit', sans-serif"
      }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#7c3aed' }} />
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Memuat Game Event...</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Memverifikasi lisensi & mengunduh template HTML5...</p>
      </div>
    );
  }

  if (error || !license || !game) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#09090e', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24,
        textAlign: 'center', fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          maxWidth: 480, background: '#181824', padding: '36px 28px', borderRadius: 24,
          border: '1.5px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
        }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 14 }} />
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900 }}>Akses Game Terkendala</h2>
          <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6 }}>{error}</p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 22px', borderRadius: 100, background: 'rgba(255,255,255,0.1)',
              color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer'
            }}
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  // Generate HTML murni Single File dengan konfigurasi visual & branding klien
  const gameHtml = (() => {
    if (game.htmlContent) {
      const cfgScript = `<script>window.gameConfig = ${JSON.stringify(license.customConfig || {})};</script>`;
      if (game.htmlContent.includes('<head>')) {
        return game.htmlContent.replace('<head>', `<head>${cfgScript}`);
      }
      return cfgScript + game.htmlContent;
    }
    return generateGameEngineHtml(game, license.customConfig);
  })();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      position: 'relative',
      overflow: 'hidden',
      background: '#09090e'
    }}>
      {/* Floating Kiosk Controls Header (Bisa disembunyikan saat fullscreen) */}
      <div style={{
        position: 'absolute',
        top: 14,
        right: 18,
        zIndex: 9999,
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }}>
        <button
          onClick={toggleFullscreen}
          style={{
            padding: '7px 14px',
            borderRadius: 100,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}
          title="Buka / Tutup Layar Penuh (Fullscreen F11)"
        >
          <Maximize2 size={13} />
          <span>{isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen (F11)'}</span>
        </button>

        <button
          onClick={() => navigate('/client')}
          style={{
            padding: '7px 14px',
            borderRadius: 100,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 11.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          title="Kembali ke Dasbor Klien"
        >
          <ArrowLeft size={13} />
          <span>Keluar</span>
        </button>
      </div>

      {/* Fullscreen Iframe Game Client */}
      <iframe
        srcDoc={gameHtml}
        title={game.title}
        allow="camera; microphone; fullscreen; autoplay; accelerometer; gyroscope"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          outline: 'none'
        }}
      />
    </div>
  );
};

export default ClientGamePlayerPage;
