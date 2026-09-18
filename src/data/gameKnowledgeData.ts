/**
 * ENSIKLOPEDIA & PUSAT WAWASAN GAME STUDIO (100+ BUTIR INFORMASI LENGKAP)
 * Menyediakan panduan menyeluruh mulai dari arsitektur teknis, SOP event, integrasi AI, hingga solusi darurat booth.
 */

export interface KnowledgeItem {
  id: string;
  category: 'Arsitektur & AI' | 'Hardware & Display' | 'SOP & Booth' | 'White-Label & Branding' | 'Troubleshooting & Darurat' | 'Engagement & Psikologi';
  title: string;
  summary: string;
  solution: string;
  badge: string;
}

export const GAME_STUDIO_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // --- KATEGORI 1: ARSITEKTUR & INTEGRASI AI (20 INFO) ---
  {
    id: 'kb_arch_01',
    category: 'Arsitektur & AI',
    title: 'Filosofi HTML5 Single-File Tanpa Dependency Eksternal',
    summary: 'Mengapa game event wajib single-file murni HTML/CSS/JS tanpa React/Vite di mesin kiosk?',
    solution: 'Venue pameran seringkali memiliki koneksi internet buruk atau bahkan blank spot. File HTML murni dapat dijalankan langsung dengan double-click pada browser lokal, di-cache 100% secara offline, dan tidak akan crash akibat kegagalan download script CDN pihak ketiga.',
    badge: 'Fundamental'
  },
  {
    id: 'kb_arch_02',
    category: 'Arsitektur & AI',
    title: 'Struktur Standar 6 Alur Layar (State Machine Game Event)',
    summary: 'Enam alur layar wajib: Idle, Peraturan, Countdown, Main, Skor Akhir, dan Leaderboard.',
    solution: 'State machine mengendalikan visibilitas section dengan ID: screen-idle -> screen-rules -> screen-countdown -> screen-play -> screen-result -> screen-leaderboard. Alur ini terbukti menghasilkan zero-friction bagi pengunjung awam dan SPG yang bertugas.',
    badge: 'Standar UX'
  },
  {
    id: 'kb_arch_03',
    category: 'Arsitektur & AI',
    title: 'Integrasi Global window.gameConfig untuk White-Label',
    summary: 'Bagaimana launcher Agenze menyuntikkan logo, hero visual, dan warna tema klien?',
    solution: 'Launcher meng-inject objek window.gameConfig = { logoUrl, heroBackgroundUrl, themeColor, soundtrackUrl } sebelum file index.html dieksekusi. Skrip game cukup membaca window.gameConfig dan mengaplikasikannya ke CSS root variable atau canvas renderer.',
    badge: 'White-Label'
  },
  {
    id: 'kb_arch_04',
    category: 'Arsitektur & AI',
    title: 'Prompt Engineering Khusus Gemini 2.0 Flash untuk Game Coding',
    summary: 'Teknik prompt khusus agar Gemini menghasilkan kode game yang langsung jalan tanpa error.',
    solution: 'Gunakan instruksi tegas: "Write complete valid single-file HTML only. No Markdown fences, no explanations. All JS inside <script> and CSS inside <style>. Support touch and mouse events simultaneously. 60 FPS requestAnimationFrame loop."',
    badge: 'Gemini AI'
  },
  {
    id: 'kb_arch_05',
    category: 'Arsitektur & AI',
    title: 'Deduplikasi Cache AI Token di Agenze OS',
    summary: 'Bagaimana Agenze menghemat kuota token AI saat generate prompt berulang kali?',
    solution: 'Agenze menggunakan smart token caching berbasis SHA-256 hash pada prompt dan instruction. Panggilan prompt yang serupa diambil dari memori lokal/sessionStorage sehingga respons sub-second (0 detik) dan 0 token terpakai.',
    badge: 'Efisiensi'
  },
  {
    id: 'kb_arch_06',
    category: 'Arsitektur & AI',
    title: 'Penyimpanan Skor Offline di IndexedDB vs LocalStorage',
    summary: 'Alasan teknis IndexedDB lebih disukai untuk ratusan data skor pemain di event.',
    solution: 'LocalStorage terbatas pada kapasitas 5MB dan bersifat blocking synchronous pada main thread UI. IndexedDB bersifat asynchronous, mampu menampung puluhan ribu data skor pemain beserta nomor WhatsApp, dan kebal dari pembersihan otomatis browser saat kuota memori tipis.',
    badge: 'Data Integrity'
  },
  {
    id: 'kb_arch_07',
    category: 'Arsitektur & AI',
    title: 'Auto-Reset Timer (Attract Mode Timeout)',
    summary: 'Mencegah game menggantung jika ditinggalkan pemain di tengah permainan.',
    solution: 'Setiap event touch atau mouse click mereset timer tidak aktif (inactivityTimeout). Jika tidak ada interaksi selama 60 detik berturut-turut di layar manapun, game otomatis kembali ke Layar 1 (Idle Attract Screen) dengan animasi pancingan baru.',
    badge: 'Booth Kiosk'
  },
  {
    id: 'kb_arch_08',
    category: 'Arsitektur & AI',
    title: 'Audio Synthesizer Web Audio API (Zero Asset Sound)',
    summary: 'Membuat efek suara pop, coin, beep, dan game over tanpa perlu file MP3 eksternal.',
    solution: 'Gunakan AudioContext dengan oscillator (sine, square, triangle). Menghasilkan sound effect dinamis seketika berukuran 0 KB, tanpa resiko gagal loading file audio eksternal dan bebas hak cipta lisensi.',
    badge: 'Web Audio'
  },
  {
    id: 'kb_arch_09',
    category: 'Arsitektur & AI',
    title: 'Canvas DPR (Device Pixel Ratio) Scaling pada Layar Retina & 4K',
    summary: 'Mengatasi tampilan game canvas yang buram di iPad Retina atau layar TV 4K.',
    solution: 'Kalikan canvas.width dan canvas.height dengan window.devicePixelRatio, lalu atur style.width dan style.height sesuai ukuran layar CSS. Gambar canvas akan tajam kristal (crisp pixel perfect) di semua resolusi.',
    badge: 'Grafis'
  },
  {
    id: 'kb_arch_10',
    category: 'Arsitektur & AI',
    title: 'Proteksi Anti-Cheat Sederhana di Sisi Klien',
    summary: 'Mencegah pengunjung iseng mengubah skor melalui Inspect Element Console.',
    solution: 'Enkripsi nilai skor di variabel memori menggunakan XOR mask acak yang berubah setiap penambahan skor, serta nonaktifkan klik kanan (contextmenu) dan tombol shortcut F12 via event preventDefault.',
    badge: 'Keamanan'
  },

  // --- KATEGORI 2: HARDWARE, DISPLAY & KIOSK (20 INFO) ---
  {
    id: 'kb_hw_01',
    category: 'Hardware & Display',
    title: 'Mode Kiosk Fullscreen F11 di Google Chrome',
    summary: 'Menyembunyikan address bar dan tombol tutup agar pemain tidak keluar ke desktop.',
    solution: 'Jalankan Chrome dengan parameter shortcut: chrome.exe --kiosk --incognito "http://localhost:5173/launcher" atau tekan F11 saat halaman sudah terbuka. Tab baru dan tombol penutup jendela otomatis terkunci.',
    badge: 'Display TV'
  },
  {
    id: 'kb_hw_02',
    category: 'Hardware & Display',
    title: 'Orientasi Layar Horizontal (Landscape 16:9) vs Vertikal (Portrait 9:16)',
    summary: 'Kapan harus menggunakan proyektor landscape dan kapan standing totem vertical?',
    solution: 'Gunakan 16:9 Landscape untuk game balap, sepak bola, dan game dengan 2 pemain (duel). Gunakan 9:16 Portrait untuk standing totem 43-55 inch, game tap ritme jatuh, dan photo booth media sosial.',
    badge: 'Hardware'
  },
  {
    id: 'kb_hw_03',
    category: 'Hardware & Display',
    title: 'Kalibrasi Layar Sentuh IR Frame (Infrared Touch Overlay)',
    summary: 'Solusi jika sentuhan jari tidak pas (melenceng beberapa sentimeter dari target tombol).',
    solution: 'Buka Windows Control Panel -> Tablet PC Settings -> Calibrate. Lakukan kalibrasi 16 titik sentuh pada kaca IR Frame, dan pastikan tidak ada sorotan lampu halogen booth yang menembak langsung ke sensor infrared.',
    badge: 'Touchscreen'
  },
  {
    id: 'kb_hw_04',
    category: 'Hardware & Display',
    title: 'Pengaturan Sleep Mode & Screen Saver Windows di Booth',
    summary: 'Mencegah laptop booth mati tiba-tiba atau masuk lock screen saat sepi pengunjung.',
    solution: 'Wajib atur Windows Power Options: Turn off display: NEVER, Put the computer to sleep: NEVER. Matikan juga update otomatis Windows Update sementara selama hari H pameran berlangsung.',
    badge: 'Kiosk Setup'
  },
  {
    id: 'kb_hw_05',
    category: 'Hardware & Display',
    title: 'Pencahayaan Booth untuk Game Kamera AR & Deteksi Gerak',
    summary: 'Standar lux pencahayaan lampu agar kamera webcam mendeteksi wajah dengan akurat.',
    solution: 'Sediakan ring light atau softbox minimal 500-800 Lux di atas layar kiosk. Hindari backdrop belakang yang backlight (misal kaca gedung terkena sinar matahari siang) karena akan membuat wajah pemain menjadi siluet hitam.',
    badge: 'Kamera AR'
  },

  // --- KATEGORI 3: SOP OPERASIONAL & PENANGANAN EVENT (20 INFO) ---
  {
    id: 'kb_sop_01',
    category: 'SOP & Booth',
    title: 'SOP Checklist Pagi (H-60 Menit Sebelum Gerbang Dibuka)',
    summary: 'Daftar periksa wajib teknisi sebelum pengunjung mulai memadati area aktivasi.',
    solution: '1) Nyalakan UPS & cek tegangan listrik. 2) Buka browser, tekan F11 fullscreen. 3) Mainkan 1 ronde uji coba untuk verifikasi audio, deteksi sentuhan, dan simpan skor dummy. 4) Bersihkan layar sentuh dengan lap microfiber.',
    badge: 'SOP Event'
  },
  {
    id: 'kb_sop_02',
    category: 'SOP & Booth',
    title: 'Briefing Petugas SPG & Crew Penjaga Game',
    summary: 'Instruksi kunci 30 detik yang harus diucapkan SPG kepada setiap pengunjung.',
    solution: 'SPG cukup mengarahkan: "Halo Kak, silakan sentuh layar untuk mulai! Cukup kumpulkan koin logo selama 30 detik untuk dapat kupon diskon 50% di kasir!". Buat interaksi seringkas mungkin agar antrean tidak macet.',
    badge: 'Crew SOP'
  },
  {
    id: 'kb_sop_03',
    category: 'SOP & Booth',
    title: 'Manajemen Antrean & Durasi Ronde Ideal',
    summary: 'Berapa lama waktu permainan per orang agar tidak menimbulkan antrean mengular frustrasi?',
    solution: 'Durasi gameplay terbaik di event mall/pameran adalah 30 hingga 45 detik. Total waktu per orang (termasuk input nama & penyerahan suvenir) maksimal 75 detik. Dalam 1 jam, satu unit kiosk dapat melayani 40-48 pengunjung.',
    badge: 'Traffic Flow'
  },
  {
    id: 'kb_sop_04',
    category: 'SOP & Booth',
    title: 'Cadangan Offline Portable (Flashdisk Rescue Kit)',
    summary: 'Prosedur keselamatan jika laptop utama mati total atau tersiram minuman.',
    solution: 'Selalu siapkan 1 unit Flashdisk Rescue berisi: folder ZIP game offline yang sudah diekstrak, browser Google Chrome Portable (standalone tanpa install), dan salinan PDF SOP petunjuk teknis darurat.',
    badge: 'Safety Kit'
  },

  // --- KATEGORI 4: WHITE-LABEL & BRANDING (20 INFO) ---
  {
    id: 'kb_brand_01',
    category: 'White-Label & Branding',
    title: 'Format Rasio Logo Klien yang Paling Ideal (PNG Transparan)',
    summary: 'Rekomendasi dimensi dan format logo agar tidak gepeng atau pecah di layar.',
    solution: 'Gunakan file PNG transparan dengan resolusi 512x256 px (rasio 2:1 horizontal) atau 512x512 px (lingkaran/kotak). Simpan di Cloudinary dengan optimasi f_auto,q_auto untuk kompresi kilat tanpa penurunan ketajaman.',
    badge: 'Asset Standard'
  },
  {
    id: 'kb_brand_02',
    category: 'White-Label & Branding',
    title: 'Palet Warna Harmonis (Aksen Brand & Kontras Aksesibilitas)',
    summary: 'Memilih warna tema tombol game agar sesuai dengan identitas korporat klien.',
    solution: 'Pastikan warna teks tombol memiliki rasio kontras minimal 4.5:1 terhadap background (WCAG AA). Jika warna brand klien berwarna kuning terang, sistem launcher Agenze otomatis memilih teks hitam pekat untuk keterbacaan prima.',
    badge: 'Color Science'
  },
  {
    id: 'kb_brand_03',
    category: 'White-Label & Branding',
    title: 'Background Hero Kustom (Resolusi Full HD 1920x1080)',
    summary: 'Teknik agar gambar latar booth klien terlihat megah tanpa menutupi elemen game.',
    solution: 'Gunakan gambar Full HD (1920x1080 untuk horizontal atau 1080x1920 untuk vertikal). Pasang CSS overlay gradient rgba(0,0,0,0.55) di atas background agar target permainan dan teks skor tetap kontras dan terbaca jelas.',
    badge: 'Visual Design'
  },

  // --- KATEGORI 5: TROUBLESHOOTING & SITUASI DARURAT (20 INFO) ---
  {
    id: 'kb_trouble_01',
    category: 'Troubleshooting & Darurat',
    title: 'Kamera / Sensor Webcam Tidak Terbuka di Laptop Klien',
    summary: 'Gejala: Layar video hitam legam dan muncul peringatan izin diblokir.',
    solution: '1) Cek privacy shutter fisik kamera (geser penutup lensa di laptop). 2) Buka Settings Windows -> Privacy & Security -> Camera -> Izinkan aplikasi desktop mengakses kamera. 3) Jika buka via IP lokal, wajib aktifkan flag "Insecure origins treated as secure".',
    badge: 'Troubleshoot'
  },
  {
    id: 'kb_trouble_02',
    category: 'Troubleshooting & Darurat',
    title: 'Browser Tidak Mau Memutar Musik Latar (BGM Autoplay Policy)',
    summary: 'Penyebab browser memblokir audio otomatis dan cara mengatasinya.',
    solution: 'Kebijakan keamanan Chrome memblokir audio sebelum adanya interaksi sentuh pertama pengguna. Solusinya: Musik BGM dimulai saat pemain mengetuk tombol "Mulai Bermain" di Layar 1, bukan saat halaman baru pertama kali dimuat.',
    badge: 'Audio Policy'
  },
  {
    id: 'kb_trouble_03',
    category: 'Troubleshooting & Darurat',
    title: 'FPS Game Anjlok / Lagging Patah-Patah di Laptop Low-End',
    summary: 'Optimasi performa ketika laptop sewaan EO memiliki spesifikasi prosesor terbatas.',
    solution: '1) Kurangi jumlah partikel emitter dari 50 partikel menjadi 15 partikel. 2) Nonaktifkan efek CSS box-shadow blur tebal dan backdrop-filter blur. 3) Pastikan GPU Hardware Acceleration aktif di pengaturan Google Chrome (chrome://settings/system).',
    badge: 'Performance'
  },
  {
    id: 'kb_trouble_04',
    category: 'Troubleshooting & Darurat',
    title: 'Sentuhan Jari Terbaca Sebagai Double-Tap Zoom (Layar Membesar Sendiri)',
    summary: 'Mencegah browser melakukan pinch-to-zoom atau double-tap magnification di kiosk.',
    solution: 'Tambahkan tag meta viewport: <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"> dan CSS global: html, body { touch-action: manipulation; user-select: none; }.',
    badge: 'Mobile UX'
  },

  // --- KATEGORI 6: ENGAGEMENT & PSIKOLOGI EVENT (20 INFO) ---
  {
    id: 'kb_psy_01',
    category: 'Engagement & Psikologi',
    title: 'Psikologi Skor Menang-Menang (Pencegahan Rasa Frustrasi Pemain)',
    summary: 'Mengapa game event pameran tidak boleh dibuat terlalu sulit?',
    solution: 'Tujuan utama aktivasi event adalah kegembiraan dan kedekatan emosional dengan brand, bukan menyeleksi atlet e-sport. Buat 85% pemain mencapai target skor minimum untuk memenangkan hadiah agar mereka meninggalkan booth dengan senyum bahagia.',
    badge: 'Engagement'
  },
  {
    id: 'kb_psy_02',
    category: 'Engagement & Psikologi',
    title: 'Lead Generation: Pengumpulan Data Kontak Tanpa Hambatan',
    summary: 'Waktu terbaik meminta nama dan nomor WhatsApp pemain di booth.',
    solution: 'Jangan pernah meminta form pendaftaran di awal sebelum bermain! Biarkan pengunjung bermain dulu hingga selesai. Mintalah nomor WhatsApp di Layar Hasil Akhir dengan iming-iming: "Masukkan nomor WA untuk menerima bukti voucher hadiah dan melihat peringkatmu di Leaderboard!".',
    badge: 'Lead Gen'
  },
  {
    id: 'kb_psy_03',
    category: 'Engagement & Psikologi',
    title: 'Efek FOMO Leaderboard Real-Time di Layar TV Panggung',
    summary: 'Memicu persaingan sehat dan membuat booth selalu ramai dikerubungi penonton.',
    solution: 'Tampilkan tabel Top 5 skor tertinggi di layar TV panggung. Saat ada pemain yang berhasil memecahkan rekor nomor 1, putar efek suara kembang api dan panggil namanya via mikrofon MC. Ini akan memicu antrean baru yang ingin memecahkan rekor.',
    badge: 'Viral Effect'
  }
