Tolong buatkan fitur aplikasi untuk Agency OS bernama "Photobooth".

# Detail Kebutuhan:
- Deskripsi: buatkan photobooth maker bisa dibranding setiap file branding bisa di dwonload client untuk dipakai offline saat terdownload file berupa html tidak terhubung dengan website dan internet berjalan nlocall full pakai kamera media yang terhubung
- Fitur Utama:
{
  "🛠️ CORE FEATURES (Online - Penciptaan & Konfigurasi Photobooth)": [
    {
      "name": "Generative AI-Powered Photobooth Designer",
      "description": "Modul inovatif ini memanfaatkan kecerdasan buatan (AI) terdepan untuk merevolusi proses desain photobooth. Pengguna dapat berinteraksi dengan AI melalui prompt teks cerdas untuk secara instan menghasilkan ide, tema, dan konfigurasi awal photobooth. AI akan memberikan respons streaming secara visual dan tekstual, mengubah imajinasi menjadi blueprint yang konkret.",
      "details": [
        "**Interaksi Prompt Teks Cerdas dengan Streaming Response UI:** Pengguna dapat memasukkan prompt deskriptif seperti 'Buatkan photobooth pernikahan bergaya rustic dengan bingkai kayu dan filter sepia', 'Desain photobooth korporat futuristik dengan branding hologram dan efek glitch', atau 'Sediakan photobooth ulang tahun anak-anak tema luar angkasa dengan stiker planet'. AI akan merespons secara real-time dengan saran desain, pemilihan aset (background, frame, overlay), palet warna, dan konfigurasi filter yang relevan. UI akan menampilkan visualisasi awal ide tersebut secara progresif, memungkinkan iterasi cepat.",
        "**'Preset Prompts' untuk Memulai Percakapan dengan Cepat:** Koleksi prompt yang telah dikurasi secara profesional untuk berbagai kategori acara dan gaya (misalnya, 'Pernikahan Elegan', 'Pesta Ulang Tahun Ceria', 'Peluncuran Produk Minimalis', 'Festival Musik Retro'). Ini mempercepat waktu mulai dan menginspirasi pengguna yang mungkin belum memiliki ide spesifik.",
        "**Manajemen Riwayat Obrolan AI (Bisa Disimpan & Dihapus):** Setiap sesi interaksi dengan AI akan disimpan sebagai riwayat percakapan yang lengkap, memungkinkan pengguna meninjau kembali iterasi desain, membandingkan opsi yang berbeda, atau melanjutkan percakapan dari titik tertentu. Riwayat dapat dihapus untuk menjaga privasi proyek.",
        "**Export Hasil AI ke File Markdown/PDF:** Ringkasan hasil interaksi AI dapat diekspor, mencakup deskripsi tema, daftar aset yang direkomendasikan, palet warna, dan bahkan mood board visual yang dihasilkan AI. Dokumen ini sangat berguna untuk presentasi klien, dokumentasi internal, atau sebagai panduan bagi desainer."
      ]
    },
    {
      "name": "Visual Editor WYSIWYG Intuitif (Post-AI/Manual)",
      "description": "Setelah atau tanpa interaksi AI, pengguna memiliki kontrol penuh untuk menyempurnakan atau membangun desain photobooth dari awal menggunakan editor visual drag-and-drop yang powerful, presisi, dan sangat responsif.",
      "details": [
        "**Kustomisasi Elemen Photobooth yang Komprehensif:** Kontrol granular atas latar belakang (gambar/video), bingkai (desain SVG/gambar kustom), overlay grafis (stiker, ikon, maskot), teks (font kustom, warna, posisi, efek), dan watermark. Semua elemen dapat diubah ukuran, diputar, dan diposisikan dengan presisi pixel.",
        "**Manajemen Aset Branding Lengkap:** Unggah logo klien, definisikan dan kelola palet warna merek, serta simpan aset visual spesifik klien dalam perpustakaan yang terpusat. Aset ini dapat dengan mudah diintegrasikan ke dalam desain photobooth.",
        "**Live Preview Interaktif Real-time:** Setiap perubahan yang dilakukan dalam editor akan langsung tercermin dalam tampilan pratinjau real-time yang mensimulasikan pengalaman pengguna akhir pada photobooth offline, memastikan WYSIWYG sejati."
      ]
    },
    {
      "name": "Pengaturan Alur & Pengalaman Pengguna Photobooth",
      "description": "Konfigurasi detail bagaimana photobooth akan beroperasi saat digunakan secara offline, mulai dari urutan pengambilan gambar, filter, hingga opsi unduh dan cetak.",
      "details": [
        "**Definisi Urutan & Durasi Sesi:** Atur jumlah foto yang akan diambil per sesi (misalnya, 3 atau 4 foto), durasi hitungan mundur sebelum setiap pengambilan, jeda antar pengambilan foto, dan durasi tampilan hasil akhir. Termasuk opsi untuk loop tanpa batas.",
        "**Manajemen Filter & Efek Real-time:** Pilihan filter bergaya Instagram (sepia, monochrome, vintage, retro-film, glow, black-light) dan efek interaktif (mirror, kaleidoscope, fisheye, distorsi) yang dapat diaplikasikan langsung pada pratinjau kamera atau pasca-pengambilan foto.",
        "**Dukungan Green Screen (Offline Module Capability):** Fitur canggih untuk menentukan warna kunci (chroma key) dan mengunggah gambar latar belakang kustom. Efek green screen ini akan berfungsi penuh dan tanpa kendala dalam modul offline, memungkinkan penggantian latar belakang dinamis.",
        "**Desainer Tata Letak Cetak Kustom:** Editor visual khusus untuk mengatur beberapa foto pada satu layout cetak, menambahkan header/footer kustom, menyertakan logo atau pesan branding, dan menentukan ukuran/orientasi kertas."
      ]
    },
    {
      "name": "Photobooth Module Packager & Export Ultra-Optimized",
      "description": "Fungsi inti untuk mentransformasi semua konfigurasi desain dan aset menjadi modul photobooth HTML yang mandiri, sangat optimal, dan siap untuk distribusi serta penggunaan offline oleh klien.",
      "details": [
        "**Dynamic HTML Generator Cerdas:** Membuat satu file HTML yang self-contained dan terkompresi. *Inovasi: Jika ukuran file melebihi ambang batas optimal, sistem akan secara cerdas menghasilkan sebuah folder berisi HTML utama dan sub-direktori aset yang dienkripsi/diobatfuscate, menjaga kemudahan distribusi namun tetap 'offline-ready' dan cepat di-load.*",
        "**Asset Bundling & Minifikasi Agresif:** Semua aset (gambar, font kustom, audio, video kecil, CSS, JavaScript) akan di-bundle, di-minifikasi (uji coba menggunakan terser/esbuild), dan di-embed langsung ke dalam file HTML (Base64 atau inline `<style>/<script>`) atau disimpan dalam folder terstruktur yang diacu secara relatif. Tujuan adalah `zero external dependency` dan performa kilat.",
        "**Kamera API (Offline) & WebRTC Integrasi:** Implementasi JavaScript tingkat rendah yang canggih menggunakan `navigator.mediaDevices.getUserMedia()` dan API WebRTC di dalam file HTML yang dihasilkan untuk akses kamera lokal penuh, mendukung berbagai resolusi dan frame rate tanpa koneksi internet.",
        "**Penyimpanan Lokal Persisten (Offline):** Memanfaatkan IndexedDB atau LocalStorage di dalam file HTML untuk menyimpan foto-foto yang diambil secara sementara, riwayat sesi, dan bahkan preferensi pengguna. Ini menjamin ketahanan data bahkan jika browser ditutup tiba-tiba.",
        "**Opsi Unduh/Cetak Inklusif (Offline):** Tombol yang jelas dan intuitif di dalam UI photobooth offline untuk mengunduh foto individual, kolase final, atau memicu dialog cetak sistem lokal. Tersedia opsi berbagi via QR code yang mengunduh file langsung ke perangkat lain di jaringan lokal (jika ada).",
        "**Zero-Dependency Runtime & Self-Healing:** Modul yang dihasilkan dijamin tidak memerlukan koneksi internet, server backend, atau instalasi tambahan apa pun. Kode dirancang untuk stabilitas maksimal di berbagai browser modern dan menangani potensi error media secara graceful."
      ]
    }
  ],
  "🔒 AUTH & SECURITY (Online - Platform Agency OS)": [
    {
      "name": "Role-Based Access Control (RBAC) Canggih",
      "description": "Sistem otentikasi dan otorisasi yang sangat kuat untuk memastikan setiap pengguna hanya dapat mengakses fungsionalitas dan data yang sesuai dengan peran mereka, menjaga integritas dan keamanan proyek.",
      "details": [
        "**Peran Dinamis & Kustom:** Mendukung peran seperti Administrator (akses penuh), Designer (akses pembuatan/edit photobooth, pengelolaan aset), Project Manager (melihat progres, mengelola klien), dan Client (hanya bisa melihat/mengunduh modul photobooth mereka). Kemampuan untuk membuat peran kustom dengan hak akses spesifik.",
        "**Manajemen Hak Akses Granular:** Kontrol spesifik dan berlapis atas siapa yang dapat membuat proyek, mengedit aset, mengunduh modul, melihat riwayat AI, atau mengelola akun klien."
      ]
    },
    {
      "name": "Portal Klien Aman & Branded",
      "description": "Menyediakan pengalaman premium dan aman bagi klien untuk mengakses, meninjau, dan mengunduh modul photobooth mereka dengan branding agensi yang konsisten.",
      "details": [
        "**Akses Klien Self-Service:** Portal web yang dapat disesuaikan dengan branding agensi (logo, warna, domain kustom) memungkinkan klien melihat, meninjau preview, dan mengunduh modul photobooth mereka sendiri dengan aman setelah otentikasi.",
        "**Unique, Time-Limited Download Link Generation:** Setiap modul photobooth yang siap diunduh akan memiliki URL unik yang aman, dilengkapi dengan otentikasi token, dan dapat diatur masa berlakunya untuk meningkatkan keamanan."
      ]
    }
  ],
  "📦 DATABASE & STATE (Online - Platform Agency OS)": [
    {
      "name": "Manajemen Proyek Photobooth Lengkap & Versatile",
      "description": "Basis data terstruktur dan scalable untuk menyimpan semua informasi terkait proyek photobooth, dari konfigurasi detail hingga aset media dan riwayat AI.",
      "details": [
        "**Tabel/Koleksi `Projects`:** Menyimpan metadata inti proyek (nama, klien, status, tanggal pembuatan/modifikasi, ID desainer, dll.), referensi ke konfigurasi desain aktif, dan daftar versi modul yang dihasilkan.",
        "**Tabel/Koleksi `Configurations`:** Detail pengaturan spesifik photobooth dalam format JSON/JSONB (jumlah foto, durasi countdown, filter yang dipilih, layout cetak, green screen settings, dll.), memungkinkan fleksibilitas tinggi.",
        "**Tabel/Koleksi `Assets`:** Pengelolaan aset grafis (logo, bingkai, background, font kustom, stiker) per klien atau sebagai aset global yang dapat digunakan ulang. Menyimpan URL penyimpanan cloud, metadata (ukuran, jenis, tag), dan riwayat penggunaan.",
        "**Tabel/Koleksi `AI_Chats`:** Riwayat lengkap interaksi AI untuk setiap proyek, termasuk prompt pengguna, respons AI (teks & potensi referensi aset), dan timestamp, memungkinkan penelusuran kembali alur kreatif."
      ]
    },
    {
      "name": "Manajemen Pengguna & Klien Berbasis Relasi",
      "description": "Penyimpanan data pengguna platform dan klien dengan relasi yang jelas untuk mendukung fungsionalitas RBAC, pelacakan proyek, dan pelaporan.",
      "details": [
        "**Tabel/Koleksi `Users`:** Data pengguna platform (UID unik, email, hash password, salt, peran, ID klien terkait jika pengguna adalah klien), otentikasi dua faktor status.",
        "**Tabel/Koleksi `Clients`:** Informasi detail klien (ID unik, nama perusahaan, kontak utama, email, branding default yang terkait, daftar proyek aktif)."
      ]
    }
  ],
  "🎨 ADVANCED VISUALS (Online UI & Offline Runtime)": [
    {
      "name": "Efek 'Typing Simulator' yang Halus & Responsif",
      "description": "Implementasi efek ketik teks yang elegan dan realistis untuk respons AI, meningkatkan persepsi interaksi dan kecerdasan, bukan sekadar menampilkan blok teks.",
      "details": [
        "**Per-karakter Streaming dengan Humanized Delay:** Respons AI ditampilkan secara progresif, satu karakter atau satu kata demi satu, dengan kecepatan yang dapat disesuaikan. *Inovasi: Animasi sedikit 'lag' yang disimulasikan secara acak untuk menciptakan kesan AI yang 'berpikir' dan memproses, bukan hanya menampilkan teks instan.*",
        "**Cursor Animasi Dinamis:** Indikator kursor yang berkedip di akhir teks yang sedang diketik, serupa dengan pengalaman di terminal modern atau AI chat bot kelas dunia, memberikan umpan balik visual yang konstan."
      ]
    },
    {
      "name": "Micro-animations & Transisi Dinamis Memukau",
      "description": "Penggunaan animasi mikro dan transisi yang kaya untuk meningkatkan pengalaman pengguna, memberikan umpan balik visual yang instan, dan membuat interaksi terasa lebih hidup dan intuitif, baik di modul online maupun di photobooth offline.",
      "details": [
        "**Online Module UI:** Transisi antar halaman yang mulus dan bermakna, animasi saat drag-and-drop elemen (misalnya, scaling, bayangan), efek hover yang responsif pada tombol dan kartu, indikator loading yang estetis, animasi modal dan notifikasi yang muncul/hilang dengan anggun.",
        "**Offline Photobooth Runtime UX:** Animasi hitungan mundur yang menarik dan penuh energi, efek visual saat foto diambil (flash virtual, efek shutter, transisi cepat antara frame), animasi saat filter diterapkan, dan transisi antar layar (misal, dari mode capture ke preview, atau ke opsi unduh/cetak) yang memberikan kesan profesional."
      ]
    },
    {
      "name": "Desain Responsif & Adaptif Multi-Platform",
      "description": "Memastikan antarmuka pengguna platform online dan modul photobooth offline dapat berfungsi optimal, terlihat indah, dan sangat responsif di berbagai ukuran layar dan jenis perangkat, dari desktop hingga tablet dan mobile.",
      "details": [
        "**Online UI (Mobile-First Approach):** Menggunakan layout grid yang fleksibel, breakpoint yang jelas, dan komponen yang dapat menyesuaikan diri secara cerdas untuk desktop, tablet, dan mobile. Prioritas pada pengalaman sentuh yang intuitif.",
        "**Offline Module (Cross-Device Compatibility):** UI yang dioptimalkan secara ketat untuk mode landscape dan portrait, memastikan semua tombol, area pratinjau kamera, dan hasil foto tetap berfungsi dan terlihat jelas di perangkat apa pun yang mendukung browser modern."
      ]
    },
    {
      "name": "Estetika Desain Modern & Konsisten (Superpower)",
      "description": "Penerapan skema desain yang mutakhir dan terintegrasi untuk memberikan kesan premium, profesional, dan futuristik yang tak tertandingi.",
      "details": [
        "**Glassmorphism/Neumorphism-Inspired UI:** Elemen UI yang memberikan kedalaman dan efek semi-transparan (glassmorphism) atau timbul/cekung yang lembut (neumorphism) untuk panel, kartu, dan tombol. Ini menciptakan kesan modern, futuristik, namun tetap tangible dan mudah berinteraksi.",
        "**Dark Mode sebagai Default Premium:** Antarmuka default menggunakan skema warna gelap dengan kontras tinggi untuk mengurangi kelelahan mata, memberikan tampilan premium, dan menghemat daya pada layar OLED. Tersedia opsi toggle ke Light Mode yang elegan.",
        "**Palet Warna Aksonometrik & Aksen Vibrant:** Penggunaan warna aksen yang vibrant dan strategis (misalnya, electric blue, neon green, fuchsia) pada latar belakang yang lebih muted atau gelap untuk memandu fokus pengguna dan memberikan sentuhan energi tinggi."
      ]
    }
  ]
}
- Referensi / Tiru Fitur Dari: {"name":"Canva / Figma (Untuk Online Editor Experience)","description":"Platform desain grafis online yang menjadi standar industri untuk kemudahan penggunaan, kekuatan, dan estetika. Mereka berhasil mengubah proses desain menjadi sangat intuitif dan kolaboratif.","visual_architecture_insights":["**Visual:** Antarmuka 'Kanvas' tak terbatas dengan drag-and-drop yang presisi dan responsif, panel layer yang terorganisir rapi, perpustakaan aset terintegrasi yang kaya, dan pratinjau real-time yang akurat. Konsistensi desain sistem di seluruh elemen UI yang membuat pengalaman mulus.","**Arsitektur:** Desain komponen yang sangat modular dan dapat digunakan kembali (component-based architecture), pemuatan aset yang sangat efisien (lazy loading, caching), dan kemampuan rendering grafis yang dioptimalkan untuk performa tinggi di browser."]}
{"name":"LumaBooth / Simple Booth (Untuk Offline Photobooth Runtime Experience)","description":"Aplikasi photobooth profesional terkemuka yang populer untuk acara, dikenal karena UI-nya yang bersih, fungsionalitas offline yang kuat, dan pengalaman pengguna yang lancar dan menyenangkan.","visual_architecture_insights":["**Visual:** UI yang minimalis, bebas gangguan, dan fokus pada tujuan utama selama proses pengambilan foto. Hitungan mundur yang jelas dan menarik, tampilan foto instan yang memukau setelah pengambilan, dan opsi unduh/cetak yang sederhana dan mudah diakses. Fokus pada UX yang imersif dan menyenangkan bagi tamu acara.","**Arsitektur:** Penanganan stream kamera yang sangat efisien dan real-time langsung di browser (Canvas API, WebGL untuk efek), pemrosesan gambar (filter, overlay, green screen) secara client-side menggunakan WebAssembly atau Web Workers untuk performa maksimal, dan penggunaan robust IndexedDB untuk penyimpanan foto yang diambil secara persisten."]}
{"name":"ChatGPT Plus / Claude AI (Untuk AI Prompt Interaction)","description":"Sebagai referensi yang Anda sebutkan, ini adalah standar emas untuk interaksi AI generatif berbasis teks. Desain mereka telah membentuk ekspektasi pengguna terhadap AI chat yang modern dan intuitif.","visual_architecture_insights":["**Visual:** Respons teks yang di-streaming secara progresif dengan efek ketik yang halus, perbedaan visual yang jelas antara input pengguna dan output AI, UI chat bubble yang bersih dan mudah dibaca, serta indikator 'sedang berpikir' yang halus namun informatif.","**Arsitektur:** Panggilan API real-time yang dioptimalkan untuk streaming token (SSE - Server-Sent Events atau WebSockets), penanganan error yang tangguh dengan pesan yang jelas, dan manajemen riwayat percakapan yang efisien serta skalabel."]}
- Tampilan Client: Desktop Only
- Catatan Tambahan:
{
  "ui_ux_guidance": [
    "**Fokus pada 'Seamlessness & Zero Friction':** Pastikan setiap transisi, loading state, dan interaksi terasa mulus, cepat, dan responsif. Hilangkan 'jank' atau 'stuttering'. Tujuannya adalah membuat pengguna merasa 'flow' saat mendesain dan tamu merasa 'magis' saat menggunakan photobooth.",
    "**Prioritaskan 'Delightful Micro-interactions':** Setiap tombol, input field, atau notifikasi harus memberikan umpan balik visual atau haptik yang menyenangkan. Sentuhan kecil ini sangat membangun loyalitas dan persepsi kualitas premium.",
    "**Desain Modular & Konsisten Melalui Design System:** Gunakan Atomic Design atau sistem desain serupa untuk memastikan konsistensi visual dan fungsional di seluruh platform online dan modul offline yang dihasilkan. Komponen harus dapat dipahami dan digunakan ulang secara independen.",
    "**Accessibility (WCAG 2.1 AAA Compliance):** Pastikan semua elemen UI dapat diakses sepenuhnya oleh pengguna dengan disabilitas (kontras warna yang memadai, navigasi keyboard yang intuitif, deskripsi alt yang informatif untuk gambar, dukungan screen reader). Ini bukan opsional, melainkan standar kelas dunia.",
    "**User Flow Optimization & Storyboarding:** Petakan alur pengguna untuk 'Agency User' (saat mendesain online) dan 'Event Guest' (saat menggunakan photobooth offline) secara mendetail. Gunakan storyboarding untuk memvisualisasikan setiap langkah dan optimalkan setiap interaksi untuk efisiensi dan kepuasan maksimal."
  ],
  "design_schema": {
    "overall_theme": "Modern, Profesional, Inovatif, dengan estetika Futuristik Human-Centric.",
    "color_palette": "Dominan Dark Mode (gradien abu-abu tua, hitam pekat, deep indigo) sebagai dasar, dipadukan dengan warna aksen cerah dan vibran (biru elektrik, ungu neon, hijau mint, fuchsia) yang digunakan secara strategis untuk highlight interaktif, CTA, dan elemen penting. Tersedia opsi Light Mode dengan palet netral yang hangat dan kontras tinggi.",
    "typography": "Kombinasi font sans-serif modern dan bersih (misalnya: Inter, Poppins, Rubik) untuk teks body dan elemen UI, memastikan keterbacaan optimal. Untuk judul, logo, atau elemen branding yang menonjol, pertimbangkan font display yang unik namun tetap profesional. Konsistensi dalam ukuran, bobot, dan hirarki tipografi sangat krusial.",
    "visual_style": "Glassmorphism/Neumorphism sebagai gaya utama untuk memberikan kedalaman, dimensi, dan nuansa premium. Border-radius yang lembut dan konsisten untuk semua elemen (kartu, tombol, input fields) menciptakan kesan ramah, modern, dan canggih. Penggunaan bayangan lembut dan gradien halus untuk menambah kedalaman tanpa mengganggu."
  },
  "animation_transitions": {
    "frameworks_recommendation": [
      "**Framer Motion / Lottie:** Sangat direkomendasikan untuk animasi UI yang kompleks, transisi halaman yang elegan, efek parallax yang memukau, dan animasi ilustrasi SVG/JSON yang kaya. Memungkinkan kontrol yang sangat kaya dan performa yang dioptimalkan secara hardware-accelerated.",
      "**CSS Keyframes / Transitions:** Digunakan untuk animasi mikro yang lebih sederhana seperti hover state tombol, loading spinner, tooltip, efek focus, dan feedback visual cepat. Ringan, cepat, dan mudah diimplementasikan untuk detail-detail kecil."
    ],
    "principles": "Animasi harus memiliki tujuan yang jelas – memberikan umpan balik, memandu perhatian pengguna, atau meningkatkan estetika. Hindari animasi yang berlebihan, lambat, atau mengganggu. Prioritaskan performa 60fps untuk semua animasi agar terasa mulus dan responsif."
  },
  "database_schema_recommendation": {
    "preferred_technologies": [
      "**Online Platform (Backend):** Firebase Firestore (untuk kecepatan pengembangan, skalabilitas real-time, dan integrasi mudah dengan layanan AI dan cloud functions) ATAU PostgreSQL (untuk skema relasional yang sangat kuat, kompleksitas query, dan kontrol data yang lebih tinggi, cocok untuk data agensi yang terstruktur). Pilihan tergantung pada prioritas kecepatan vs. kontrol.",
      "**Offline Module (Frontend Client-Side):** IndexedDB (untuk penyimpanan data foto sementara yang terstruktur dan persisten di sisi klien, menangani objek besar seperti blob gambar) ATAU LocalStorage (untuk konfigurasi ringan dan preferensi pengguna yang tidak kritis)."
    ],
    "key_tables_collections_sql_firebase": [
      "`users` (UID, email, password_hash, role, client_id, two_factor_status, created_at, last_login, ...) - PostgreSQL / Firebase Collection",
      "`clients` (client_id, name, contact_email, phone, address, brand_defaults_json, created_at, ...) - PostgreSQL / Firebase Collection",
      "`projects` (project_id, client_id, name, status, created_by_user_id, assigned_designer_id, created_at, last_modified_at, current_config_id, ...) - PostgreSQL / Firebase Collection",
      "`configurations` (config_id, project_id, version, settings_jsonb, created_at, ...) - PostgreSQL / Firebase Collection (JSONB type in PG for flexible schema)",
      "`assets` (asset_id, client_id, project_id, type, name, url, thumbnail_url, metadata_json, created_at, ...) - PostgreSQL / Firebase Collection (dengan Cloud Storage integration)",
      "`ai_chats` (chat_id, project_id, user_prompt_text, ai_response_text, timestamp, feedback_rating, ...) - PostgreSQL / Firebase Collection",
      "`generated_modules` (module_id, project_id, version, download_url, file_size_bytes, generated_at, ...) - PostgreSQL / Firebase Collection"
    ]
  },
  "performance_optimization_tricks": [
    "**Lazy Loading Agresif:** Terapkan lazy loading untuk komponen UI, gambar, video, dan bahkan JavaScript/CSS yang tidak langsung terlihat atau diperlukan. Gunakan `Intersection Observer API` dan `dynamic imports`.",
    "**Web Workers untuk Heavy Lifting:** Manfaatkan Web Workers secara ekstensif untuk tugas-tugas berat di modul offline, seperti kompresi gambar, penerapan filter kompleks, rendering kolase beresolusi tinggi sebelum unduh/cetak, atau green screen processing, agar thread UI tetap responsif.",
    "**Optimalisasi Ukuran Bundle (Offline Module Kritikal):** Gunakan tools seperti Webpack/Rollup dengan konfigurasi maksimal untuk tree-shaking, minifikasi JavaScript/CSS, dead code elimination, dan kompresi aset (WebP/AVIF untuk gambar, WOFF2 untuk font). Targetkan ukuran bundle sekecil mungkin agar loading instan.",
    "**CDN Global & Image Optimization Lanjutan:** Untuk platform online, gunakan Content Delivery Network (CDN) global untuk melayani aset statis secara optimal. Otomatisasi konversi gambar yang diunggah ke format WebP atau AVIF modern, serta penyesuaian resolusi berdasarkan perangkat pengguna melalui `srcset`.",
    "**Manajemen Kamera Efisien & Hemat Energi:** Di modul offline, pastikan `navigator.mediaDevices.getUserMedia()` hanya aktif dan mengambil stream saat benar-benar diperlukan. Segera lepaskan track media (`stream.getTracks().forEach(track => track.stop())`) saat photobooth tidak dalam mode pengambilan untuk menghemat sumber daya CPU/GPU dan daya baterai perangkat."
  ]
}

