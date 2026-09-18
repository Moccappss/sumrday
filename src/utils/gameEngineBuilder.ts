import JSZip from 'jszip';
import { GameInstance, GameVisualConfig, GameInputSpecs } from '../types/gameLicense';

/**
 * Generator Template Murni HTML5 Single File dengan 6 alur layar event:
 * 1. Screen Idle / Attract Mode (Menarik perhatian pengunjung booth)
 * 2. Screen Rules / Peraturan (Petunjuk bermain & ketentuan)
 * 3. Screen Loading / Ready Countdown (Hitung mundur 3.. 2.. 1..)
 * 4. Screen Gameplay (Permainan utama dengan canvas interaktif)
 * 5. Screen Results (Hasil skor, rating, dan badge pencapaian)
 * 6. Screen Leaderboard (Papan peringkat skor tertinggi pemain)
 */
export const generateGameEngineHtml = (game: Partial<GameInstance>, config?: GameVisualConfig): string => {
  const title = config?.title || game.title || 'Interactive Event Game';
  const brandName = config?.brandName || '';
  const themeColor = config?.themeColor || game.defaultConfig?.themeColor || '#7c3aed';
  const logoUrl = config?.logoUrl || game.defaultConfig?.logoUrl || '';
  const heroBg = config?.heroBackgroundUrl || game.defaultConfig?.heroBackgroundUrl || '';
  const welcomeMsg = config?.welcomeMessage || 'Aktivasi Interaktif Siap Digunakan!<br>Sentuh tombol di bawah untuk mulai.';
  const ctaText = config?.ctaText || '';
  const ctaUrl = config?.ctaUrl || '';
  const inputSpecs = game.inputSpecs || {};
  const duration = inputSpecs.sessionDurationSec || 45;
  const maxScore = inputSpecs.maxTargetScore || 1000;
  const instruction = inputSpecs.instructionText || 'Sentuh atau klik layar secepat mungkin untuk mendapatkan skor maksimal!';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${brandName ? `${brandName} — ` : ''}${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
    :root {
      --accent: ${themeColor};
      --bg: #09090e;
      --card-bg: rgba(22, 22, 34, 0.85);
      --text: #ffffff;
      --text-muted: #94a3b8;
    }
    body, html {
      width: 100%;
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }

    #bg-layer {
      position: absolute;
      inset: 0;
      background-image: ${heroBg ? `url("${heroBg}")` : 'radial-gradient(circle at 50% 30%, rgba(124,58,237,0.22), transparent 70%), linear-gradient(180deg, #09090e 0%, #131124 100%)'};
      background-size: cover;
      background-position: center;
      opacity: 0.45;
      z-index: 1;
      pointer-events: none;
    }

    /* Header Bar */
    #top-bar {
      position: absolute;
      top: 16px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      pointer-events: none;
    }
    .brand-logo {
      max-height: 48px;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));
    }
    .game-badge {
      background: rgba(0,0,0,0.65);
      border: 1px solid rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 800;
      color: #fff;
    }

    /* 6 Alur Layar Container */
    .screen {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      padding: 24px;
      text-align: center;
    }
    .screen.active {
      display: flex;
    }

    /* Screen Card Modal Box */
    .card-box {
      background: var(--card-bg);
      border: 1.5px solid rgba(255,255,255,0.12);
      box-shadow: 0 20px 60px rgba(0,0,0,0.7);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 32px 36px;
      max-width: 520px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      animation: popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.92) translateY(12px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    h1 { font-size: 28px; font-weight: 900; line-height: 1.2; }
    h2 { font-size: 22px; font-weight: 800; }
    p { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

    /* Buttons */
    .btn {
      padding: 14px 28px;
      border-radius: 100px;
      border: none;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
    }
    .btn-primary {
      background: var(--accent);
      color: #fff;
      box-shadow: 0 6px 20px rgba(124,58,237,0.4);
    }
    .btn-primary:active { transform: scale(0.96); }
    .btn-outline {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
    }

    /* Screen 4: Gameplay Canvas & HUD */
    #hud {
      position: absolute;
      top: 70px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 50;
      pointer-events: none;
    }
    .hud-pill {
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      padding: 8px 18px;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.12);
      font-size: 14px;
      font-weight: 900;
    }
    #game-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 5;
    }

    /* Leaderboard Table */
    .lb-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 13px;
    }
    .lb-table th {
      text-align: left;
      padding: 8px;
      color: var(--text-muted);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size: 11px;
      text-transform: uppercase;
    }
    .lb-table td {
      padding: 10px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div id="bg-layer"></div>

  <!-- Header Top Bar -->
  <div id="top-bar">
    <div style="display: flex; align-items: center; gap: 10px;">
      ${logoUrl ? `<img class="brand-logo" src="${logoUrl}" alt="Logo Brand">` : `<div></div>`}
      ${brandName ? `<span style="font-size: 12px; font-weight: 800; color: #fff; background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">${brandName}</span>` : ''}
    </div>
    <div class="game-badge">${title}</div>
  </div>

  <!-- 1. SCREEN IDLE / ATTRACT MODE -->
  <section id="screen-idle" class="screen active">
    <div class="card-box">
      ${brandName ? `<div style="font-size: 12px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: -6px;">${brandName}</div>` : ''}
      <div style="width: 54px; height: 54px; border-radius: 16px; background: rgba(124,58,237,0.2); color: var(--accent); display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="6"/></svg>
      </div>
      <h1>${title}</h1>
      <p>${welcomeMsg}</p>
      <button class="btn btn-primary" onclick="goToScreen('rules')">
        Mulai Bermain →
      </button>
      ${ctaText && ctaUrl ? `
        <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="font-size: 12.5px; padding: 10px 20px; border-color: var(--accent); color: #fff;">
          ${ctaText} ↗
        </a>
      ` : ''}
    </div>
  </section>

  <!-- 2. SCREEN RULES / PERATURAN -->
  <section id="screen-rules" class="screen">
    <div class="card-box">
      <h2>Peraturan Permainan</h2>
      <div style="text-align: left; width: 100%; background: rgba(0,0,0,0.3); padding: 14px 18px; border-radius: 14px; font-size: 13px; line-height: 1.6;">
        <p style="margin-bottom: 6px;">1. <strong>Instruksi:</strong> ${instruction}</p>
        <p style="margin-bottom: 6px;">2. <strong>Durasi Game:</strong> ${duration} Detik per ronde.</p>
        <p style="margin-bottom: 6px;">3. <strong>Target Skor:</strong> Kumpulkan hingga ${maxScore} poin.</p>
        <p>4. Masukkan nama Anda di akhir game untuk masuk papan peringkat!</p>
      </div>
      <div style="display: flex; gap: 10px; width: 100%;">
        <button class="btn btn-outline" style="flex: 1;" onclick="goToScreen('idle')">Kembali</button>
        <button class="btn btn-primary" style="flex: 2;" onclick="startCountdown()">Siap Bermain →</button>
      </div>
    </div>
  </section>

  <!-- 3. SCREEN LOADING / READY COUNTDOWN -->
  <section id="screen-loading" class="screen">
    <div class="card-box" style="padding: 50px 30px;">
      <h2 style="color: var(--text-muted);">BERSIAP-SIAP</h2>
      <div id="countdown-number" style="font-size: 88px; font-weight: 900; color: var(--accent);">3</div>
      <p>Letakkan tangan di layar...</p>
    </div>
  </section>

  <!-- 4. SCREEN GAMEPLAY -->
  <section id="screen-play" class="screen" style="padding: 0;">
    <div id="hud">
      <div class="hud-pill" style="color: #facc15;">Waktu: <span id="hud-timer">${duration}</span>s</div>
      <div class="hud-pill" style="color: #38bdf8;">Skor: <span id="hud-score">0</span></div>
    </div>
    <canvas id="game-canvas"></canvas>
  </section>

  <!-- 5. SCREEN RESULTS -->
  <section id="screen-result" class="screen">
    <div class="card-box">
      <div style="width: 50px; height: 50px; border-radius: 14px; background: rgba(234,179,8,0.2); color: #eab308; display: flex; align-items: center; justify-content: center;">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
      </div>
      <h2>Permainan Selesai</h2>
      <p style="font-size: 16px;">Skor Akhir Anda:</p>
      <div id="result-score" style="font-size: 52px; font-weight: 900; color: var(--accent); margin: -8px 0 6px;">0</div>
      
      <input type="text" id="player-name-input" placeholder="Ketik Nama Anda..." style="width: 100%; height: 44px; padding: 0 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: #fff; font-size: 14px; text-align: center; outline: none;" />
      
      <div style="display: flex; gap: 10px; width: 100%;">
        <button class="btn btn-outline" style="flex: 1;" onclick="goToScreen('idle')">Selesai</button>
        <button class="btn btn-primary" style="flex: 2;" onclick="saveScoreAndShowLeaderboard()">Simpan Skor →</button>
      </div>
    </div>
  </section>

  <!-- 6. SCREEN LEADERBOARD -->
  <section id="screen-leaderboard" class="screen">
    <div class="card-box" style="max-width: 580px;">
      <h2>Papan Peringkat Event</h2>
      <p style="margin-top: -8px;">Pemain dengan skor tertinggi hari ini:</p>
      
      <table class="lb-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Nama Peserta</th>
            <th style="text-align: right;">Skor</th>
          </tr>
        </thead>
        <tbody id="lb-body">
          <!-- Dinamis oleh JS -->
        </tbody>
      </table>

      <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="goToScreen('idle')">
        Main Lagi / Kembali ke Awal
      </button>
    </div>
  </section>

  <script>
    // ── GAME STATE & NAVIGATION ──
    const screens = ['idle', 'rules', 'loading', 'play', 'result', 'leaderboard'];
    let currentScore = 0;
    let timerInterval = null;
    let remainingTime = ${duration};
    let canvas, ctx;
    let clickTargets = [];

    function goToScreen(screenName) {
      screens.forEach(s => {
        const el = document.getElementById('screen-' + s);
        if (el) el.classList.toggle('active', s === screenName);
      });
      if (screenName === 'play') {
        initGamePlay();
      } else if (timerInterval) {
        clearInterval(timerInterval);
      }
    }

    function startCountdown() {
      goToScreen('loading');
      let count = 3;
      const el = document.getElementById('countdown-number');
      el.textContent = count;
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          el.textContent = count;
        } else {
          clearInterval(interval);
          goToScreen('play');
        }
      }, 900);
    }

    function initGamePlay() {
      currentScore = 0;
      remainingTime = ${duration};
      document.getElementById('hud-score').textContent = currentScore;
      document.getElementById('hud-timer').textContent = remainingTime;

      canvas = document.getElementById('game-canvas');
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      clickTargets = [];
      spawnTargets();

      // Timer Game
      timerInterval = setInterval(() => {
        remainingTime--;
        document.getElementById('hud-timer').textContent = remainingTime;
        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          finishGame();
        }
      }, 1000);

      // Listener Interaksi Layar
      canvas.onpointerdown = handleCanvasClick;
      requestAnimationFrame(gameLoop);
    }

    function resizeCanvas() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawnTargets() {
      clickTargets = [];
      for (let i = 0; i < 5; i++) {
        clickTargets.push({
          x: 100 + Math.random() * (canvas.width - 200),
          y: 120 + Math.random() * (canvas.height - 240),
          radius: 35 + Math.random() * 20,
          dx: (Math.random() - 0.5) * 4,
          dy: (Math.random() - 0.5) * 4,
          points: 100,
          color: ['#38bdf8', '#f472b6', '#facc15', '#34d399'][Math.floor(Math.random() * 4)]
        });
      }
    }

    function handleCanvasClick(e) {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      for (let i = clickTargets.length - 1; i >= 0; i--) {
        const t = clickTargets[i];
        const dist = Math.hypot(clickX - t.x, clickY - t.y);
        if (dist < t.radius) {
          currentScore += t.points;
          document.getElementById('hud-score').textContent = currentScore;
          // Respawn target
          clickTargets.splice(i, 1);
          clickTargets.push({
            x: 100 + Math.random() * (canvas.width - 200),
            y: 120 + Math.random() * (canvas.height - 240),
            radius: 35 + Math.random() * 20,
            dx: (Math.random() - 0.5) * 5,
            dy: (Math.random() - 0.5) * 5,
            points: 100,
            color: ['#38bdf8', '#f472b6', '#facc15', '#34d399'][Math.floor(Math.random() * 4)]
          });
          break;
        }
      }
    }

    function gameLoop() {
      if (remainingTime <= 0) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Targets
      clickTargets.forEach(t => {
        t.x += t.dx;
        t.y += t.dy;
        if (t.x - t.radius < 50 || t.x + t.radius > canvas.width - 50) t.dx *= -1;
        if (t.y - t.radius < 90 || t.y + t.radius > canvas.height - 90) t.dy *= -1;

        ctx.save();
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+100', t.x, t.y);
        ctx.restore();
      });

      requestAnimationFrame(gameLoop);
    }

    function finishGame() {
      document.getElementById('result-score').textContent = currentScore;
      goToScreen('result');
    }

    function saveScoreAndShowLeaderboard() {
      const name = document.getElementById('player-name-input').value.trim() || 'Pemain Booth';
      const key = 'porto_lb_${game.slug || 'game'}';
      let lb = JSON.parse(localStorage.getItem(key) || '[]');
      lb.push({ name, score: currentScore, date: new Date().toLocaleDateString('id-ID') });
      lb.sort((a, b) => b.score - a.score);
      lb = lb.slice(0, 10);
      localStorage.setItem(key, JSON.stringify(lb));

      renderLeaderboard(lb);
      goToScreen('leaderboard');
    }

    function renderLeaderboard(lb) {
      const tbody = document.getElementById('lb-body');
      tbody.innerHTML = '';
      if (lb.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Belum ada skor tercatat.</td></tr>';
        return;
      }
      lb.forEach((item, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1);
        tbody.innerHTML += \`
          <tr>
            <td>\${medal}</td>
            <td>\${item.name}</td>
            <td style="text-align: right; color: var(--accent);">\${item.score} Pts</td>
          </tr>
        \`;
      });
    }

    // Auto-init Leaderboard if available
    window.addEventListener('load', () => {
      const key = 'porto_lb_${game.slug || 'game'}';
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      renderLeaderboard(saved);
    });
  </script>
</body>
</html>`;
};

/**
 * Merakit struktur game baru:
 * - Menghubungi API local dev server (/api/engines/create) jika di localhost
 * - Atau men-generate file ZIP mandiri jika di environment Cloud / Production
 */
export const scaffoldNewGameEngine = async (game: Partial<GameInstance>): Promise<{ success: boolean; mode: 'local' | 'zip'; path?: string; message: string }> => {
  const slug = game.slug || `game-${Date.now()}`;
  const htmlContent = generateGameEngineHtml(game, game.defaultConfig);
  const configContent = {
    title: game.title || 'Untitled Game',
    slug,
    themeColor: game.defaultConfig?.themeColor || '#7c3aed',
    inputSpecs: game.inputSpecs || {},
    eventSpecs: game.eventSpecs || {},
    assets: {}
  };
  const readmeContent = `=====================================================
PANDUAN STRUKTUR GAME ENGINE: /public/engines/${slug}/
Platform: sumr.day Game Studio & Interactive Builder
=====================================================

STRUKTUR FOLDER:
/public/engines/${slug}/
├── index.html            (Template Murni HTML5 dengan 6 Layar Event)
├── config.default.json   (Konfigurasi Aset & Spesifikasi Kontrol)
├── README.txt            (Petunjuk Penempatan Folder Ini)
└── assets/               (Folder Gambar/Audio/BGM Lokal)

CARA PENEMPATAN:
1. Pindahkan folder '${slug}' ini ke dalam direktori: public/engines/${slug}/
2. Akses game langsung via browser: http://localhost:5173/engines/${slug}/index.html
3. Game mendukung 6 alur layar event aktivasi:
   - Screen 1: Idle (Attract Mode Kiosk)
   - Screen 2: Rules (Peraturan & Petunjuk Bermain)
   - Screen 3: Loading Countdown (3.. 2.. 1..)
   - Screen 4: Gameplay (Canvas 60 FPS)
   - Screen 5: Results (Perhitungan Skor)
   - Screen 6: Leaderboard (Papan Peringkat Top 10)
`;

  // Cek apakah di localhost (coba kirim ke dev server API)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    try {
      const res = await fetch('/api/engines/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          indexHtml: htmlContent,
          configJson: configContent,
          readmeText: readmeContent
        })
      });
      if (res.ok) {
        const json = await res.json();
        return {
          success: true,
          mode: 'local',
          path: json.path || `/engines/${slug}/index.html`,
          message: json.message || `Folder /public/engines/${slug}/ berhasil dibuat secara lokal!`
        };
      }
    } catch (localErr) {
      console.warn('[Engine Builder] Local API request failed, fallback to ZIP generation:', localErr);
    }
  }

  // Fallback: Mode Production / Read-Only Cloud -> Generate & Download ZIP
  const zip = new JSZip();
  const gameFolder = zip.folder(slug) || zip;
  gameFolder.file('index.html', htmlContent);
  gameFolder.file('config.default.json', JSON.stringify(configContent, null, 2));
  gameFolder.file('README.txt', readmeContent);
  gameFolder.folder('assets'); // Virtual empty folder

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `engine_${slug}_structure.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  return {
    success: true,
    mode: 'zip',
    message: `Server berjalan di mode cloud/production (read-only). File struktur ZIP '${slug}' berhasil di-download!`
  };
};
