import { GameInstance, ClientGameLicense } from '../types/gameLicense';

/**
 * Membuka jendela cetak PDF dengan bahasa Indonesia yang sangat ramah orang awam / non-teknis
 * (Guru, pekerja booth event, panitia lomba, keluarga).
 */
export const printGameSetupPdf = (game: GameInstance, license?: ClientGameLicense | null) => {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Jendela cetak terblokir. Silakan klik ikon gembok/pop-up di bilah alamat browser Anda dan pilih "Izinkan Pop-up".');
    return;
  }

  const clientName = license?.clientName || 'Penyelenggara Acara / Klien';
  const model = license?.model === 'lifetime' ? 'Hak Milik Tetap (Bisa Main Tanpa Internet)' : 'Sewa Acara';
  const durasi = game.eventSpecs?.estimatedDuration || (game.inputSpecs?.sessionDurationSec ? `${game.inputSpecs.sessionDurationSec} Detik per Ronde` : '30 - 60 Detik / Pemain');
  const targetSkor = game.inputSpecs?.maxTargetScore ? `${game.inputSpecs.maxTargetScore} Poin` : '1,000 Poin';
  const instruksi = game.inputSpecs?.instructionText || 'Cukup sentuh layar atau klik target yang muncul untuk mengumpulkan skor setinggi-tingginya!';
  const perangkat = game.eventSpecs?.deviceSupport || 'Layar Sentuh (Kiosk), Tablet (iPad/Android) atau Laptop Biasa';

  const cameraReq = game.inputSpecs?.requireCamera ? 'Ya, Butuh Kamera (Akan muncul pertanyaan izin di layar, klik "Izinkan")' : 'Tidak Butuh Kamera';
  const micReq = game.inputSpecs?.requireMicrophone ? 'Ya, Butuh Mikrofon Suara' : 'Tidak Butuh Mikrofon';
  const touchReq = game.inputSpecs?.requireTouchTap !== false ? 'Bisa Disentuh di Layar & Diklik Mouse' : 'Gunakan Keyboard';

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan Memasang & Menyalakan Game - ${game.title}</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 16mm 16mm 16mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #7c3aed;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #7c3aed;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .badge-doc {
      background: #ede9fe;
      color: #6d28d9;
      border: 1.5px solid #c4b5fd;
      padding: 6px 14px;
      border-radius: 100px;
      font-weight: 800;
      font-size: 11px;
    }

    .banner {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .banner h2 {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
    }
    .banner p {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }

    .step-box {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 12px;
    }
    .step-num {
      display: inline-block;
      background: #7c3aed;
      color: #ffffff;
      font-weight: 900;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 100px;
      margin-bottom: 6px;
    }
    .step-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .step-desc {
      font-size: 12.5px;
      color: #475569;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 18px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .info-label {
      font-size: 10.5px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
    }
    .info-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }

    .callout-tips {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 16px 0;
      font-size: 12.5px;
      color: #065f46;
    }

    .footer {
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">PANDUAN PRAKTIS MEMASANG GAME DI ACARA / BOOTH</div>
      <div class="brand-subtitle">Petunjuk langkah demi langkah yang mudah untuk panitia, guru, dan pekerja acara</div>
    </div>
    <div class="badge-doc">PANDUAN MUDAH</div>
  </div>

  <div class="banner">
    <div>
      <h2>${game.title}</h2>
      <p>Kategori: ${game.category || 'Aktivasi Acara & Hiburan'}</p>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; font-weight: 800; color: #64748b;">DISIAPKAN UNTUK:</div>
      <div style="font-size: 14px; font-weight: 900; color: #7c3aed;">${clientName}</div>
      <div style="font-size: 11px; color: #94a3b8;">${model}</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="info-card">
      <div class="info-label">Lama Main Tiap Orang</div>
      <div class="info-val">${durasi}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Target Skor</div>
      <div class="info-val">${targetSkor}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Layar yang Cocok</div>
      <div class="info-val">${perangkat}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Cara Kontrol</div>
      <div class="info-val">${touchReq}</div>
    </div>
  </div>

  <h3 style="font-size: 14px; font-weight: 900; color: #0f172a; margin-bottom: 10px;">
    CARA MENYALAKAN GAME (HANYA 4 LANGKAH):
  </h3>

  <div class="step-box">
    <span class="step-num">LANGKAH 1</span>
    <div class="step-title">Sambungkan Laptop ke Layar Besar atau TV</div>
    <div class="step-desc">
      Colokkan kabel HDMI dari laptop ke layar TV booth atau proyektor. Jika Anda memakai standing kiosk layar sentuh, colokkan juga kabel USB layar sentuh ke laptop agar sentuhan jari berfungsi.
    </div>
  </div>

  <div class="step-box">
    <span class="step-num">LANGKAH 2</span>
    <div class="step-title">Buka Game di Google Chrome</div>
    <div class="step-desc">
      Buka browser <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong>. Buka tautan web game Anda (atau klik ganda file <code>index.html</code> jika Anda menggunakan paket offline).
    </div>
  </div>

  <div class="step-box">
    <span class="step-num">LANGKAH 3</span>
    <div class="step-title">Kunci Layar Penuh (Tekan Tombol F11)</div>
    <div class="step-desc">
      Tekan tombol keyboard <strong>[ F11 ]</strong> (di laptop Mac tekan <strong>Cmd + Ctrl + F</strong>). Layar akan langsung menjadi penuh tanpa tombol browser sehingga pengunjung tidak bisa menutupnya secara tidak sengaja.
    </div>
  </div>

  <div class="step-box">
    <span class="step-num">LANGKAH 4</span>
    <div class="step-title">Beri Izin Kamera / Suara (Bila Diminta)</div>
    <div class="step-desc">
      Status Kebutuhan: <strong>${cameraReq}</strong> &bull; <strong>${micReq}</strong>.<br>
      Jika browser menampilkan kotak pertanyaan "Ingin menggunakan kamera/mikrofon?", klik tombol <strong>"Izinkan" (Allow)</strong>.
    </div>
  </div>

  <div class="callout-tips">
    <strong>Tips Agar Acara Lancar:</strong> Matikan mode tidur (Sleep/Screen Saver) pada laptop agar layar tidak mati otomatis saat antrean sepi. Untuk keluar dari layar penuh, tekan kembali tombol <strong>[ F11 ]</strong>.
  </div>

  <div class="footer">
    <div>Dicetak otomatis dari Agenze Studio &bull; Bantuan teknis: Hubungi admin penyedia game</div>
    <div>SOP Acara Ramah Pengguna &bull; ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
