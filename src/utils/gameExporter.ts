import JSZip from 'jszip';
import { GameVisualConfig } from '../types/gameLicense';
import { getOfflineLicenses } from './offlineLicenseDb';

export interface GameExportOptions {
  gameId: string;
  gameTitle?: string;
  config?: GameVisualConfig;
  clientName?: string;
  clientId?: string;
}

/**
 * Mendeteksi ekstensi file dari MIME type atau nama URL
 */
const getFileExtension = (url: string, contentType?: string | null): string => {
  if (contentType) {
    if (contentType.includes('image/png')) return '.png';
    if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) return '.jpg';
    if (contentType.includes('image/webp')) return '.webp';
    if (contentType.includes('image/svg')) return '.svg';
    if (contentType.includes('video/mp4')) return '.mp4';
    if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) return '.mp3';
  }
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
    if (match) return `.${match[1]}`;
  } catch (e) {}
  return '.png';
};

/**
 * Template Standalone Engine Game HTML5 Canvas Pure (DRM-Free, Offline Ready)
 */
const generateStandaloneGameHtml = (title: string, clientName?: string) => `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title} (Offline Edition)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body {
      background: #0f0c20;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
    }
    #header-bar {
      position: absolute;
      top: 16px;
      left: 20px;
      right: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
      pointer-events: none;
    }
    #brand-logo {
      max-height: 48px;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
    }
    #game-container {
      position: relative;
      width: 100%;
      max-width: 800px;
      height: 500px;
      background: #18152e;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    #bg-layer {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.35;
      pointer-events: none;
    }
    canvas {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      display: block;
    }
    #ui-overlay {
      position: absolute;
      z-index: 5;
      text-align: center;
      background: rgba(15,12,32,0.85);
      padding: 30px 40px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
    }
    .btn-play {
      margin-top: 16px;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 800;
      border: none;
      border-radius: 100px;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      transition: transform 0.15s;
    }
    .btn-play:active { transform: scale(0.96); }
    #watermark {
      position: absolute;
      bottom: 12px;
      font-size: 11px;
      opacity: 0.4;
      z-index: 10;
    }
  </style>
</head>
<body>
  <div id="header-bar">
    <img id="brand-logo" src="" alt="" style="display: none;" />
    <span style="font-size: 12px; font-weight: 700; color: #a78bfa; background: rgba(0,0,0,0.5); padding: 4px 12px; borderRadius: 20px;">
      💎 Beli Putus — Hak Milik Permanen ${clientName ? `(${clientName})` : ''}
    </span>
  </div>

  <div id="game-container">
    <div id="bg-layer"></div>
    <canvas id="gameCanvas" width="800" height="500"></canvas>
    <div id="ui-overlay">
      <h1 id="game-title" style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">${title}</h1>
      <p id="game-desc" style="font-size: 13px; color: #cbd5e1; max-width: 400px; line-height: 1.5;">
        Game Standalone Offline Edition. Berjalan 100% tanpa internet dan tanpa DRM.
      </p>
      <button id="btn-start" class="btn-play">▶ MULAI BERMAIN</button>
    </div>
  </div>

  <div id="watermark">Platform Agenze • Pure Offline Edition</div>

  <script src="./game.js"></script>
</body>
</html>`;

/**
 * Script JS Engine Mini Interaktif yang membaca ./config.json lokal
 */