,
  {
    id: 'kb_arch_11',
    category: 'Arsitektur & AI',
    title: 'requestAnimationFrame vs setInterval untuk Game Loop',
    summary: 'Mana yang lebih tepat untuk loop utama game 60 FPS?',
    solution: 'Selalu gunakan requestAnimationFrame. Berbeda dengan setInterval, rAF menyesuaikan frame rate dengan refresh display monitor, berhenti otomatis saat tab tidak aktif (hemat baterai), dan tidak menumpuk antrian callback saat CPU sibuk.',
    badge: 'Performa'
  },
  {
    id: 'kb_arch_12',
    category: 'Arsitektur & AI',
    title: 'Strategi Preload Aset Gambar dan Sprite Sheet',
    summary: 'Menghindari gambar yang muncul terlambat atau flicker saat gameplay dimulai.',
    solution: 'Buat array promises dengan new Image() dan tunggu Promise.all() selesai sebelum masuk ke screen gameplay. Tampilkan loading bar atau animasi spinner selama proses preload berlangsung.',
    badge: 'Loading'
  },
  {
    id: 'kb_arch_13',
    category: 'Arsitektur & AI',
    title: 'Deteksi Gerakan Tangan via MediaPipe Hands (Zero ML Cost)',
    summary: 'Membuat game yang dikendalikan dengan gerakan tangan tanpa server backend khusus.',
    solution: 'Gunakan MediaPipe Hands CDN (vision_bundle.task-wasm) bersama getUserMedia webcam. Model berjalan 100% di CPU/GPU lokal browser tanpa mengirim gambar ke server. Deteksi 21 landmark tangan dengan latensi kurang dari 50ms.',
    badge: 'AR Kamera'
  },
  {
    id: 'kb_arch_14',
    category: 'Arsitektur & AI',
    title: 'Normalisasi Koordinat Sentuhan Multi-Touch',
    summary: 'Menangani event touch multi-jari di layar kiosk 43 inch tanpa library tambahan.',
    solution: 'Gunakan event.touches[0] untuk single touch. Normalkan koordinat: x = (touch.clientX / window.innerWidth) * canvasWidth untuk mapping resolusi agnostik.',
    badge: 'Input Handling'
  },
  {
    id: 'kb_arch_15',
    category: 'Arsitektur & AI',
    title: 'Teknik Sprite Animation dengan CSS Keyframe',
    summary: 'Membuat karakter berjalan atau berlari tanpa canvas murni.',
    solution: 'Gunakan satu file sprite sheet PNG dengan background-position animation via @keyframes. Atur steps(jumlah_frame) untuk pergerakan yang jerky-free. Lebih ringan dari Canvas drawImage saat jumlah sprite kurang dari 8.',
    badge: 'Animasi'
  },
  {
    id: 'kb_arch_16',
    category: 'Arsitektur & AI',
    title: 'Sistem Timer Presisi dengan Performance API',
    summary: 'Mengapa Date.now() berbahaya untuk hitungan mundur game event?',
    solution: 'Date.now() dapat melompat atau terjadi drift pada laptop dengan clock tidak akurat. Gunakan performance.now() yang memberikan timestamp monotonic dengan presisi 0.001ms, cocok untuk hitungan mundur ketat 30-60 detik.',
    badge: 'Presisi'
  },
  {
    id: 'kb_arch_17',
    category: 'Arsitektur & AI',
    title: 'Dynamic Import dan Code Splitting untuk Game Multi-Level',
    summary: 'Memuat level game berikutnya tanpa reload halaman untuk pengalaman seamless.',
    solution: 'Gunakan import() dinamis dengan await. Muat level berikutnya di background saat pemain masih di level 1. Cocok untuk game trivia atau puzzle multi-ronde.',
    badge: 'Arsitektur'
  },
  {
    id: 'kb_arch_18',
    category: 'Arsitektur & AI',
    title: 'Enkripsi Token Klien dengan AES-GCM di Browser',
    summary: 'Cara menyimpan API key klien di localStorage tanpa risiko ekspos teks polos.',
    solution: 'Gunakan Web Crypto API window.crypto.subtle.encrypt dengan AES-GCM 256-bit. Simpan IV dan salt terpisah. Perlu salt + password master di server agar tidak bisa didekripsi hanya dari localStorage saja.',
    badge: 'Security'
  },
  {
    id: 'kb_arch_19',
    category: 'Arsitektur & AI',
    title: 'Service Worker dan Workbox untuk Caching Game Offline',
    summary: 'Membuat game event dapat dimainkan tanpa internet setelah pertama kali dibuka.',
    solution: 'Daftarkan Service Worker dengan Workbox CacheFirst strategy. Cache seluruh aset (HTML, JS, gambar, font) saat install event. Saat network mati, game tetap berjalan penuh dari cache. Ideal untuk venue pameran dengan WiFi tidak stabil.',
    badge: 'Offline-First'
  },
  {
    id: 'kb_arch_20',
    category: 'Arsitektur & AI',
    title: 'WebSocket Real-Time untuk Leaderboard Multi-Kiosk',
    summary: 'Menyinkronkan skor antar kiosk secara real-time tanpa reload manual.',
    solution: 'Gunakan WebSocket atau Firebase Realtime Database onSnapshot. Setiap kiosk yang menyimpan skor baru akan memicu update leaderboard di semua layar TV yang terhubung dalam milidetik.',
    badge: 'Real-Time'
  },
  {
    id: 'kb_arch_21',
    category: 'Arsitektur & AI',
    title: 'Teknik Generate Warna Harmonis Secara Programatik',
    summary: 'Cara otomatis memilih warna teks yang kontras terhadap warna brand klien.',
    solution: 'Konversi HEX ke luminansi relatif: L = 0.2126R + 0.7152G + 0.0722B. Jika L lebih dari 0.179, gunakan teks hitam; jika tidak, gunakan teks putih. Formula WCAG 2.1 ini memastikan rasio kontras minimal 4.5:1 secara otomatis.',
    badge: 'Color Science'
  },
  {
    id: 'kb_arch_22',
    category: 'Arsitektur & AI',
    title: 'Pemicu Haptic Feedback via Vibration API',
    summary: 'Memberikan getaran pada smartphone pemain saat terkena jebakan atau meraih combo.',
    solution: 'Gunakan navigator.vibrate([50, 30, 80]) untuk pola getaran pendek. Tersedia di Android Chrome dan Firefox. Getaran feedback meningkatkan rasa imersif game mobile booth.',
    badge: 'Mobile UX'
  },
  {
    id: 'kb_arch_23',
    category: 'Arsitektur & AI',
    title: 'Shadow DOM dan Custom Elements untuk Game Widget Embeddable',
    summary: 'Membuat game yang dapat dipasang di website lain tanpa konflik CSS/JS.',
    solution: 'Bungkus seluruh game dalam Custom Element dengan Shadow DOM. Semua style dan script terisolasi total dari host website, mencegah kebocoran style ke halaman induk.',
    badge: 'Web Component'
  },
  {
    id: 'kb_arch_24',
    category: 'Arsitektur & AI',
    title: 'Optimasi Bundle dengan Tree-Shaking di Vite',
    summary: 'Cara menghapus dead code secara otomatis untuk mempercepat loading CMS admin.',
    solution: 'Vite secara default melakukan tree-shaking pada ES Module. Pastikan semua import menggunakan named export. Gunakan import type untuk tipe TypeScript agar tidak masuk bundle JS produksi.',
    badge: 'Build Perf'
  },
  {
    id: 'kb_arch_25',
    category: 'Arsitektur & AI',
    title: 'Mekanisme Sinkronisasi Backup ke Google Sheets via Apps Script',
    summary: 'Cara kerja sinkronisasi data backup game ke Google Sheets secara otomatis.',
    solution: 'CMS mengirim payload JSON ke URL webhook Google Apps Script via fetch POST. Script menerima payload, memparse data game (config, lisensi, label), lalu menulis baris demi baris ke tab spreadsheet yang sesuai.',
    badge: 'Backup'
  },
  {
    id: 'kb_hw_06',
    category: 'Hardware & Display',
    title: 'Spesifikasi Laptop Minimum untuk Game 3D WebGL Event',
    summary: 'CPU dan GPU minimum agar game WebGL berjalan 60 FPS di booth kiosk.',
    solution: 'Minimum: Intel Core i5 Gen 8 / AMD Ryzen 5 3500U, RAM 8GB DDR4. Untuk game 3D Three.js berat, gunakan NVIDIA GTX 1650 atau setara agar stabil di 60 FPS.',
    badge: 'Spec Guide'
  },
  {
    id: 'kb_hw_07',
    category: 'Hardware & Display',
    title: 'Manajemen Panas Laptop Selama 8 Jam Operasional Event',
    summary: 'Mencegah throttling CPU/GPU yang menyebabkan game patah-patah setelah beberapa jam.',
    solution: 'Gunakan cooling pad laptop minimal 2 kipas aktif. Bersihkan ventilasi udara dari debu sebelum hari H. Atur Power Plan ke Balanced untuk keseimbangan suhu dan frame rate yang stabil seharian.',
    badge: 'Hardware Ops'
  },
  {
    id: 'kb_hw_08',
    category: 'Hardware & Display',
    title: 'Koneksi HDMI vs DisplayPort ke TV/Proyektor',
    summary: 'Perbedaan teknis dan kapan menggunakan adaptor yang tepat di booth event.',
    solution: 'HDMI 2.0 mendukung 4K 60Hz, DisplayPort 1.4 mendukung 4K 120Hz. Untuk proyektor venue, selalu bawa adaptor HDMI + Type-C sebagai cadangan.',
    badge: 'Konektivitas'
  },
  {
    id: 'kb_hw_09',
    category: 'Hardware & Display',
    title: 'Setting Resolusi Monitor Kloning vs Extend di Windows',
    summary: 'Cara agar laptop menampilkan game di TV besar sementara admin tetap bisa mengontrol di laptop.',
    solution: 'Gunakan mode Duplicate (Win + P) saat kiosk sedang digunakan pemain. Gunakan mode Extend untuk keperluan monitoring. Mode Duplicate memastikan pemain di TV melihat persis apa yang ada di layar laptop.',
    badge: 'Display Setup'
  },
  {
    id: 'kb_hw_10',
    category: 'Hardware & Display',
    title: 'Penggunaan USB Hub Powered untuk Webcam dan USB Touchscreen',
    summary: 'Mencegah perangkat terputus akibat tegangan USB laptop yang tidak mencukupi.',
    solution: 'Selalu gunakan USB Hub berdaya mandiri (powered hub) dengan adaptor 5V/2A jika menggabungkan webcam HD, IR frame touchscreen, dan speaker USB secara bersamaan.',
    badge: 'Power Mgt'
  },
  {
    id: 'kb_hw_11',
    category: 'Hardware & Display',
    title: 'Proyektor Short-Throw untuk Instalasi Layar Lantai',
    summary: 'Memilih proyektor yang tepat untuk game interaktif pada permukaan lantai.',
    solution: 'Gunakan proyektor short-throw (rasio proyeksi kurang dari 0.5) minimal 3000 ANSI Lumens. Pastikan game mendukung tampilan terbalik (vertical flip 180 derajat) via CSS transform.',
    badge: 'Instalasi'
  },
  {
    id: 'kb_hw_12',
    category: 'Hardware & Display',
    title: 'Wired Ethernet vs WiFi untuk Leaderboard Real-Time',
    summary: 'Koneksi mana yang lebih stabil untuk sinkronisasi skor di venue besar?',
    solution: 'Selalu prioritaskan kabel LAN Cat6 untuk kiosk utama dan server. WiFi 5GHz lebih rentan interferensi dari ratusan smartphone pengunjung. Bawa router portable sebagai cadangan hotspot pribadi.',
    badge: 'Networking'
  },
  {
    id: 'kb_hw_13',
    category: 'Hardware & Display',
    title: 'UPS (Uninterruptible Power Supply) untuk Booth Event',
    summary: 'Kapasitas UPS minimum untuk menyelamatkan skor pemain saat listrik mati.',
    solution: 'Sediakan UPS kapasitas 1000VA / 600W untuk laptop kiosk dan TV. Saat listrik mati, UPS memberikan waktu 10-15 menit untuk menyimpan skor terakhir dan mematikan perangkat dengan aman.',
    badge: 'Safety'
  },
  {
    id: 'kb_hw_14',
    category: 'Hardware & Display',
    title: 'Printer Thermal untuk Cetak Tiket Pemenang',
    summary: 'Integrasi printer thermal Bluetooth ke game booth untuk mencetak bukti kemenangan.',
    solution: 'Gunakan printer thermal 80mm dengan driver ESC/POS. Integrasi via Web Bluetooth API atau bridge software local. Kirim data pemenang dalam format teks plain ke printer setelah pemain mengisi nama.',
    badge: 'Peripheral'
  },
  {
    id: 'kb_hw_15',
    category: 'Hardware & Display',
    title: 'LED Strip Ambient (Addressable RGB) Sinkron dengan Game',
    summary: 'Efek lampu sekitar yang berubah mengikuti state game untuk atmosfer yang imersif.',
    solution: 'Kendalikan LED strip WS2812B via Arduino Nano + Serial-over-USB. Kirim perintah warna dari JavaScript via Web Serial API (Chrome 89+). Saat game over, LED merah berkedip; saat menang besar, LED rainbow animasi.',
    badge: 'Ambient Tech'
  },
  {
    id: 'kb_hw_16',
    category: 'Hardware & Display',
    title: 'Konfigurasi Resolusi Kustom untuk Monitor Portrait 43 Inch',
    summary: 'Monitor 43 inch diputar vertikal namun resolusi tidak terdeteksi 1080x1920.',
    solution: 'Buka NVIDIA/AMD Control Panel lalu Create Custom Resolution, atur 1080x1920 pada refresh rate 60Hz. Untuk Intel UHD, gunakan Custom Resolution Utility (CRU) pihak ketiga.',
    badge: 'Monitor Config'
  },
  {
    id: 'kb_hw_17',
    category: 'Hardware & Display',
    title: 'Bracket Mounting Laptop di Belakang TV VESA',
    summary: 'Solusi instalasi rapi tanpa meja laptop untuk tampilan booth profesional.',
    solution: 'Gunakan bracket VESA mini PC mount yang dipasang di belakang TV (VESA 100x100mm). Laptop ditempatkan tersembunyi dengan kabel HDMI dan power tersusun rapi.',
    badge: 'Instalasi'
  },
  {
    id: 'kb_hw_18',
    category: 'Hardware & Display',
    title: 'Webcam Resolusi Tinggi vs Built-in Laptop untuk Game AR',
    summary: 'Perbandingan performa antara kamera bawaan laptop dan webcam eksternal Logitech.',
    solution: 'Kamera bawaan laptop biasanya 720p 30fps, buruk di kondisi low-light. Gunakan Logitech C920 (1080p 30fps) atau C922 (1080p 60fps) untuk game AR dan deteksi gerak yang akurat.',
    badge: 'Kamera'
  },
  {
    id: 'kb_hw_19',
    category: 'Hardware & Display',
    title: 'Lapisan Pelindung Layar Anti-Gores untuk Kiosk Touchscreen',
    summary: 'Melindungi permukaan layar dari kuku jari dan koin pengunjung yang tidak sengaja.',
    solution: 'Pasang tempered glass 9H atau screen protector anti-gores matte. Lapisan matte juga mengurangi pantulan cahaya ambient di venue yang terang. Ganti setiap 6 bulan untuk menjaga sensitivitas sentuh.',
    badge: 'Perlindungan'
  },
  {
    id: 'kb_hw_20',
    category: 'Hardware & Display',
    title: 'Isolasi Kejutan Listrik Statis pada Layar Kiosk',
    summary: 'Mencegah ESD (Electrostatic Discharge) dari tangan pemain yang merusak hardware.',
    solution: 'Pasang anti-static strip grounding di rangka aluminium kiosk. Gunakan karpet anti-statik di area booth. ESD berpeluang merusak IR frame touch panel dan motherboard laptop dalam kondisi udara kering AC.',
    badge: 'ESD Safety'
  },
  {
    id: 'kb_hw_21',
    category: 'Hardware & Display',
    title: 'Penggunaan Raspberry Pi sebagai PC Kiosk Hemat Biaya',
    summary: 'Alternatif laptop mahal untuk kiosk game HTML5 di event dengan anggaran terbatas.',
    solution: 'Raspberry Pi 4 (8GB RAM) dapat menjalankan Chromium browser dalam mode kiosk 1080p untuk game HTML5 Canvas 2D. Tidak cocok untuk game WebGL berat atau video 4K streaming.',
    badge: 'Budget'
  },
  {
    id: 'kb_hw_22',
    category: 'Hardware & Display',
    title: 'Barcode/QR Scanner USB untuk Game Voucher Hunting',
    summary: 'Integrasi scanner barcode fisik ke dalam gameplay sebagai mekanik tambahan.',
    solution: 'QR scanner USB HID berfungsi seperti keyboard, mengirim karakter ke field input aktif secara otomatis. Buat hidden input di game dan daftarkan event listener keydown untuk menangkap data scan.',
    badge: 'Input Unik'
  },
  {
    id: 'kb_sop_05',
    category: 'SOP & Booth',
    title: 'Protokol Ganti Shift Crew Tanpa Gangguan Operasional',
    summary: 'Cara memastikan booth berjalan mulus saat petugas bergantian setiap 4 jam.',
    solution: 'Buat dokumen log shift (nama, waktu mulai/selesai, total pemain, kendala). Serah terima dilakukan 15 menit sebelum shift berakhir. Crew pengganti wajib memainkan 1 ronde uji sebelum resmi bertugas.',
    badge: 'Operasional'
  },
  {
    id: 'kb_sop_06',
    category: 'SOP & Booth',
    title: 'Penanganan Pemain yang Curang atau Agresif',
    summary: 'Protokol untuk menghadapi pengunjung yang mencoba memanipulasi skor atau merusak perangkat.',
    solution: 'Crew tidak perlu berargumen. Cukup katakan sistem akan memverifikasi skor secara otomatis. Laporkan kejadian ke supervisor. Jangan pernah mengundang perdebatan di depan pengunjung lain.',
    badge: 'Crew SOP'
  },
  {
    id: 'kb_sop_07',
    category: 'SOP & Booth',
    title: 'Reset Harian Leaderboard Skor untuk Fairplay',
    summary: 'Kapan dan bagaimana mengatur ulang papan skor agar kompetisi tetap segar setiap hari.',
    solution: 'Buat tombol Reset Leaderboard Hari Ini di panel admin CMS. Reset dilakukan setiap pukul 08.00 pagi sebelum booth dibuka. Ekspor skor hari sebelumnya ke CSV/Google Sheets terlebih dahulu.',
    badge: 'Data Mgt'
  },
  {
    id: 'kb_sop_08',
    category: 'SOP & Booth',
    title: 'Prosedur Ekspor Data Peserta ke WhatsApp Broadcast',
    summary: 'Cara mengekstrak nomor WhatsApp pemenang untuk pengiriman voucher digital setelah event.',
    solution: 'Ekspor data leaderboard (nama + WA) ke file CSV dari panel CMS. Import ke aplikasi broadcast WA. Kirim pesan voucher secara batch dalam 30 menit setelah event berakhir selagi audience masih hangat.',
    badge: 'Lead Follow-up'
  },
  {
    id: 'kb_sop_09',
    category: 'SOP & Booth',
    title: 'SOP Pembersihan Layar Sentuh di Tengah Event (Hygiene)',
    summary: 'Protokol kebersihan layar kiosk yang disentuh ratusan tangan selama 8 jam.',
    solution: 'Sediakan botol semprotan desinfektan non-alkohol dan tisu microfiber di dekat booth. Bersihkan layar setiap 2 jam sekali saat sepi pengunjung. Pasang hand sanitizer di meja depan kiosk.',
    badge: 'Hygiene'
  },
  {
    id: 'kb_sop_10',
    category: 'SOP & Booth',
    title: 'Rekap Laporan Performa Event (KPI Post-Event Report)',
    summary: 'Metrik kunci yang perlu dilaporkan klien setelah hari H event berakhir.',
    solution: 'KPI utama: Total Pemain, Completion Rate, Average Score, Peak Hour, Lead Captured. Sajikan dalam PDF 1 halaman dengan grafik agar mudah dibaca tim marketing klien.',
    badge: 'Analytics'
  },
  {
    id: 'kb_sop_11',
    category: 'SOP & Booth',
    title: 'Konfigurasi Windows Autostart Game saat Boot',
    summary: 'Memastikan game otomatis terbuka di fullscreen begitu laptop dinyalakan tanpa login manual.',
    solution: 'Buat file .bat berisi perintah start chrome --kiosk --disable-infobars http://localhost:5173. Tambahkan file .bat ke Windows Startup folder. Atur Windows auto-login tanpa password via netplwiz.',
    badge: 'Auto Boot'
  },
  {
    id: 'kb_sop_12',
    category: 'SOP & Booth',
    title: 'Checklist Teknis H-1 (Sehari Sebelum Event)',
    summary: 'Daftar pekerjaan yang harus diselesaikan sehari sebelum hari H agar tidak ada kejutan.',
    solution: '1) Deploy game ke server lokal. 2) Test koneksi Firebase. 3) Isi data leaderboard dummy. 4) Print cadangan SOP. 5) Charge semua perangkat. 6) Pack rescue kit (flashdisk, kabel HDMI cadangan, adaptor, UPS).',
    badge: 'Preparation'
  },
  {
    id: 'kb_sop_13',
    category: 'SOP & Booth',
    title: 'Prosedur Penanganan Listrik Mati Mendadak (Power Failure)',
    summary: 'Langkah darurat saat listrik venue padam di tengah event yang ramai.',
    solution: '1) UPS otomatis aktif. 2) Crew segera simpan skor sesi terakhir lewat tombol admin. 3) Minta pemain mundur dari area kiosk. 4) Hubungi teknisi venue via HT. 5) Tunggu 3 menit sebelum menyalakan perangkat kembali.',
    badge: 'Emergency'
  },
  {
    id: 'kb_sop_14',
    category: 'SOP & Booth',
    title: 'Pencatatan Log Manual Skor Backup (Failsafe Paper Log)',
    summary: 'Antisipasi jika sistem digital sepenuhnya gagal dan tidak ada data digital tersisa.',
    solution: 'Sediakan form kertas dengan kolom: No Urut, Nama, Nomor WA, Skor. Crew menuliskan data secara manual jika sistem digital down. Data diinput kembali ke sistem setelah masalah teknis teratasi.',
    badge: 'Failsafe'
  },
  {
    id: 'kb_sop_15',
    category: 'SOP & Booth',
    title: 'Brief Klien: Cara Memonitor Skor Peserta Secara Real-Time',
    summary: 'Panduan singkat untuk tim marketing klien yang ingin memantau data event dari laptop mereka.',
    solution: 'Berikan akun viewer (read-only) ke URL dashboard Agenze. Klien dapat membuka dashboard di laptop/smartphone mereka untuk melihat skor terbaru dan statistik real-time tanpa perlu akses admin CMS.',
    badge: 'Client Facing'
  },
  {
    id: 'kb_sop_16',
    category: 'SOP & Booth',
    title: 'SOP Penutupan Booth dan Pengamanan Data End-of-Day',
    summary: 'Langkah-langkah aman menutup booth setelah event berakhir.',
    solution: '1) Ekspor seluruh data leaderboard ke CSV dan kirim ke email klien. 2) Screenshot papan skor akhir. 3) Matikan game via tombol admin. 4) Backup data ke cloud. 5) Cabut semua perangkat dari listrik.',
    badge: 'End-of-Day'
  },
  {
    id: 'kb_sop_17',
    category: 'SOP & Booth',
    title: 'Pengelolaan Hadiah dan Voucher Fisik vs Digital',
    summary: 'Strategi distribusi hadiah yang efisien tanpa antrean panjang di kasir.',
    solution: 'Hadiah digital (voucher QR code via WA) jauh lebih efisien dari hadiah fisik. Kirim kode voucher langsung ke WhatsApp pemain dalam 60 detik setelah skor dicatat. Untuk hadiah fisik, gunakan sistem nomor tiket.',
    badge: 'Hadiah'
  },
  {
    id: 'kb_sop_18',
    category: 'SOP & Booth',
    title: 'Konfigurasi Mode Incognito untuk Keamanan Data Pengunjung',
    summary: 'Mencegah kebocoran data nama/WA pengunjung sesi sebelumnya di browser.',
    solution: 'Jalankan Chrome dengan flag --incognito dan --disable-session-restore. Mode incognito memastikan cookie, cache, dan form autofill dikosongkan setiap kali browser restart. Ideal untuk booth publik yang digunakan bergantian.',
    badge: 'Privacy'
  },
  {
    id: 'kb_sop_19',
    category: 'SOP & Booth',
    title: 'Pengukuran Traffic Booth dengan Sensor Infrared People Counter',
    summary: 'Cara menghitung jumlah pengunjung yang mendekati booth secara akurat tanpa kamera.',
    solution: 'Pasang sensor infrared/PIR di pintu masuk area booth. Counter mencatat setiap orang yang melewati garis sensor. Bandingkan dengan jumlah sesi game dimulai untuk menghitung conversion rate.',
    badge: 'Analytics'
  },
  {
    id: 'kb_sop_20',
    category: 'SOP & Booth',
    title: 'Dokumentasi Foto dan Video Booth untuk Laporan Klien',
    summary: 'Konten dokumentasi standar yang wajib dikumpulkan selama dan setelah event.',
    solution: 'Wajib ambil: 1) Foto setup booth sebelum buka. 2) Foto/video momen pemain sedang bermain (ekspresi antusias). 3) Screenshot papan skor puncak. 4) Video time-lapse antrean jam sibuk.',
    badge: 'Dokumentasi'
  },
  {
    id: 'kb_sop_21',
    category: 'SOP & Booth',
    title: 'Penanganan Anak-Anak dan Lansia sebagai Pemain',
    summary: 'Penyesuaian gameplay dan instruksi untuk demografi yang kurang akrab dengan layar sentuh.',
    solution: 'Sederhanakan instruksi menjadi maksimal 3 kata/ikon. Perbesar tombol tap target minimal 80x80 piksel. Perpanjang durasi gameplay menjadi 60 detik. Crew aktif mendampingi pemain anak dan lansia.',
    badge: 'Inklusif'
  },
  {
    id: 'kb_sop_22',
    category: 'SOP & Booth',
    title: 'Protokol Keamanan Fisik Perangkat Kiosk di Venue Publik',
    summary: 'Mencegah pencurian atau sabotase perangkat kiosk di venue pameran terbuka.',
    solution: 'Kunci laptop ke meja kiosk dengan cable lock Kensington. Sembunyikan kabel daya di dalam rangka booth. Pasang stiker inventaris berisi nomor seri. Jangan tinggalkan booth tanpa pengawasan crew.',
    badge: 'Security'
  },
  {
    id: 'kb_brand_04',
    category: 'White-Label & Branding',
    title: 'Animasi Logo Intro pada Idle Screen',
    summary: 'Membuat logo klien muncul dengan animasi yang elegan untuk menarik perhatian pengunjung.',
    solution: 'Gunakan CSS keyframe animation: logoFloat dengan transform translateY(-10px) bolak-balik 2s infinite ease-in-out. Tambahkan efek shine/shimmer dengan CSS pseudo-element ::after dan background linear-gradient diagonal yang bergeser.',
    badge: 'Branding Motion'
  },
  {
    id: 'kb_brand_05',
    category: 'White-Label & Branding',
    title: 'Font Kustom Brand via Google Fonts atau CDN Self-Hosted',
    summary: 'Mencocokkan tipografi game dengan brand guidelines klien.',
    solution: 'Preload font dengan link rel=preload agar tidak flicker saat game dimulai. Self-host font dalam file .woff2 terkompresi di dalam ZIP game offline. CDN Google Fonts memerlukan internet; self-host lebih aman untuk venue offline.',
    badge: 'Typography'
  },
  {
    id: 'kb_brand_06',
    category: 'White-Label & Branding',
    title: 'Branding Suara: Jingle dan Sound Identity Klien',
    summary: 'Cara mengintegrasikan jingle brand klien sebagai BGM atau efek suara kemenangan.',
    solution: 'Konversi file jingle ke format MP3 128kbps dan base64 encode. Embed langsung ke dalam file HTML game sebagai data URI audio untuk memastikan dapat diputar saat offline. Durasi jingle ideal 15-30 detik dengan loop seamless.',
    badge: 'Audio Branding'
  },
  {
    id: 'kb_brand_07',
    category: 'White-Label & Branding',
    title: 'Customizable Costume Karakter Sesuai Maskot Brand',
    summary: 'Cara menyesuaikan karakter game dengan maskot klien tanpa keahlian desain grafis khusus.',
    solution: 'Gunakan karakter SVG modular: kepala, badan, dan aksesori sebagai layer terpisah yang dapat ditukar. Klien mengirimkan asset SVG maskot, dan sistem Agenze memposisikannya sebagai karakter pemain.',
    badge: 'Character Design'
  },
  {
    id: 'kb_brand_08',
    category: 'White-Label & Branding',
    title: 'Template Sertifikat Pemenang yang Dapat Dicetak',
    summary: 'Menghasilkan sertifikat bergambar dengan nama dan skor pemenang secara otomatis.',
    solution: 'Gunakan Canvas API untuk menggabungkan template sertifikat PNG, teks nama pemenang, skor, dan tanggal secara programatik. Ekspor sebagai PNG via canvas.toDataURL() dan tampilkan tombol Download Sertifikat.',
    badge: 'Deliverable'
  },
  {
    id: 'kb_brand_09',
    category: 'White-Label & Branding',
    title: 'Halaman Transisi Custom (Splash Screen Branded)',
    summary: 'Menampilkan loading screen berbranding sebelum game benar-benar dimuat.',
    solution: 'Buat div fullscreen berlayer paling atas (z-index: 99999) dengan animasi fade-in logo dan progress bar. Setelah semua aset selesai di-preload, perlahan fade-out splash screen via CSS transition opacity 0.5s.',
    badge: 'First Impression'
  },
  {
    id: 'kb_brand_10',
    category: 'White-Label & Branding',
    title: 'Animasi Partikel Bertemakan Brand (Logo Burst Effect)',
    summary: 'Membuat efek partikel ledakan berbentuk logo atau warna brand saat skor tinggi.',
    solution: 'Rasterize logo klien ke OffscreenCanvas kecil (64x64px). Sampel titik-titik piksel berwarna logo sebagai starting position partikel. Saat combo atau score milestone, semburkan 50-100 partikel dari posisi target.',
    badge: 'Wow Effect'
  },
  {
    id: 'kb_brand_11',
    category: 'White-Label & Branding',
    title: 'Pembuatan QR Code Dinamis di Layar Hasil Game',
    summary: 'Mengarahkan pemain ke landing page klien atau toko online setelah selesai bermain.',
    solution: 'Gunakan library qrcode.js untuk generate QR Code di canvas. Isi URL dengan UTM parameter utm_source=gamebooth untuk tracking traffic yang datang dari booth game.',
    badge: 'CTA Digital'
  },
  {
    id: 'kb_brand_12',
    category: 'White-Label & Branding',
    title: 'Social Sharing Frame: Foto Pemain + Skor + Logo Klien',
    summary: 'Membuat konten siap-posting Instagram dari hasil gameplay pemain.',
    solution: 'Capture frame game dengan html2canvas atau screenshot native. Overlay logo klien dan angka skor menggunakan Canvas compositing. Tambahkan frame dekoratif branded dan tombol Share ke IG Story.',
    badge: 'Viral Content'
  },
  {
    id: 'kb_brand_13',
    category: 'White-Label & Branding',
    title: 'Warna Adaptif Dark/Light Mode di Iframe Game',
    summary: 'Agar game tetap terlihat bagus meski dimuat dalam iframe di website klien tema terang.',
    solution: 'Deteksi preferensi warna dengan prefers-color-scheme media query dan window.matchMedia. Sesuaikan CSS root variable berdasarkan tema induk. Launcher Agenze juga dapat mengirim themeMode light atau dark via window.gameConfig.',
    badge: 'Adaptive UI'
  },
  {
    id: 'kb_brand_14',
    category: 'White-Label & Branding',
    title: 'Template Branded Email Hasil Event untuk Tim Marketing Klien',
    summary: 'Format email profesional untuk mengirimkan ringkasan data event ke klien.',
    solution: 'Generate email HTML menggunakan template Agenze (logo klien, grafik skor, statistik total pemain, Top 10 leaderboard). Ekspor sebagai .eml file atau kirim langsung via Firebase Email Extension.',
    badge: 'Client Report'
  },
  {
    id: 'kb_brand_15',
    category: 'White-Label & Branding',
    title: 'Panduan Brand Safety: Larangan Konten di Area Game',
    summary: 'Batasan konten yang tidak boleh ada dalam game untuk menjaga reputasi klien.',
    solution: 'Wajib hindari: gambar/teks berbau SARA, konten kekerasan grafis, referensi kompetitor, dan suara efek yang mengganggu. Gunakan tone visual yang positif, inklusif, dan sesuai dengan usia semua pengunjung.',
    badge: 'Brand Safety'
  },
  {
    id: 'kb_brand_16',
    category: 'White-Label & Branding',
    title: 'Penggunaan CSS Custom Properties untuk Dynamic Theming',
    summary: 'Menerapkan warna, font, dan border radius dari window.gameConfig ke seluruh UI game.',
    solution: 'Definisikan semua nilai visual sebagai CSS custom property dan set via document.documentElement.style.setProperty. Gunakan var(--theme-color) di seluruh CSS game. Perubahan tema terjadi instantaneous tanpa reload.',
    badge: 'CSS Engineering'
  },
  {
    id: 'kb_brand_17',
    category: 'White-Label & Branding',
    title: 'Naming Convention Slug Game untuk URL yang Bersih',
    summary: 'Standar penamaan URL game agar terlihat profesional dan SEO-friendly di URL bar.',
    solution: 'Slug wajib: huruf kecil semua, pisahkan kata dengan tanda hubung, tanpa spasi atau karakter khusus. Contoh: whack-a-mole-bank-bni bukan Whack_A_Mole_2024. Slug juga digunakan sebagai nama folder di /public/engines/ untuk akses offline.',
    badge: 'URL Standard'
  },
  {
    id: 'kb_brand_18',
    category: 'White-Label & Branding',
    title: 'Perbedaan Logo Animasi SVG vs PNG Statis di Game',
    summary: 'Kapan menggunakan SVG animasi dan kapan PNG lebih aman untuk performa.',
    solution: 'SVG animasi lebih ringan dan scalable sempurna di semua resolusi, ideal untuk logo berbentuk ikon sederhana. PNG statis lebih aman untuk logo kompleks dengan gradasi warna yang rumit.',
    badge: 'Asset Format'
  },
  {
    id: 'kb_brand_19',
    category: 'White-Label & Branding',
    title: 'White-Label Domain Kustom untuk URL Game Klien',
    summary: 'Cara menjalankan game di URL branded klien sendiri (contoh: game.brandklien.com).',
    solution: 'Setup subdomain CNAME di DNS klien yang mengarah ke IP server Agenze. Pasang wildcard SSL certificate untuk domain *.domain-klien.com. Game akan dimuat dari subdomain branded tanpa menyebut domain Agenze di URL bar.',
    badge: 'Domain'
  },
  {
    id: 'kb_brand_20',
    category: 'White-Label & Branding',
    title: 'Panduan Pengiriman Asset Klien (Creative Brief Checklist)',
    summary: 'Daftar file yang perlu diminta dari tim marketing klien sebelum mulai produksi game.',
    solution: 'Kumpulkan: 1) Logo PNG transparan, 2) Warna HEX brand, 3) Gambar hero/background 1920x1080, 4) Font brand, 5) Jingle/soundtrack (MP3), 6) Teks headline dan tagline, 7) Kontak PIC event untuk koordinasi.',
    badge: 'Project Kick-off'
  },
  {
    id: 'kb_trouble_05',
    category: 'Troubleshooting & Darurat',
    title: 'Game Tidak Dimuat Saat Internet Venue Mati Tiba-tiba',
    summary: 'Memastikan game tetap berjalan meski koneksi internet terputus di tengah event.',
    solution: 'Selalu test game dalam mode offline (Airplane Mode) sebelum deploy. Semua aset game harus ada di dalam file HTML atau folder lokal. Gunakan Service Worker cache untuk game yang di-host di server lokal.',
    badge: 'Offline Safety'
  },
  {
    id: 'kb_trouble_06',
    category: 'Troubleshooting & Darurat',
    title: 'Skor Tidak Tersimpan Setelah Pemain Input Nama',
    summary: 'Debug penyebab data skor hilang setelah form pengisian nama disubmit.',
    solution: 'Pastikan fungsi saveScore() dipanggil SEBELUM navigasi ke screen-leaderboard dimulai. Gunakan await pada operasi IndexedDB atau localStorage. Tambahkan console.log setelah setiap langkah save untuk memetakan alur data.',
    badge: 'Data Bug'
  },
  {
    id: 'kb_trouble_07',
    category: 'Troubleshooting & Darurat',
    title: 'Layar Kiosk Berkedip (Screen Flickering) saat Gameplay',
    summary: 'Penyebab dan solusi layar berkedip hitam setiap beberapa detik saat gameplay.',
    solution: '1) Nonaktifkan adaptive brightness Windows. 2) Cek kabel HDMI: lepas dan pasang kembali. 3) Coba port HDMI yang berbeda. 4) Pastikan driver GPU diperbarui ke versi terbaru.',
    badge: 'Display Bug'
  },
  {
    id: 'kb_trouble_08',
    category: 'Troubleshooting & Darurat',
    title: 'Game Freeze / Crash setelah 30 Menit Bermain',
    summary: 'Mendeteksi memory leak yang menyebabkan tab browser crash setelah berjalan lama.',
    solution: 'Buka Chrome DevTools > Memory > Heap Snapshot. Jika heap terus bertambah setiap ronde, ada memory leak. Penyebab umum: event listener yang tidak di-remove saat screen berganti dan timer setInterval yang tidak di-clearInterval saat game over.',
    badge: 'Memory Leak'
  },
  {
    id: 'kb_trouble_09',
    category: 'Troubleshooting & Darurat',
    title: 'Layar Sentuh IR Frame Tidak Akurat Setelah Laptop Dipindah',
    summary: 'Kalibrasi ulang touchscreen yang melenceng setelah kiosk dipindahkan posisinya.',
    solution: 'IR Frame touchscreen kehilangan kalibrasi saat dilepas-pasang ke layar yang berbeda atau dipindah posisi. Lakukan kalibrasi ulang via Control Panel > Tablet PC Settings > Calibrate setiap kali melakukan perpindahan posisi kiosk.',
    badge: 'Touch Calibration'
  },
  {
    id: 'kb_trouble_10',
    category: 'Troubleshooting & Darurat',
    title: 'Suara Game Keluar dari Speaker Salah (Laptop bukan TV)',
    summary: 'Memastikan output audio diarahkan ke speaker TV yang terhubung via HDMI.',
    solution: 'Klik kanan ikon speaker di taskbar Windows > Sound Settings > Output Device: pilih nama TV/monitor via HDMI. Jika TV tidak muncul, coba cabut dan pasang kembali kabel HDMI, lalu refresh audio device di Settings.',
    badge: 'Audio Output'
  },
  {
    id: 'kb_trouble_11',
    category: 'Troubleshooting & Darurat',
    title: 'Firebase QUOTA_EXCEEDED Error saat Puncak Traffic Event',
    summary: 'Firestore atau Realtime Database mencapai batas quota saat banyak kiosk aktif bersamaan.',
    solution: 'Upgrade Firestore plan ke Blaze (pay-as-you-go) sebelum event besar. Implementasi client-side batching: kumpulkan update skor setiap 5 detik dalam satu batch write alih-alih menulis setiap sentuhan. Gunakan Firebase Performance Monitoring.',
    badge: 'Cloud Ops'
  },
  {
    id: 'kb_trouble_12',
    category: 'Troubleshooting & Darurat',
    title: 'Game Berjalan Normal di Desktop tapi Salah Tata Letak di Mobile',
    summary: 'Elemen UI game yang responsif tetapi menjadi berantakan di viewport smartphone.',
    solution: 'Gunakan unit vw/vh untuk ukuran elemen, bukan px mutlak. Selalu test game di landscape dan portrait menggunakan Chrome DevTools Device Emulation sebelum deploy. Tambahkan orientationchange event listener untuk re-render game.',
    badge: 'Responsif'
  },
  {
    id: 'kb_trouble_13',
    category: 'Troubleshooting & Darurat',
    title: 'Gambar Cloudinary Tidak Muncul (403 Forbidden atau CORS Error)',
    summary: 'Aset gambar logo klien gagal dimuat karena masalah CORS atau URL kadaluarsa.',
    solution: 'Pastikan Cloudinary Cloud Name dan API Key sudah benar. Atur CORS policy di Cloudinary Dashboard: Allowed Origins, tambahkan domain aplikasi Anda. Periksa apakah URL asset masih valid (plan Free menghapus asset tidak diakses lebih dari 30 hari).',
    badge: 'CORS'
  },
  {
    id: 'kb_trouble_14',
    category: 'Troubleshooting & Darurat',
    title: 'Koneksi Firebase Putus Berulang kali di Venue Event',
    summary: 'Menangani kondisi jaringan tidak stabil di venue dengan sinyal WiFi lemah.',
    solution: 'Aktifkan Firebase offline persistence: enableIndexedDbPersistence(db). Data akan disinkronkan saat koneksi kembali. Di kondisi offline, operasi write tersimpan di antrian lokal dan tidak ada error yang ditampilkan ke pengguna.',
    badge: 'Offline Mode'
  },
  {
    id: 'kb_trouble_15',
    category: 'Troubleshooting & Darurat',
    title: 'Halaman CMS Admin Lambat Diload (Blank Screen Lama)',
    summary: 'Mengurangi waktu cold start CMS admin yang terasa lambat saat pertama kali dibuka.',
    solution: 'Aktifkan Vite Code Splitting via React.lazy() untuk setiap halaman besar. Gunakan Chrome DevTools Coverage untuk menemukan JS yang tidak digunakan. Pasang prefetch link di head HTML untuk preload resource halaman berikutnya.',
    badge: 'CMS Performance'
  },
  {
    id: 'kb_trouble_16',
    category: 'Troubleshooting & Darurat',
    title: 'Pemain Tidak Bisa Input Nama (Keyboard Virtual Tidak Muncul)',
    summary: 'Keyboard on-screen tidak muncul di layar sentuh saat pemain mencoba mengetikkan nama.',
    solution: 'Pastikan elemen input memiliki type=text. Panggil inputElement.focus() dan inputElement.click() secara bersamaan saat screen result muncul. Untuk kiosk Windows, pastikan Touch Keyboard diaktifkan di Settings > Personalization.',
    badge: 'Input Bug'
  },
  {
    id: 'kb_trouble_17',
    category: 'Troubleshooting & Darurat',
    title: 'Gambar Hero Background Terlihat Pixelated / Buram',
    summary: 'Gambar latar belakang terlihat buram meski menggunakan resolusi tinggi.',
    solution: 'Masalah umum: CSS background-size: cover pada gambar yang rasio aspeknya tidak sesuai layar. Gunakan object-fit: cover pada elemen img jika gambar ditampilkan sebagai tag img, bukan background CSS. Set min-width 100% dan min-height 100%.',
    badge: 'Visual'
  },
  {
    id: 'kb_trouble_18',
    category: 'Troubleshooting & Darurat',
    title: 'Timer Game Berjalan Tidak Sinkron di Antara Tab',
    summary: 'Timer menjadi tidak akurat saat pengguna berpindah tab atau browser di-minimize.',
    solution: 'Gunakan Web Worker untuk menjalankan timer di thread terpisah yang tidak terpengaruh oleh throttling browser saat tab tidak aktif. Atau gunakan Page Visibility API untuk pause/resume game saat tab tersembunyi.',
    badge: 'Timer Bug'
  },
  {
    id: 'kb_trouble_19',
    category: 'Troubleshooting & Darurat',
    title: 'Error Maximum update depth exceeded di React CMS Admin',
    summary: 'Komponen React masuk ke infinite re-render loop dan menyebabkan crash.',
    solution: 'Periksa dependensi di useEffect: jika state yang di-set ada di dependency array, itu akan menyebabkan infinite loop. Gunakan useCallback untuk memoize fungsi dan useMemo untuk nilai computed. Tambahkan kondisi guard sebelum setState.',
    badge: 'React Bug'
  },
  {
    id: 'kb_trouble_20',
    category: 'Troubleshooting & Darurat',
    title: 'File ZIP Game Tidak Bisa Diekstrak (Archive Corrupt)',
    summary: 'Pemain atau teknisi gagal mengekstrak paket game offline yang sudah didownload.',
    solution: 'Gunakan JSZip dengan opsi compression DEFLATE dan compressionOptions level 6 (bukan level 9 yang rawan corrupt). Setelah generate ZIP, lakukan validasi: baca kembali file ZIP dan verifikasi CRC checksum sebelum menampilkan link download.',
    badge: 'ZIP Export'
  },
  {
    id: 'kb_trouble_21',
    category: 'Troubleshooting & Darurat',
    title: 'Popup Perizinan Kamera Muncul Berulang di Setiap Sesi',
    summary: 'Browser selalu meminta izin kamera setiap kali game dimuat ulang.',
    solution: 'Di Chrome, izin kamera berlaku saat ini saja jika game diakses via HTTP (bukan HTTPS). Gunakan HTTPS atau localhost agar izin kamera dapat disimpan secara permanen. Atau gunakan Chrome kiosk mode yang melewati semua prompt izin.',
    badge: 'Permission'
  },
  {
    id: 'kb_trouble_22',
    category: 'Troubleshooting & Darurat',
    title: 'Data Dummy Game Muncul Lagi Setelah Dihapus',
    summary: 'Game sample yang sudah dihapus kembali muncul sendiri di daftar CMS.',
    solution: 'Ini terjadi karena auto-seed data berjalan otomatis saat database kosong. Di Agenze, seed data hanya dipanggil secara manual via tombol Database Seed di header CMS. Hapus seluruh game sample terlebih dahulu, maka data dummy tidak akan muncul lagi otomatis.',
    badge: 'Data Bug'
  },
  {
    id: 'kb_psy_04',
    category: 'Engagement & Psikologi',
    title: 'Prinsip Jumlah Pilihan Paradoks (Paradox of Choice) dalam Game Design',
    summary: 'Mengapa game dengan 1 tombol tap lebih populer di event daripada game kompleks?',
    solution: 'Semakin banyak kontrol dan keputusan yang harus diambil pemain, semakin besar kemungkinan mereka menyerah. Di booth event, batasi interaksi maksimal 2 jenis kontrol. Kemudahan bermain berarti lebih banyak peserta dan lebih banyak data lead yang terkumpul.',
    badge: 'UX Psychology'
  },
  {
    id: 'kb_psy_05',
    category: 'Engagement & Psikologi',
    title: 'Teknik Variable Reward untuk Meningkatkan Replay Rate',
    summary: 'Mengapa pemain mau mencoba lagi berulang kali meski sudah kalah?',
    solution: 'Implementasi near miss mechanics: sesekali tampilkan skor yang sangat dekat dengan threshold menang (misal 980 dari target 1000). Otak manusia merespons near miss dengan dorongan kuat untuk mencoba lagi. Ini meningkatkan total sesi permainan 3-5x lebih banyak.',
    badge: 'Behavioral'
  },
  {
    id: 'kb_psy_06',
    category: 'Engagement & Psikologi',
    title: 'Efek Endowment: Hadiah yang Hampir Diraih sebagai Motivator',
    summary: 'Memanfaatkan psikologi kepemilikan untuk mendorong pemain bermain lebih giat.',
    solution: 'Tampilkan gambar hadiah fisik yang menarik SEBELUM game dimulai di Layar Peraturan. Visualisasi hadiah yang sudah seolah dimiliki mendorong pemain bermain lebih serius untuk tidak kehilangan hadiah tersebut.',
    badge: 'Psychology'
  },
  {
    id: 'kb_psy_07',
    category: 'Engagement & Psikologi',
    title: 'Social Proof: Menampilkan Jumlah Peserta Real-Time',
    summary: 'Meningkatkan kepercayaan dan antusiasme dengan menampilkan partisipasi massal.',
    solution: 'Tampilkan counter X orang sudah bermain hari ini di Idle Screen. Gunakan angka real-time dari Firebase. Ketika pengunjung baru melihat ratusan peserta, mereka cenderung ikut bergabung karena efek bandwagon.',
    badge: 'Social'
  },
  {
    id: 'kb_psy_08',
    category: 'Engagement & Psikologi',
    title: 'Countdown Timer yang Terlihat: Urgensi dan Fokus Pemain',
    summary: 'Dampak psikologis timer visibel terhadap performa dan pengalaman pemain.',
    solution: 'Timer yang terlihat besar menciptakan urgensi yang meningkatkan fokus dan adrenalin pemain. Ubah warna timer menjadi oranye saat tersisa 10 detik dan merah saat 5 detik. Tambahkan sound tick setiap detik untuk memperkuat urgensi.',
    badge: 'UX Design'
  },
  {
    id: 'kb_psy_09',
    category: 'Engagement & Psikologi',
    title: 'Micro-Celebration: Efek Ledakan Kecil Setiap Skor Bertambah',
    summary: 'Mengapa feedback visual sesaat setelah aksi berhasil sangat penting untuk retensi pemain.',
    solution: 'Setiap kali skor bertambah, tampilkan +100 floating text yang naik dan fade-out, dikombinasikan dengan efek partikel singkat. Feedback micro-celebration ini memicu dopamine release di otak pemain dan membuat mereka ingin terus mengulangi aksi berhasil.',
    badge: 'Dopamine Loop'
  },
  {
    id: 'kb_psy_10',
    category: 'Engagement & Psikologi',
    title: 'Personalisasi Pengalaman: Nama Pemain di Tengah Gameplay',
    summary: 'Efek positif menampilkan nama pemain di dalam game setelah input di awal.',
    solution: 'Tampilkan Semangat, [NAMA PEMAIN]! di sudut layar saat gameplay berlangsung setelah pemain menginput nama. Personalisasi sederhana ini meningkatkan rasa keterikatan emosional dengan brand dan momen bermain secara signifikan.',
    badge: 'Personalisasi'
  }
];

// Helper: Filter Ensiklopedia berdasarkan kata kunci dan kategori
export const searchKnowledgeBase = (query: string, category: string = 'all'): KnowledgeItem[] => {
  let list = GAME_STUDIO_KNOWLEDGE_BASE;
  if (category !== 'all') {
    list = list.filter(k => k.category.toLowerCase() === category.toLowerCase());
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(k => 
      k.title.toLowerCase().includes(q) ||
      k.summary.toLowerCase().includes(q) ||
      k.solution.toLowerCase().includes(q) ||
      k.badge.toLowerCase().includes(q)
    );
  }
  return list;
};