Folder tujuan (target) adalah `src/apps/Photobooth`.
PENTING: JANGAN RE-GENERATE SELURUH KODE APLIKASI UTAMA. Fokus HANYA pada pengeditan file di dalam folder `src/apps/Photobooth/`.

# Aturan Sistem CMS (WAJIB DIIKUTI):
# PANDUAN PENTING UNTUK AI (WAJIB DIBACA SEBELUM MENULIS KODE)

Kamu sedang membuat aplikasi/ekstensi kustom untuk **Agency OS**. 
Template ini sudah berstatus **PAKET LENGKAP** dengan struktur file modular.
Sistem secara otomatis telah memiliki pembagian file berikut:
- `index.jsx` (Wadah utama navigasi - JANGAN DIUBAH)
- `components/ClientView.jsx` (Tampilan untuk klien/publik)
- `components/AdminView.jsx` (Tampilan untuk pengelola/CMS)
- `styles.css` (Tempat menaruh CSS kustom aplikasi)

## ATURAN KODING & DESAIN UI/UX:
1. **FOKUS PADA KOMPONEN**: Kamu **HANYA** perlu men-develop dan mengisi kode pada file `components/ClientView.jsx` dan `components/AdminView.jsx`, serta gaya di `styles.css` jika dibutuhkan. JANGAN ubah `index.jsx`.
2. **Desain Terpadu (Satu Tema)**: Gunakan class bawaan sistem dan variabel warna agar menyatu dengan baik.
   - Background utama panel: `var(--cms-bg)` atau `var(--cms-switcher-bg)`
   - Kotak/Card elemen: Pakai `className="cms-card premium-glass"`
   - Warna aksen/utama tombol: `var(--cms-accent)`
   - Warna Teks: `var(--cms-text)` dan `var(--cms-text-muted)`
   - Border efek glass: `1px solid var(--glass-border)`
3. **Bentuk "Pill Rounded"**: Jangan buat UI yang kaku kotak! 
   - Sudut untuk kotak/card: `borderRadius: 30` (atau 24).
   - Sudut untuk tombol/input: `borderRadius: 99` (full pill) atau `borderRadius: 30`.
4. **Responsif Sepenuhnya**: Layout harus menyesuaikan diri (fleksibel). Gunakan `display: flex`, `flexWrap: wrap`, atau CSS Grid.
5. **Gunakan Ikon Lucide**: Semua ikon wajib diambil dari `lucide-react` (Misalnya `<Plus />`, `<Settings />`, dll).
6. **Fungsionalitas State (Hooks)**: Buat variabel data simulasi memakai `useState` di dalam komponen Admin/Client. Berikan simulasi CRUD sederhana jika aplikasi menuntut pengelolaan data.

**TUGASMU:**
Bangun fitur yang diminta oleh USER. Pahami struktur folder yang sudah ada, lalu tuliskan kode pengembangan HANYA untuk file `components/ClientView.jsx`, `components/AdminView.jsx`, dan `styles.css`. Jangan merusak kerangka utama yang sudah tertata dengan rapi!