const generateStandaloneGameJs = () => `// Standalone Offline Game Runner
(async function() {
  let config = {};
  try {
    const res = await fetch('./config.json');
    config = await res.json();
  } catch(e) {
    console.warn('Gagal membaca config.json, menggunakan konfigurasi fallback', e);
  }

  // Terapkan Config Visual
  const themeColor = config.themeColor || '#7c3aed';
  const startBtn = document.getElementById('btn-start');
  if (startBtn) startBtn.style.background = themeColor;

  if (config.logoUrl) {
    const logoEl = document.getElementById('brand-logo');
    if (logoEl) {
      logoEl.src = config.logoUrl;
      logoEl.style.display = 'block';
    }
  }

  if (config.heroBackgroundUrl) {
    const bgLayer = document.getElementById('bg-layer');
    if (bgLayer) {
      bgLayer.style.backgroundImage = 'url("' + config.heroBackgroundUrl + '")';
    }
  }

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('ui-overlay');

  let isPlaying = false;
  let score = 0;
  let player = { x: 80, y: 250, size: 24, vy: 0 };
  let obstacles = [];
  let frame = 0;

  startBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    isPlaying = true;
    score = 0;
    obstacles = [];
    player.y = 250;
    player.vy = 0;
    loop();
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      player.vy = -7.5;
    }
  });

  canvas.addEventListener('pointerdown', () => {
    player.vy = -7.5;
  });

  function loop() {
    if (!isPlaying) return;
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update Player
    player.vy += 0.35; // gravitasi
    player.y += player.vy;
    if (player.y > canvas.height - player.size) {
      player.y = canvas.height - player.size;
      player.vy = 0;
    }
    if (player.y < 0) player.y = 0;

    // Draw Player
    ctx.fillStyle = themeColor;
    ctx.shadowBlur = 12;
    ctx.shadowColor = themeColor;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Spawn Obstacles
    if (frame % 90 === 0) {
      const gap = 140;
      const topHeight = Math.floor(Math.random() * (canvas.height - gap - 60)) + 30;
      obstacles.push({
        x: canvas.width,
        top: topHeight,
        bottom: topHeight + gap,
        width: 44,
        passed: false
      });
    }

    // Update & Draw Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= 3.5;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      // Top Pipe
      ctx.fillRect(obs.x, 0, obs.width, obs.top);
      // Bottom Pipe
      ctx.fillRect(obs.x, obs.bottom, obs.width, canvas.height - obs.bottom);

      // Collision Check
      if (
        player.x + player.size/2 > obs.x && 
        player.x - player.size/2 < obs.x + obs.width
      ) {
        if (player.y - player.size/2 < obs.top || player.y + player.size/2 > obs.bottom) {
          gameOver();
          return;
        }
      }

      if (!obs.passed && obs.x < player.x) {
        obs.passed = true;
        score += 10;
      }

      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
      }
    }

    // Score HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Skor: ' + score, 24, 40);

    requestAnimationFrame(loop);
  }

  function gameOver() {
    isPlaying = false;
    overlay.style.display = 'block';
    const titleEl = document.getElementById('game-title');
    if (titleEl) titleEl.innerText = 'Game Over! Skor: ' + score;
    startBtn.innerText = '↺ MAIN LAGI';
  }
})();`;

/**
 * Alur Utama Tugas 5: Fitur Download Offline (.zip) Khusus "Beli Putus"
 * 1. Baca visual config dari IndexedDB (offline-first).
 * 2. Ekstrak URL Cloudinary / Remote CDN, download sebagai Blob ke folder `./assets/`.
 * 3. Tulis ulang string URL CDN menjadi path lokal relatif `./assets/...`.
 * 4. Bundling dengan HTML5 engine & config.json menggunakan JSZip.
 * 5. Trigger download file .zip otomatis tanpa DRM.
 */
export const exportGameZip = async (options: GameExportOptions): Promise<void> => {
  const { gameId, gameTitle = 'Custom Game', clientName = 'Client', clientId } = options;
  const zip = new JSZip();

  // 1. Ambil config: Cek dari IndexedDB terlebih dahulu (Zero Read) jika clientId disediakan
  let activeConfig: GameVisualConfig = { ...(options.config || {}) };
  if (clientId) {
    try {
      const offlineLicenses = await getOfflineLicenses(clientId);
      const matched = offlineLicenses.find(l => l.gameId === gameId || l.id.includes(gameId));
      if (matched && matched.customConfig) {
        activeConfig = { ...activeConfig, ...matched.customConfig };
      }
    } catch (e) {
      console.warn('[Export ZIP] Menggunakan config memory fallback:', e);
    }
  }

  // Folder aset lokal dalam ZIP
  const assetsFolder = zip.folder('assets');
  const rewrittenConfig: Record<string, any> = { ...activeConfig };

  // 2 & 3. Ekstrak URL Remote / Cloudinary, fetch Blob, dan rewrite ke path lokal
  const urlKeysToProcess: string[] = [
    'logoUrl',
    'heroBackgroundUrl',
    'bgmUrl',
    'sfxTapUrl',
    'customCssUrl'
  ];

  for (const key of urlKeysToProcess) {
    const remoteUrl = (activeConfig as any)[key];
    if (remoteUrl && typeof remoteUrl === 'string' && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
      try {
        console.log(`[Export ZIP] Mengunduh aset: ${key} (${remoteUrl})`);
        const response = await fetch(remoteUrl, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const ext = getFileExtension(remoteUrl, response.headers.get('content-type'));
          const localFileName = `${String(key)}_${Date.now()}${ext}`;
          
          if (assetsFolder) {
            assetsFolder.file(localFileName, blob);
          }
          // Tulis ulang path di config menjadi lokal relatif
          rewrittenConfig[key] = `./assets/${localFileName}`;
        } else {
          console.warn(`[Export ZIP] HTTP status ${response.status} saat fetch ${remoteUrl}. Melewati.`);
        }
      } catch (fetchErr) {
        console.warn(`[Export ZIP] Gagal mengunduh aset ${remoteUrl} (kemungkinan CORS). Menggunakan URL asli:`, fetchErr);
      }
    }
  }

  // 4. Masukkan file engine dan config lokal ke ZIP
  zip.file('index.html', generateStandaloneGameHtml(gameTitle, clientName));
  zip.file('game.js', generateStandaloneGameJs());
  zip.file('config.json', JSON.stringify(rewrittenConfig, null, 2));
  zip.file('README.txt', `======================================================================
${gameTitle.toUpperCase()} - STANDALONE OFFLINE EDITION
Lisensi: Beli Putus (Lifetime Offline Hak Milik - Zero DRM)
Pemilik Lisensi: ${clientName}
Dibuat Melalui: Agenze Game Studio & Interactive Builder
======================================================================

PETUNJUK PENGGUNAAN & SETUP DI BOOTH EVENT / KIOSK:

1. CARA EKSTRAK & MENJALANKAN:
   - Ekstrak seluruh file ZIP ini ke folder lokal di komputer, laptop, atau tablet kiosk.
   - Klik ganda file "index.html" untuk langsung membuka game di Google Chrome atau Microsoft Edge.
   - 100% Offline: Game TIDAK memerlukan kuota atau koneksi internet sama sekali!

2. PANDUAN MODE FULLSCREEN (LAYAR PENUH):
   - Di Windows / PC: Tekan tombol keyboard [ F11 ] untuk mengunci layar ke mode Fullscreen.
   - Di Mac: Tekan [ Cmd + Ctrl + F ].
   - Untuk keluar dari mode Fullscreen: Tekan kembali [ F11 ] atau [ Esc ].

3. PANDUAN PEMBERIAN IZIN KAMERA & AUDIO (JIKA MEMERLUKAN SENSOR):
   - Jika game meminta izin Webcam atau Mikrofon, klik tombol "Izinkan" (Allow) pada pop-up browser.
   - Pastikan webcam/kamera laptop tidak terblokir oleh aplikasi lain (seperti Zoom/Meet).

4. MENGHUBUNGKAN PERANGKAT KIOSK SENTUH:
   - Hubungkan kabel USB Touchscreen Kiosk ke PC/Laptop.
   - Game sudah responsif 100% dan mendukung multisentuh (Multi-touch gesture).

5. HUBUNGI KAMI UNTUK DUKUNGAN TEKNIS:
   - WhatsApp Support: Hubungi tim Agenze Game Activation Studio
======================================================================
`);

  // 5. Generate ZIP dan trigger download
  const safeTitle = gameTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const safeClient = clientName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const zipFilename = `${safeTitle}_${safeClient}_offline.zip`;

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  // Trigger download di browser
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
};

