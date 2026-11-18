import React from 'react';
import { 
  Globe, FolderGit2, UserCheck, LayoutGrid, ShoppingBag, BookOpen, Link2, 
  Lock, Sparkles, Upload, MousePointerClick, Layers, CreditCard, FileText, 
  CheckCircle2, MessageSquare, Radio, Database, Building2, Activity, 
  ShieldCheck, Flame, Users, Settings, Sun, Award, Zap,
  ShoppingCart, Heart, Camera, PartyPopper, ClipboardList, Share2, Compass,
  ZoomIn, Copy, QrCode
} from 'lucide-react';

export interface GuidelineItem {
  id: string;
  name: string;
  type: 'public' | 'admin' | 'core';
  categoryGroup?: 'public' | 'ops' | 'client' | 'system';
  route: string;
  badge: string;
  icon: React.ReactNode;
  summary: string;
  features: string[];
  tips: string;
}

export interface WorkflowItem {
  id: string;
  title: string;
  badge: string;
  sourceModule: string;
  targetModule: string;
  icon: React.ReactNode;
  summary: string;
  steps: string[];
  benefits: string;
}

export interface ClientTipItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge: string;
  desc: string;
  step: string;
}

export const GUIDELINE_DATA: GuidelineItem[] = [
  // ── SISI WEBSITE PUBLIK (CLIENT-FACING) ──
  {
    id: 'pub-home',
    name: 'Beranda Utama (Landing Page)',
    type: 'public',
    route: '/',
    badge: 'Website Publik',
    icon: <Globe size={20} color="#38bdf8" />,
    summary: 'Etalase utama studio kreatif dengan hero section interaktif, highlight karya unggulan, ringkasan profil, alur kerja, dan preview jurnal.',
    features: [
      'Hero Section interaktif dengan tombol Call-To-Action langsung ke kontak',
      'Etalase karya portofolio pilihan utama (Featured Showcase)',
      'Profil studio ringkas, jam terbang, dan statistik pencapaian',
      'Alur kerja (Workflow) 4 tahap dari brief hingga serah terima aset',
      'Pratinjau artikel jurnal terbaru dan testimoni klien terverifikasi',
      'Widget Live Chat terintegrasi di pojok kanan bawah untuk konsultasi kilat'
    ],
    tips: 'Halaman ini dapat dikustomisasi secara visual tanpa koding melalui Admin Website Studio (/admin/visual-editor).'
  },
  {
    id: 'pub-portfolio',
    name: 'Portofolio & Studi Kasus',
    type: 'public',
    route: '/portfolio',
    badge: 'Karya Klien',
    icon: <FolderGit2 size={20} color="#8b5cf6" />,
    summary: 'Galeri lengkap seluruh karya desain visual, identitas brand, kemasan, dan media digital dengan penyaringan kategori dan pencarian instan.',
    features: [
      'Filter kategori proyek (Branding, Web, Kemasan, Event, dll) secara instan',
      'Pencarian cerdas judul karya, nama klien, atau kata kunci studi kasus',
      'Modal detail studi kasus layar penuh dengan galeri foto beresolusi tinggi',
      'Tampilan responsif multi-device (optimal di Mobile, Tablet, dan Desktop)',
      'Tautan pemesanan proyek serupa langsung via WhatsApp'
    ],
    tips: 'Karya yang ditambahkan dan ditandai di Admin Karya (/admin/portfolio) otomatis tampil di sini secara real-time.'
  },
  {
    id: 'pub-about',
    name: 'Tentang Studio & Biodata',
    type: 'public',
    route: '/about',
    badge: 'Profil Studio',
    icon: <UserCheck size={20} color="#10b981" />,
    summary: 'Profil identitas brand, filosofi desain, kisah studio, susunan tim, keahlian teknis, dan sertifikasi profesional.',
    features: [
      'Profil studio komprehensif atau persona profesional kreator',
      'Daftar software & teknologi yang dikuasai (Figma, Adobe Suite, React, dll)',
      'Statistik proyek selesai, kepuasan klien, dan rekam jejak industri',
      'Nilai-nilai studio dan filosofi estetika dalam setiap proyek desain',
      'Saluran media sosial resmi dan alamat studio'
    ],
    tips: 'Data biodata dan mode profil (Company vs Personal) dikelola di Pengaturan Admin Biodata.'
  },
  {
    id: 'pub-apps',
    name: 'Apps & Mini Game Studio',
    type: 'public',
    route: '/apps',
    badge: 'Playable Apps',
    icon: <LayoutGrid size={20} color="#ec4899" />,
    summary: 'Katalog interaktif aplikasi HTML5, mini games, dan interactive booth activations yang siap dimainkan langsung di peramban tanpa instalasi.',
    features: [
      'Etalase game interaktif HTML5 60FPS yang responsif di seluruh layar gawai',
      'Mode uji coba langsung (playable demo) langsung di peramban tanpa unduh',
      'Sistem lisensi aktivasi event khusus dengan kustomisasi logo & warna brand klien',
      'Filter kategori aplikasi (Corporate, Ramadhan, E-Sport, Trivia, Exhibition)',
      'Penyedia paket aktivasi pameran, booth mall, dan event korporat'
    ],
    tips: 'Rute baru resmi adalah /apps (rute lama /games otomatis dialihkan). Kelola katalog melalui Admin Apps Studio (/admin/apps).'
  },
  {
    id: 'pub-catalog',
    name: 'Katalog Produk & Jasa',
    type: 'public',
    route: '/katalog',
    badge: 'Etalase Layanan',
    icon: <ShoppingBag size={20} color="#f59e0b" />,
    summary: 'Katalog penawaran jasa desain, produk digital, template, dan paket komersial dengan rincian harga transparan dan pemesanan kilat.',
    features: [
      'Daftar paket jasa desain dan produk digital terstruktur rapi',
      'Rincian harga transparan, diskon harga coret, dan varian paket layanan',
      'Penyaringan berdasarkan kategori layanan desain grafis, website, maupun apps',
      'Integrasi checkout instan langsung terhubung ke WhatsApp Admin',
      'Dukungan kode voucher diskon promosi khusus klien',
      'Opsi pembayaran Transfer Bank (BCA, Mandiri) & QRIS 0% MDR dengan Kode Unik 3-digit anti-fraud'
    ],
    tips: 'Kelola harga, foto produk, diskon, dan ketersediaan di Admin Katalog (/admin/catalog).'
  },
  {
    id: 'pub-blog',
    name: 'Blog & Edukasi Visual',
    type: 'public',
    route: '/blog',
    badge: 'Jurnal & Tips',
    icon: <BookOpen size={20} color="#06b6d4" />,
    summary: 'Publikasi artikel wawasan desain, tips kreatif, tren industri visual, dan panduan praktis untuk para klien dan kreator.',
    features: [
      'Daftar artikel terorganisir per tag dan kategori topik desain',
      'Halaman baca artikel bersih bebas distraksi dengan gambar sampul jernih',
      'Estimasi waktu membaca dan tanggal rilis artikel',
      'Pencarian artikel cepat berdasarkan judul maupun kata kunci tagar',
      'Optimasi SEO on-page otomatis untuk visibilitas mesin pencari'
    ],
    tips: 'Tulis dan terbitkan artikel baru dengan dukungan AI Writer di Admin Artikel (/admin/blog).'
  },
  {
    id: 'pub-links',
    name: 'Bio Link Tree Engine',
    type: 'public',
    route: '/links',
    badge: 'Multi-Link Bio',
    icon: <Link2 size={20} color="#a855f7" />,
    summary: 'Halaman tautan bio serbaguna untuk media sosial dengan tata letak modern, kartu kontak kilat, dan tombol langsung ke portofolio.',
    features: [
      'Daftar link cepat ke WhatsApp, portofolio, katalog, dan media sosial',
      'Desain ramah perangkat seluler dengan animasi sentuh yang halus',
      'Kartu profil studio lengkap dengan avatar dan deskripsi singkat',
      'Statistik klik per tautan untuk memantau trafik dari Instagram/TikTok'
    ],
    tips: 'Kelola urutan dan ikon tautan di Admin Bio Links (/admin/links).'
  },
  {
    id: 'pub-client',
    name: 'Portal Akun Klien',
    type: 'public',
    route: '/client',
    badge: 'Area Klien',
    icon: <Lock size={20} color="#6366f1" />,
    summary: 'Ruang mandiri klien untuk mengakses status pengerjaan pesanan, mengunduh invoice resmi, dan menjalankan launcher lisensi event apps yang aktif.',
    features: [
      'Riwayat pesanan jasa dan layanan aktif yang sedang dikerjakan studio',
      'Akses launcher dan lisensi game event yang telah dibeli klien',
      'Autentikasi aman akun klien (login mandiri)',
      'Unduh faktur/invoice resmi dan salinan aset proyek'
    ],
    tips: 'Klien dapat mendaftar dan masuk secara mandiri melalui tombol Portal Klien di bilah navigasi.'
  },
  {
    id: 'pub-inquiry',
    name: 'Formulir Brief & Estimator Proyek',
    type: 'public',
    route: '/ (Modal Ajukan Brief)',
    badge: 'Brief Kilat',
    icon: <Sparkles size={20} color="#ec4899" />,
    summary: 'Formulir interaktif bagi calon klien untuk mengajukan visi desain, estimasi anggaran, tenggat waktu, dan moodboard referensi dalam 1 menit.',
    features: [
      'Pilihan layanan desain terarah (Brand Identity, UI/UX, Kemasan, Social Media Kit)',
      'Rentang anggaran realistis dan estimasi tenggat waktu pengerjaan',
      'Otomatis terhubung ke WhatsApp Admin dan langsung tercatat sebagai prospek di Kanban',
      'Notifikasi konfirmasi instan untuk klien dengan ID brief resmi'
    ],
    tips: 'Tombol "Mulai Proyek" atau "Konsultasi Desain" di seluruh halaman publik akan membuka formulir cerdas ini.'
  },
  {
    id: 'pub-assetdrop',
    name: 'Client Asset Drop & Brand Vault',
    type: 'public',
    route: '/asset-drop',
    badge: 'Serah Terima Materi',
    icon: <Upload size={20} color="#06b6d4" />,
    summary: 'Portal penyerahan file materi desain dari klien (logo vektor, foto produk HD, dokumen brief) dengan drag & drop tanpa repot login.',
    features: [
      'Unggah multi-file ukuran besar (AI, PSD, ZIP, PDF, PNG, JPG) dengan indikator progres',
      'Auto-tagging berkas ke ID proyek klien atau nama brand bersangkutan',
      'Notifikasi real-time ke admin saat klien selesai mengirimkan materi',
      'Pratinjau visual berkas langsung di dalam Vault Studio Admin'
    ],
    tips: 'Bagikan tautan /asset-drop kepada klien baru untuk mengumpulkan materi desain secara rapi tanpa tercecer di WhatsApp.'
  },
  {
    id: 'pub-proofing',
    name: 'Design Proofing & Feedback Canvas',
    type: 'public',
    route: '/client/proofing',
    badge: 'Review & ACC',
    icon: <MousePointerClick size={20} color="#8b5cf6" />,
    summary: 'Kanvas interaktif untuk review desain online bersama klien dengan fitur sematkan komentar di titik visual, watermark perlindungan, dan tombol ACC 1-klik.',
    features: [
      'Sematkan komentar revisi tepat di atas elemen visual desain yang ingin diperbaiki',
      'Watermark dinamis anti-pembajakan sebelum pelunasan proyek diverifikasi',
      'Riwayat versi iterasi desain (Draft V1, V2, Final) yang transparan',
      'Tombol ACC & Tanda Tangan Persetujuan resmi untuk melanjutkan ke fase rilis'
    ],
    tips: 'Gunakan fitur Proofing Canvas untuk memangkas waktu revisi berulang-ulang melalui WhatsApp menjadi 1 kanvas terpusat.'
  },
  {
    id: 'pub-checkout',
    name: 'Keranjang Belanja & Checkout Mandiri',
    type: 'public',
    route: '/keranjang',
    badge: 'Kasir & Checkout',
    icon: <ShoppingCart size={20} color="#10b981" />,
    summary: 'Sistem checkout modern multi-item untuk pemesanan paket desain, template digital, dan add-ons dengan kalkulasi diskon otomatis dan pengamanan kode unik.',
    features: [
      'Manajemen item keranjang belanja multi-produk dengan tombol ubah kuantitas instan',
      'Rincian ringkasan biaya transparan (Subtotal, Diskon Voucher, dan Kode Unik Verifikasi 3-digit)',
      'Formulir identitas pemesan (Nama, Email, WhatsApp, dan Catatan Kebutuhan Khusus)',
      'Pilihan metode pembayaran Transfer Bank (BCA, Mandiri, BRI, BNI) dan QRIS Cloudinary 0% MDR',
      'Integrasi bukti pembayaran instan dengan pesan otomatis ke WhatsApp Studio'
    ],
    tips: 'Klien dapat langsung menuju /keranjang (atau /cart) setelah memilih produk dari etalase /katalog.'
  },
  {
    id: 'pub-updates',
    name: 'Updates Feed & Kabar Kilat Studio',
    type: 'public',
    route: '/updates',
    badge: 'Linimasa Studio',
    icon: <Radio size={20} color="#f97316" />,
    summary: 'Linimasa kabar kilat mikro (micro-updates) seputar progress studio, behind the scene karya baru, ketersediaan slot pengerjaan, dan stiker mood ekspresif.',
    features: [
      'Feed linimasa sosial dengan pembagian kategori (Rilis Baru, Tips Desain, Info Slot, Behind The Scene)',
      'Stiker status dan mood visual interaktif yang mencerminkan nuansa postingan',
      'Reaksi cepat pengunjung dan tautan langsung ke etalase karya terkait',
      'Mode tampilan terintegrasi di beranda (LPUpdatesFeed) maupun halaman linimasa mandiri (/updates)'
    ],
    tips: 'Kunjungi /updates secara berkala untuk mengetahui info slot proyek terbatas atau rilisan aset gratis.'
  },
  {
    id: 'pub-ratecard',
    name: 'Rate Card & Estimator Tarif Jasa',
    type: 'public',
    route: '/rate-card',
    badge: 'Tarif & Pricelist',
    icon: <FileText size={20} color="#06b6d4" />,
    summary: 'Katalog transparan struktur tarif jasa studio (Brand Identity, Web UI/UX, Kemasan, Social Kit) dengan kalkulator estimasi biaya proyek instan.',
    features: [
      'Transparansi tier harga mulai dari Starter, Growth, hingga Enterprise Studio',
      'Rincian output deliverable, jumlah revisi, dan estimasi waktu pengerjaan (lead time)',
      'Kalkulator estimasi dinamis: klien dapat memilih kombinasi layanan untuk melihat perkiraan budget',
      'Tombol ajukan penawaran langsung terhubung ke konsultasi WhatsApp'
    ],
    tips: 'Gunakan halaman /rate-card sebagai acuan awal sebelum menyusun formulir brief desain.'
  },
  {
    id: 'pub-feedback',
    name: 'Formulir Ulasan & Suara Klien',
    type: 'public',
    route: '/feedback',
    badge: 'Ulasan Klien',
    icon: <Heart size={20} color="#ec4899" />,
    summary: 'Portal pengisian ulasan kepuasan klien, testimoni pengalaman bekerjasama, pemberian rating bintang 1-5, dan saran masukan untuk studio.',
    features: [
      'Formulir penilaian kepuasan berbasis bintang visual interaktif',
      'Unggah foto profil / avatar atau logo brand klien pendukung testimoni',
      'Pemberian lencana Klien Terverifikasi oleh studio setelah diverifikasi',
      'Integrasi ulasan terpilih ke slider testimoni beranda (LPTestimonials) secara real-time'
    ],
    tips: 'Klien yang telah menyelesaikan proyek disarankan mengisi ulasan di /feedback untuk mendapatkan diskon proyek berikutnya.'
  },
  {
    id: 'pub-form',
    name: 'Formulir Kustom, Survei & RSVP',
    type: 'public',
    route: '/form/:id',
    badge: 'Dynamic Forms',
    icon: <ClipboardList size={20} color="#8b5cf6" />,
    summary: 'Halaman pengisian formulir kustom berbasis URL publik untuk kebutuhan riset pasar, survei klien, kuesioner brief spesifik, atau pendaftaran event/webinar.',
    features: [
      'Tata letak formulir clean, responsif, dan bebas gangguan di perangkat seluler',
      'Beragam tipe isian: teks pendek, paragraf, pilihan ganda, dropdown, unggah file, dan rating',
      'Validasi isian formulir otomatis sebelum pengiriman jawaban',
      'Pesan konfirmasi sukses kustom dan tombol kembali ke beranda'
    ],
    tips: 'Tautan /form/:id di-generate langsung dari modul Admin Form Maker (/admin/forms).'
  },
  {
    id: 'pub-invitation',
    name: 'Undangan Digital Interaktif',
    type: 'public',
    route: '/invitation/:slug',
    badge: 'Web Undangan',
    icon: <PartyPopper size={20} color="#ec4899" />,
    summary: 'Website undangan digital responsif untuk pesta pernikahan, peresmian brand, gathering, dan pameran dengan fitur multimedia lengkap.',
    features: [
      'Animasi pembuka amplop eksklusif dengan nama tamu yang dituju otomatis tertera',
      'Pemutar musik latar romantis/elegan dengan kontrol pause/play melayang',
      'Formulir konfirmasi kehadiran RSVP online dan buku ucapan doa digital',
      'Integrasi penunjuk arah Google Maps, hitung mundur acara (countdown), dan galeri foto',
      'Kode QR Check-In tamu pribadi untuk registrasi kehadiran kilat di venue'
    ],
    tips: 'Setiap undangan memiliki link unik mandiri yang dapat dibagikan langsung lewat WhatsApp.'
  },
  {
    id: 'pub-photobooth',
    name: 'Photobooth Web App Studio',
    type: 'public',
    route: '/apps/photobooth',
    badge: 'Event Photobooth',
    icon: <Camera size={20} color="#3b82f6" />,
    summary: 'Aplikasi photobooth peramban modern untuk kebutuhan aktivasi booth pameran, pesta, dan mall event dengan layout cetak strip instan.',
    features: [
      'Pengambilan foto burst multi-frame (3-4 jepretan) dengan audio countdown otomatis',
      'Pilihan strip frame foto kustom berlogo brand atau tema acara',
      'Filter estetika (Retro, B&W, Vintage Warm, Vibrant Cool)',
      'Pratinjau strip langsung di layar dan tombol unduh file PNG / cetak instan',
      'Bekerja mandiri di peramban tablet iPad / Surface tanpa perangkat lunak mahal'
    ],
    tips: 'Jalankan rute /apps/photobooth dalam mode full-screen browser (F11) pada tablet di venue acara.'
  },
  {
    id: 'pub-invitation-admin',
    name: 'Portal Tamu & Admin Undangan',
    type: 'public',
    route: '/invitation/:slug/admin',
    badge: 'Tamu & Buku Hadir',
    icon: <Users size={20} color="#ec4899" />,
    summary: 'Portal khusus pemilik acara untuk memantau konfirmasi RSVP tamu, rekap data ucapan doa, statistik kehadiran, dan QR Check-In di meja registrasi.',
    features: [
      'Dashboard rekap tamu hadir, ragu-ragu, dan tidak dapat hadir secara real-time',
      'Manajemen daftar tamu VIP dan pembuatan tautan undangan personal otomatis',
      'Scanner QR Code di pintu masuk untuk mencatat kehadiran fisik tamu',
      'Ekspor seluruh daftar tamu dan ucapan doa ke format spreadsheet Excel'
    ],
    tips: 'Klien pemilik hajatan dapat login langsung ke /undangan/:slug/admin menggunakan kode akses rahasia.'
  },
  {
    id: 'pub-note-preview',
    name: 'Pratinjau Catatan & Konsep Terbuka',
    type: 'public',
    route: '/note/:id',
    badge: 'Brief & Konsep',
    icon: <FileText size={20} color="#eab308" />,
    summary: 'Tampilan dokumen konsep dan catatan brief studio yang dibagikan secara aman dan terenkripsi untuk dibaca klien tanpa perlu akun.',
    features: [
      'Tampilan dokumen visual yang bersih, elegan, dan ramah cetak/ekspor PDF',
      'Format kaya teks: checklist tugas, moodboard gambar, dan tabel rincian deliverable',
      'Tautan publik read-only yang aman dan dapat diproteksi password',
      'Tombol konfirmasi langsung terhubung ke WhatsApp diskusi proyek'
    ],
    tips: 'Bagikan tautan /note/:id dari modul Memo Manager saat mempresentasikan konsep desain awal.'
  },
  {
    id: 'pub-custom-page',
    name: 'Halaman Kustom Dinamis (Web Studio)',
    type: 'public',
    route: '/p/:slug',
    badge: 'Custom Page',
    icon: <Sparkles size={20} color="#8b5cf6" />,
    summary: 'Halaman web mandiri tanpa batas yang dibuat langsung melalui Website Studio (Visual Builder) untuk promo khusus, event, atau portfolio spesial.',
    features: [
      'URL slug kustom mandiri (contoh: /p/promo-ramadhan, /p/exhibition-2026)',
      'Desain bebas menggunakan ratusan blok visual siap pasang (drag & drop)',
      'Dukungan proteksi kata sandi halaman per-URL untuk dokumen rahasia',
      'Optimasi SEO meta tags, OpenGraph share preview, dan kecepatan akses 60FPS'
    ],
    tips: 'Buat halaman baru di Admin Halaman (/admin/pages) lalu klik Edit Visual untuk mendesainnya.'
  },

  // ── SISI ADMIN CMS PANEL (ADMIN-FACING) ──
  {
    id: 'adm-dashboard',
    name: 'Dashboard Overview',
    type: 'admin',
    route: '/admin',
    badge: 'Pusat Kontrol',
    icon: <Layers size={20} color="#38bdf8" />,
    summary: 'Halaman muka panel admin untuk memantau ringkasan metrik studio, cuaca operasional, aktivitas terkini, dan akses kilat ke seluruh modul CMS.',
    features: [
      'Ringkasan 4 pilar operasional studio: Apps Studio, Karya, Artikel, dan Katalog',
      'Mini-tools header icon-only (Buku Panduan, Cadangan JSON, Live Website, Akun)',
      'Statistik pengunjung, total karya aktif, dan antrean pesan masuk',
      'Akses instan navigasi keyboard dan menu klik kanan terpadu (Context Menu)'
    ],
    tips: 'Gunakan tombol ikon bulat di header untuk akses instan ke Backup JSON dan Pratinjau Live Web.'
  },
  {
    id: 'adm-portfolio',
    name: 'Manajemen Karya (Portofolio)',
    type: 'admin',
    route: '/admin/portfolio',
    badge: 'Editor Karya',
    icon: <FolderGit2 size={20} color="#8b5cf6" />,
    summary: 'Pusat pengelolaan karya desain, unggah media foto/video HD, penandaan karya unggulan, dan fitur tandai & hapus massal.',
    features: [
      'Tandai & Hapus Massal (Multi-Select & Bulk Delete) untuk efisiensi kelola banyak karya',
      'Bintang Unggulan: tandai karya terbaik untuk tampil di Hero Landing Page',
      'Unggah foto & video beresolusi tinggi dengan penyimpanan cloud terintegrasi',
      'Pengelompokan kategori dinamis (Branding, Web, Mobile, Print, dll)',
      'Menu Context unik: klik kanan pada karya untuk aksi kilat edit, bintang, atau hapus'
    ],
    tips: 'Gunakan tombol kotak centang pada setiap kartu karya untuk menandai beberapa karya sekaligus lalu hapus dengan sekali klik.'
  },
  {
    id: 'adm-apps',
    name: 'Apps & Game Studio',
    type: 'admin',
    route: '/admin/apps',
    badge: 'Studio Game',
    icon: <LayoutGrid size={20} color="#ec4899" />,
    summary: 'Kelola inventaris aplikasi HTML5 interaktif, URL iframe playable, token lisensi event klien, pratinjau live, dan hapus massal.',
    features: [
      'Tandai & Hapus Massal: pilih beberapa aplikasi sekaligus untuk dihapus dengan cepat',
      'Uji coba live playable simulator langsung di dalam panel CMS',
      'Penerbitan token lisensi event khusus klien (durasi, nama event, aktivasi booth)',
      'AI Game Architect: prompt pembuat kode HTML5 single-file berbasis AI Gemini',
      'Ekspor mandiri arsip ZIP file game siap pakai offline di venue event'
    ],
    tips: 'URL rute admin resmi adalah /admin/apps. Tautan lama /admin/games dialihkan ke sini secara otomatis.'
  },
  {
    id: 'adm-blog',
    name: 'Manajemen Artikel (Blog)',
    type: 'admin',
    route: '/admin/blog',
    badge: 'Editor Artikel',
    icon: <BookOpen size={20} color="#06b6d4" />,
    summary: 'Tulis, jadwalkan, dan publikasikan artikel edukasi desain dengan visual editor lengkap, AI blog generator, serta hapus massal.',
    features: [
      'Tandai & Hapus Massal: bersihkan atau rapikan artikel draft lama secara serentak',
      'Rich text visual editor dengan pemformatan heading, kutipan, tabel, dan gambar',
      'Generator Artikel AI: buat draf artikel edukasi desain otomatis dalam hitungan detik',
      'Pengaturan status Draft vs Terbit (Published) secara fleksibel',
      'Menu Context klik kanan untuk salin link, ubah status, atau hapus instan'
    ],
    tips: 'Artikel yang berstatus Published akan langsung muncul di halaman publik /blog dengan waktu baca otomatis.'
  },
  {
    id: 'adm-catalog',
    name: 'Manajemen Katalog Produk',
    type: 'admin',
    route: '/admin/catalog',
    badge: 'Manajemen Produk',
    icon: <ShoppingBag size={20} color="#f59e0b" />,
    summary: 'Atur daftar produk digital, layanan paket desain, struktur harga, varian, kode kupon diskon, serta fitur tandai & hapus massal.',
    features: [
      'Tandai & Hapus Massal: seleksi dan hapus beberapa produk sekaligus dengan cepat',
      'Penetapan harga normal dan harga diskon (coret) otomatis',
      'Pengelompokan kategori layanan dan pembuatan voucher diskon berkode khusus',
      'Tautan pemesanan langsung WhatsApp dengan pesan otomatis terisi',
      'Menu Context klik kanan untuk ubah status aktif/draft dan salin info produk'
    ],
    tips: 'Produk yang berstatus aktif akan langsung tampil di etalase /katalog.'
  },
  {
    id: 'adm-finance',
    name: 'Keuangan & Transaksi Studio',
    type: 'admin',
    route: '/admin/transactions',
    badge: 'Laporan Finansial',
    icon: <CreditCard size={20} color="#14b8a6" />,
    summary: 'Pencatatan arus kas studio yang sangat akurat, pemisahan pemasukan invoice proyek klien, pengeluaran operasional, dan kalkulasi laba bersih.',
    features: [
      'Pencatatan Pemasukan (Income) dari pembayaran DP dan pelunasan proyek klien',
      'Pencatatan Pengeluaran (Expense) untuk operasional, software, aset, dan subkontraktor',
      'Kalkulasi Laba Bersih (Net Profit) dan total saldo kas secara real-time',
      'Penyaringan transaksi berdasarkan rentang tanggal (Bulan Ini, Tahun Ini, Custom)',
      'Ekspor laporan pembukuan finansial ke format CSV / PDF untuk pelaporan pajak',
      'Integrasi status tagihan invoice langsung dari modul Manajemen Proyek',
      'Sistem Kode Unik Verifikasi 3-digit acak pada invoice & integrasi rekening master studio'
    ],
    tips: 'Catat setiap termin DP 50% dan pelunasan proyek tepat waktu agar kalkulasi laba bersih bulanan studio selalu akurat.'
  },
  {
    id: 'adm-notes',
    name: 'Catatan & Ide Kreatif (Notes)',
    type: 'admin',
    route: '/admin/notes',
    badge: 'Papan Memo',
    icon: <FileText size={20} color="#eab308" />,
    summary: 'Papan catatan cepat, draft konsep, sketsa ide, checklist persiapan, kanvas whiteboard, serta fitur tandai & hapus massal.',
    features: [
      'Tandai & Hapus Massal: seleksi beberapa catatan sekaligus lalu buang ke Kotak Sampah',
      'Kotak Sampah Sementara: catatan yang dihapus dapat dipulihkan kapan saja',
      'Dua Mode Catatan: Dokumen Teks Markdown & Kanvas Whiteboard Bebas',
      'Pengelompokan warna (Amber, Emerald, Sky, Purple, Rose) dan folder beranak',
      'Mode Offline-Only: simpan catatan sangat rahasia hanya di perangkat lokal tanpa sinkronisasi cloud',
      'Integrasi Google Sheets & Firestore Sync otomatis saat terhubung internet'
    ],
    tips: 'Gunakan kotak centang di sudut kanan atas tiap kartu memo untuk menandai beberapa memo lalu hapus atau pulihkan secara massal.'
  },
  {
    id: 'adm-projects',
    name: 'Proyek & Jadwal Timeline',
    type: 'admin',
    route: '/admin/projects',
    badge: 'Manajemen Jadwal',
    icon: <CheckCircle2 size={20} color="#10b981" />,
    summary: 'Pelacakan alur kerja proyek desain dari awal hingga selesai, deadline klien, pembagian tugas, dan papan Kanban visual.',
    features: [
      'Papan Kanban visual 4 tahap: Brief Masuk, Pengerjaan Desain, Review Klien, dan Selesai',
      'Pelacakan tenggat waktu (deadline) dengan indikator hitung mundur (countdown)',
      'Pilihan tampilan fleksibel: Kanban Board, Tabel Terstruktur, Galeri Visual, dan Daftar List',
      'Multi-Select & Bulk Actions: tandai banyak proyek untuk ubah status atau hapus massal',
      'Lampiran berkas brief, tautan Google Drive, dan rincian kontak klien penanggung jawab'
    ],
    tips: 'Pindahkan kartu proyek antar-kolom dengan drag-and-drop untuk memperbarui status pengerjaan secara instan.'
  },
  {
    id: 'adm-chat',
    name: 'Konsultasi & Live Chat',
    type: 'admin',
    route: '/admin/chat',
    badge: 'Pesan Klien',
    icon: <MessageSquare size={20} color="#6366f1" />,
    summary: 'Pusat obrolan langsung dua arah dengan pengunjung website publik, template balasan cepat, bantuan AI, dan seleksi hapus massal.',
    features: [
      'Tandai & Hapus Massal: hapus beberapa sesi percakapan usang sekaligus',
      'Pesan masuk real-time melalui websocket Firebase tanpa perlu refresh halaman',
      'Template Balasan Cepat (FAQ Auto-Response) untuk pertanyaan biaya, durasi, dan garansi',
      'Bantuan AI Gemini untuk menyusun balasan sopan dan profesional dalam 1 klik',
      'Indikator status pengunjung sedang aktif (online green dot)'
    ],
    tips: 'Gunakan tombol centang di sebelah avatar percakapan untuk menandai chat lama dan bersihkan ruang kotak masuk.'
  },
  {
    id: 'adm-visual-editor',
    name: 'Website Studio (Visual Builder)',
    type: 'admin',
    route: '/admin/visual-editor',
    badge: 'Page Builder',
    icon: <Sparkles size={20} color="#f43f5e" />,
    summary: 'Editor blok visual live untuk merancang dan mengubah tata letak landing page secara instan tanpa menyentuh kode program.',
    features: [
      'Pratinjau visual multi-device (tampilan Mobile, Tablet, dan Desktop)',
      'Kustomisasi blok Hero, Galeri Portofolio, Tentang Studio, dan Testimoni',
      'Pengaturan warna aksen dan mode tema studio secara visual',
      'Penyimpanan otomatis ke penyimpanan lokal dan cloud'
    ],
    tips: 'Setiap penyesuaian teks dan tata letak di Website Studio dapat langsung diuji di peramban publik.'
  },
  {
    id: 'adm-broadcast',
    name: 'Broadcast & Notifikasi Push',
    type: 'admin',
    route: '/admin/broadcast',
    badge: 'Broadcast Studio',
    icon: <Radio size={20} color="#f97316" />,
    summary: 'Kirim pengumuman penting, promo jasa, atau rilis karya baru ke seluruh pengunjung melalui banner notifikasi situs.',
    features: [
      'Kirim pesan broadcast instan ke seluruh pengunjung website aktif',
      'Penjadwalan pengumuman berkala dan penentuan tanggal kedaluwarsa banner',
      'Target audiens dan log penerimaan pesan',
      'Pratinjau visual pop-up notifikasi sebelum disiarkan'
    ],
    tips: 'Gunakan broadcast saat ada promo potongan harga khusus atau pembukaan slot proyek baru.'
  },
  {
    id: 'adm-game-management',
    name: 'Apps & Game Studio (Multi-Branding)',
    type: 'admin',
    route: '/admin/game-management',
    badge: 'Apps & Game Studio',
    icon: <LayoutGrid size={20} color="#8b5cf6" />,
    summary: 'Pusat aplikasi web interaktif, utilitas, kalkulator, form lead-gen, dan game event. Setiap aplikasi memiliki panel admin mandiri untuk men-generate link klien baru dengan multi-branding terpisah (logo, warna, CTA, dan webhook).',
    features: [
      'Generator Link Mandiri: Tiap klien/event memiliki URL unik (/client/play/:id) tanpa saling bertabrakan',
      'Multi-Branding Klien: Pasang logo brand klien, warna tombol khusus, pesan sambutan, dan tombol aksi (CTA)',
      '3 Peran Sub-Admin: Admin Master (akses penuh), Admin Supplier (desain & level), dan View Only (kiosk siap pakai)',
      'Model Penyerahan Fleksibel: Sewa berjangka (online link berdurasi) atau Beli Putus (Paket Offline ZIP mandiri)',
      'Integrasi Webhook: Hubungkan langsung ke Google Sheets / Apps Script untuk pencatatan skor & leads'
    ],
    tips: 'Buka detail aplikasi apa pun lalu klik "Buat Link Multi-Branding" untuk membuat link klien baru dalam hitungan detik.'
  },
  {
    id: 'adm-database',
    name: 'Master Database & Cadangan',
    type: 'admin',
    route: '/admin/database',
    badge: 'Pusat Data',
    icon: <Database size={20} color="#0ea5e9" />,
    summary: 'Pusat ringkasan seluruh entitas data sistem, cadangan file JSON satu-klik, pemulihan data, dan pemantau kuota penyimpanan.',
    features: [
      'Ringkasan jumlah entitas: total karya, artikel, produk katalog, dan catatan aktif',
      'Unduh Cadangan JSON lengkap seluruh database dalam 1 kali klik',
      'Pemulihan data instan (Restore JSON) saat ingin berpindah perangkat',
      'Pemantauan status kuota penyimpanan cloud dan kesehatan sinkronisasi'
    ],
    tips: 'Lakukan pencadangan (Backup) secara berkala setiap akhir pekan melalui tombol bulat di bilah atas admin.'
  },
  {
    id: 'adm-business-profile',
    name: 'Pusat Bisnis, Kontak & Pembayaran',
    type: 'admin',
    route: '/admin/settings (Tab Bisnis & Kontak)',
    badge: 'Master Brand & Payment',
    icon: <Building2 size={20} color="#38bdf8" />,
    summary: 'Pusat komando master identitas bisnis studio, nomor WhatsApp resmi, alamat kantor, daftar rekening bank (BCA, Mandiri, BRI, BNI), dan QRIS Statis 0% MDR terpusat.',
    features: [
      'Multi-Rekening Bank: kelola rekening studio dengan verifikasi otomatis dan salin instan',
      'QRIS Dinamis / Statis 0% Biaya: upload QRIS via Cloudinary / galeri untuk pembayaran langsung',
      'Kode Unik Anti-Fraud (3 Digit Acak): verifikasi mutasi otomatis untuk mencegah penipuan transfer',
      'Sinkronisasi 1-Pintu ke Modul Kasir & Invoice: otomatis tampil di faktur transaksi tanpa input ulang',
      'Integrasi Cloudinary & Galeri Media: unggah foto QRIS langsung tanpa repot salin link eksternal'
    ],
    tips: 'Buka Admin Settings lalu pilih tab "Pusat Bisnis & Kontak" atau klik tombol pintasan di Dashboard Bento Hub.'
  },
  {
    id: 'adm-whatsapp',
    name: 'WhatsApp Studio & Smart Templates',
    type: 'admin',
    route: '/admin/whatsapp',
    badge: 'WhatsApp Hub',
    icon: <MessageSquare size={20} color="#25D366" />,
    summary: 'Pusat pembuatan dan manajemen template pesan WhatsApp otomatis untuk penawaran harga, konfirmasi brief, faktur invoice, reminder deadline, dan follow-up revisi klien.',
    features: [
      'Koleksi template siap pakai (Brief Baru, SPK Kontrak, Invoice DP/Lunas, Notifikasi Proofing)',
      'Variabel dinamis otomatis (Nama Klien, Nama Proyek, Nominal Tagihan, Link Dokumen)',
      'Pengiriman instan 1-klik terhubung ke WhatsApp Web / Desktop tanpa simpan nomor',
      'Dukungan multi-rekening transfer & QRIS langsung tertanam di dalam isi pesan WA'
    ],
    tips: 'Gunakan WhatsApp Studio untuk mengirim pengingat deadline dan link proofing kanvas dengan bahasa profesional yang santun.'
  },
  {
    id: 'adm-analytics',
    name: 'Studio Intelligence & Traffic Tracker',
    type: 'admin',
    route: '/admin/analytics',
    badge: 'Analitik Studio',
    icon: <Activity size={20} color="#6366f1" />,
    summary: 'Dashboard intelijen studio untuk memantau performa trafik pengunjung website, konversi prospek menjadi proyek, retensi klien, dan log audit keamanan sistem.',
    features: [
      'Pelacakan jumlah kunjungan unik harian, mingguan, dan bulanan per halaman',
      'Tingkat konversi (Conversion Rate) dari pengunjung landing page menjadi pengisi form brief',
      'Audit trail jejak login akun admin & aktivitas perubahan data master studio',
      'Visualisasi grafik omzet bulanan dan estimasi nilai pipeline proyek aktif'
    ],
    tips: 'Pantau menu Intelligence secara berkala untuk mengetahui layanan desain yang paling diminati calon klien.'
  },
  {
    id: 'adm-spk',
    name: 'Generator Surat Perjanjian Kerja (SPK) & Kontrak',
    type: 'admin',
    route: '/admin/projects (Modal SPK & Kontrak)',
    badge: 'Legal & SPK',
    icon: <ShieldCheck size={20} color="#10b981" />,
    summary: 'Modul legalitas dan pembuatan dokumen SPK Kontrak resmi berstandar agensi desain dengan pasal hak cipta, termin pembayaran bertahap, dan klausul revisi.',
    features: [
      'Otomatisasi pengisian data klien, lingkup pekerjaan (SOW), dan jadwal serah terima',
      'Ketentuan termin pembayaran transparan (DP 50%, Termin Desain 30%, Pelunasan 20%)',
      'Pasal perlindungan hak cipta (Copyright), kepemilikan aset master, dan NDA kerahasiaan',
      'Ekspor cetak PDF berlogo resmi studio atau salin draf teks perjanjian untuk WhatsApp'
    ],
    tips: 'Klik tombol SPK pada kartu proyek aktif untuk menerbitkan surat perjanjian kerja sebelum memulai proses desain.'
  },
  {
    id: 'adm-flashsale',
    name: 'Flash Sale & Promo Countdown Engine',
    type: 'admin',
    route: '/admin/catalog (Modal Flash Sale)',
    badge: 'Promo Kilat',
    icon: <Flame size={20} color="#ef4444" />,
    summary: 'Mesin kampanye promosi berbatas waktu dengan timer hitung mundur, kuota diskon khusus, dan spotlight interaktif di landing page dan katalog.',
    features: [
      'Pengaturan jadwal mulai dan berakhirnya flash sale dengan timer hitung mundur real-time',
      'Diskon persentase khusus dengan batasan kuota sisa unit untuk menciptakan urgensi beli',
      'Banner spotlight flash sale otomatis aktif di Beranda Utama dan Katalog',
      'Integrasi langsung ke kasir invoice dengan kalkulasi diskon otomatis'
    ],
    tips: 'Jalankan Flash Sale pada akhir pekan atau momen gajian untuk mendongkrak penjualan template dan paket desain kilat.'
  },
  {
    id: 'adm-partnership',
    name: 'Partnership & Reseller Hub',
    type: 'admin',
    route: '/admin/partnership',
    badge: 'Mitra & Afiliasi',
    icon: <Users size={20} color="#f59e0b" />,
    summary: 'Pusat kolaborasi mitra agensi, sub-kontraktor, dan program reseller dengan sistem pencatatan komisi bagi hasil yang terintegrasi ke pembukuan.',
    features: [
      'Manajemen direktori mitra rekanan kreatif dan vendor cetak/event',
      'Penetapan komisi reseller (persentase atau nominal flat per proyek closing)',
      'Pelacakan status pencairan komisi mitra terhubung ke modul Keuangan',
      'Perjanjian kemitraan terstandarisasi untuk kolaborasi jangka panjang'
    ],
    tips: 'Gunakan kode reseller unik pada setiap pesanan untuk mencatat komisi mitra secara otomatis.'
  },
  {
    id: 'adm-forms',
    name: 'Form Maker & AI Survey Studio',
    type: 'admin',
    route: '/admin/forms',
    badge: 'Form & RSVP',
    icon: <ClipboardList size={20} color="#8b5cf6" />,
    summary: 'Pusat pembuatan formulir dinamis serbaguna, pembuat form berbasis AI Gemini, template RSVP/survei, pelacak respon, dan ekspor spreadsheet Excel.',
    features: [
      'AI Form Generator: buat kuesioner lengkap dari prompt kalimat singkat dalam 5 detik',
      'Editor drag-and-drop bidang isian (teks, pilihan, tanggal, skala angka, rating, berkas)',
      'Tab Responses: pemantauan real-time jawaban masuk dengan visualisasi ringkasan',
      'Ekspor jawaban ke format Microsoft Excel (.xlsx) dan CSV dalam 1 kali klik',
      'Penyalinan link publik formulir (/form/:id) siap sebar ke WhatsApp dan media sosial'
    ],
    tips: 'Gunakan AI Form Generator untuk merancang kuesioner riset konsumen dengan pertanyaan standar industri.'
  },
  {
    id: 'adm-updates',
    name: 'Manajemen Updates Feed & Stiker',
    type: 'admin',
    route: '/admin/updates',
    badge: 'Micro-Content',
    icon: <Radio size={20} color="#f97316" />,
    summary: 'Studio kurasi linimasa kabar kilat, manajemen stiker reaksi, penentuan visibilitas spotlight di landing page, dan postingan status studio.',
    features: [
      'Pembuatan status kilat (teks ringkas, foto pendukung, kategori tagar, dan stiker mood)',
      'Manajemen koleksi stiker ekspresif (Ide Segar, Sedang Ngopi, Selesai ACC, Rilis Aset, dll)',
      'Pengaturan pin status penting ke widget banner linimasa di beranda publik',
      'Moderasi interaksi dan pantauan statistik pembaca status'
    ],
    tips: 'Bagikan progres mini proyek aktif untuk membangun transparansi kerja dan reputasi profesional studio.'
  },
  {
    id: 'adm-ratecard',
    name: 'Manajemen Rate Card & Paket Jasa',
    type: 'admin',
    route: '/admin/rate-card',
    badge: 'Pricelist Studio',
    icon: <FileText size={20} color="#06b6d4" />,
    summary: 'Pengelolaan daftar paket jasa resmi, tingkatan harga (Tier), add-ons layanan tambahan, formula kalkulator, dan halaman rate-card publik.',
    features: [
      'Atur daftar layanan jasa per kategori (Branding, Web, App, Packaging, Social Media)',
      'Penetapan harga acuan, item output yang didapat klien, dan durasi SLA pengerjaan',
      'Sinkronisasi instan ke modal Estimator Tarif di beranda dan formulir penawaran harga',
      'Fitur sakelar visibilitas publik: tampilkan atau sembunyikan nominal tarif kapan saja'
    ],
    tips: 'Selalu perbarui durasi pengerjaan saat jadwal studio sedang padat agar ekspektasi klien tetap realistis.'
  },
  {
    id: 'adm-reviews',
    name: 'Manajemen Ulasan & Suara Klien',
    type: 'admin',
    route: '/admin/reviews',
    badge: 'Kurasi Ulasan',
    icon: <Heart size={20} color="#ec4899" />,
    summary: 'Pusat moderasi testimoni klien masuk, pemberian badge terverifikasi, rating bintang, dan penayangan review ke beranda utama.',
    features: [
      'Moderasi testimoni baru yang masuk dari formulir /feedback sebelum ditampilkan ke publik',
      'Pemberian lencana Klien Terverifikasi & identitas nama brand klien',
      'Seleksi review unggulan (Featured 5-Star) untuk banner beranda dan proposal jasa',
      'Tanggapan resmi studio terhadap testimoni atau feedback klien'
    ],
    tips: 'Tampilkan minimal 6 ulasan bintang 5 dari berbagai jenis proyek untuk meningkatkan rasio closing prospek baru.'
  },
  {
    id: 'adm-whiteboard',
    name: 'Kanvas Whiteboard & Sketsa Ide',
    type: 'admin',
    route: '/admin/notes (Tab Whiteboard)',
    badge: 'Kanvas Sketsa',
    icon: <Layers size={20} color="#eab308" />,
    summary: 'Papan sketsa kanvas tak terbatas (infinite canvas) untuk brainstorming konsep desain, mind mapping, diagram alur, dan coretan sticky notes visual.',
    features: [
      'Kanvas tanpa batas dengan navigasi zoom in/out dan pan halus',
      'Peralatan sketsa lengkap: pena warna-warni, highlighter, bentuk geometri, panah alur, dan sticky notes',
      'Penyisipan gambar referensi / moodboard visual langsung ke atas kanvas',
      'Ekspor hasil sketsa kanvas ke format gambar PNG jernih untuk dilampirkan ke brief proyek'
    ],
    tips: 'Gunakan mode Whiteboard saat rapat brainstorming konsep brand baru bersama tim atau klien.'
  },
  {
    id: 'adm-vault',
    name: 'Brankas Aset Klien & Brand Vault',
    type: 'admin',
    route: '/admin/vault',
    badge: 'Master Aset',
    icon: <Database size={20} color="#0ea5e9" />,
    summary: 'Pusat brankas materi desain klien (vektor logo SVG/AI, font resmi, foto HD, dokumen brand guideline) yang rapi, aman, dan terarsip per klien.',
    features: [
      'Organisasi berkas terstruktur per nama klien dan nomor proyek',
      'Penyimpanan master berkas ukuran besar dengan pratinjau instan di browser',
      'Pemberian hak akses unduh aman untuk klien setelah proyek tuntas',
      'Pencarian kilat aset brand berdasarkan nama klien, ekstensi berkas, atau tanggal serah terima'
    ],
    tips: 'Aset yang diunggah klien lewat /asset-drop otomatis terkumpul rapi di Brankas ini.'
  },
  {
    id: 'adm-qr',
    name: 'QR Studio Generator',
    type: 'admin',
    route: '/admin/qr',
    badge: 'Generator QR',
    icon: <QrCode size={20} color="#8b5cf6" />,
    summary: 'Generator kode QR profesional beresolusi tinggi dengan penyesuaian logo brand, warna tema, bingkai stiker, dan ekspor SVG/PNG siap cetak.',
    features: [
      'Generate QR untuk Tautan Web, WhatsApp kilat, WiFi kantor, vCard kontak, dan teks',
      'Kustomisasi warna titik, gradien, gaya sudut, dan logo brand di tengah QR',
      'Bingkai stiker Call-To-Action (contoh: "Scan Me", "Pesan Menu", "Hubungi Kami")',
      'Ekspor beresolusi tinggi format vektor SVG (cetak banner besar) dan PNG 300 DPI'
    ],
    tips: 'Gunakan QR Studio untuk mencetak stiker QR meja kasir atau kartu nama studio.'
  },
  {
    id: 'adm-links',
    name: 'Bio Links Studio (Tree Engine)',
    type: 'admin',
    route: '/admin/links',
    badge: 'Multi-Link Bio',
    icon: <Link2 size={20} color="#a855f7" />,
    summary: 'Studio pembuatan tautan bio interaktif multihalaman untuk Instagram/TikTok dengan preview gawai live di layar desktop dan analitik klik.',
    features: [
      'Editor tautan drag-and-drop dengan beragam tipe tombol (Link, WA, Video, Katalog)',
      'Simulator preview gawai seluler live di sebelah kanan kanvas',
      'Dukungan multi-page: buat halaman link berbeda untuk tiap divisi bisnis atau brand',
      'Statistik jumlah klik per tombol tautan untuk mengukur efektivitas kampanye'
    ],
    tips: 'Pasang URL bio link resmi Anda (/links) di bio profil Instagram dan TikTok studio.'
  },
  {
    id: 'adm-users',
    name: 'Tim, CRM & Hak Akses Kru',
    type: 'admin',
    route: '/admin/users',
    badge: 'Manajemen Kru',
    icon: <Users size={20} color="#3b82f6" />,
    summary: 'Pusat manajemen akun tim studio, penetapan peran (Super Admin vs Crew Designer), pembatasan akses modul sensitif, dan direktori klien.',
    features: [
      'Manajemen peran bertingkat: Super Admin (akses penuh) & Crew Designer (desain & proyek)',
      'Proteksi pembatasan akses ke menu Finansial, Keuangan, dan Pengaturan Sistem',
      'Pemberian avatar Notionists unik dan nomor kontak kru',
      'Fitur impersonasi (uji tampilan sebagai akun staf lain) untuk validasi hak akses'
    ],
    tips: 'Hanya Super Admin yang dapat mengakses menu Tim & Hak Akses (/admin/users).'
  },
  {
    id: 'adm-settings',
    name: 'Pengaturan Sistem & SEO',
    type: 'admin',
    route: '/admin/settings',
    badge: 'Konfigurasi CMS',
    icon: <Settings size={20} color="#94a3b8" />,
    summary: 'Konfigurasi menyeluruh identitas studio, logo, domain, tema awal, SEO meta tags, favicon, dan integrasi WhatsApp.',
    features: [
      'Pengaturan nama studio, tagline, dan favicon peramban',
      'Konfigurasi SEO Meta Tags & Social Share Image agar menarik saat dibagikan ke WhatsApp/Facebook',
      'Pengaturan tema default studio dan pemilihan palet warna aksen',
      'Nomor WhatsApp resmi untuk penerimaan pesanan dan konsultasi proyek'
    ],
    tips: 'Pastikan informasi SEO dan logo selalu diperbarui untuk representasi brand terbaik di mesin pencari.'
  }
];

export const CLIENT_TIPS_DATA: ClientTipItem[] = [
  {
    id: 'ct-1',
    title: 'Cara Memilih Paket Jasa di Katalog Layanan',
    icon: <ShoppingBag size={20} color="#f59e0b" />,
    badge: 'Katalog & Pemesanan',
    desc: 'Buka menu Katalog (/katalog) untuk melihat seluruh daftar layanan desain grafis, pembuatan website, maupun custom web apps. Setiap paket memiliki rincian harga dan fitur yang jelas. Klik tombol "Pesan via WhatsApp" untuk terhubung langsung dengan tim kami dengan format pesan otomatis.',
    step: 'Pilih Layanan → Cek Rincian Harga → Klik Pesan via WhatsApp → Diskusi Brief'
  },
  {
    id: 'ct-2',
    title: 'Cara Menguji & Memainkan Apps Interaktif di /apps',
    icon: <LayoutGrid size={20} color="#ec4899" />,
    badge: 'Interactive Apps',
    desc: 'Kunjungi rute resmi /apps (atau klik menu Apps). Seluruh game dan aplikasi HTML5 dapat langsung dimainkan di layar ponsel atau laptop Anda tanpa perlu mengunduh aplikasi tambahan. Untuk kebutuhan aktivasi pameran, event korporat, atau mall booth, hubungi admin untuk mendapatkan lisensi kustom dengan logo dan warna brand Anda.',
    step: 'Buka /apps → Pilih Game → Klik Mainkan Sekarang → Rasakan 60FPS Responsif'
  },
  {
    id: 'ct-3',
    title: 'Eksplorasi Portofolio Berdasarkan Kategori',
    icon: <FolderGit2 size={20} color="#8b5cf6" />,
    badge: 'Inspirasi Karya',
    desc: 'Buka menu Portofolio (/portfolio) dan gunakan tombol filter kategori (seperti Branding, Web, Mobile, atau 3D) untuk menyaring karya yang relevan dengan kebutuhan bisnis Anda. Klik pada kartu karya untuk membuka studi kasus lengkap beresolusi tinggi.',
    step: 'Gunakan Filter Kategori → Telusuri Foto Detail → Simpan Referensi untuk Diskusi Brief'
  },
  {
    id: 'ct-4',
    title: 'Pilihan Tema Gelap / Terang yang Selalu Tersimpan',
    icon: <Sun size={20} color="#38bdf8" />,
    badge: 'Kenyamanan Visual',
    desc: 'Anda dapat menyesuaikan mode tampilan website sesuai kenyamanan mata dengan menekan ikon Matahari / Bulan di bilah navigasi. Pilihan tema Anda tersimpan permanen di perangkat dan tidak akan pernah reset saat Anda berpindah halaman.',
    step: 'Klik Tombol Tema di Navigasi → Mode Gelap / Terang langsung aktif & tersimpan permanen'
  },
  {
    id: 'ct-5',
    title: 'Akses Portal Akun Klien Mandiri (/client)',
    icon: <Lock size={20} color="#6366f1" />,
    badge: 'Area Klien',
    desc: 'Bagi klien yang telah memiliki proyek atau lisensi event apps aktif, masuk ke portal klien di /client. Di sini Anda dapat memantau progres pengerjaan proyek secara transparan, mengunduh faktur invoice pembayaran resmi, dan mengakses link launcher event game.',
    step: 'Buka /client → Masuk dengan Akun Klien → Pantau Progres & Unduh Faktur'
  },
  {
    id: 'ct-6',
    title: 'Konsultasi Kilat Langsung via Live Chat',
    icon: <MessageSquare size={20} color="#10b981" />,
    badge: 'Konsultasi Cepat',
    desc: 'Punya pertanyaan spontan mengenai estimasi biaya atau waktu pengerjaan? Klik ikon balon chat di sudut kanan bawah website publik. Pesan Anda akan langsung tersambung ke ruang kerja tim studio kami secara real-time.',
    step: 'Klik Widget Chat di Kanan Bawah → Tulis Pertanyaan → Dapatkan Jawaban Cepat dari Admin'
  },
  {
    id: 'ct-7',
    title: 'Format Serah Terima Aset & Standar Revisi Desain',
    icon: <Award size={20} color="#eab308" />,
    badge: 'Standar Kualitas',
    desc: 'Setiap hasil akhir proyek desain diserahkan dalam format master lengkap siap pakai: file vektor (AI, EPS, SVG), gambar beresolusi tinggi (PNG transparan 300 DPI, JPG), file desain interaktif (Figma), serta PDF siap cetak dengan panduan warna brand (CMYK/RGB).',
    step: 'Brief Disepakati → Draft Desain 1 & 2 → Revisi Sesuai Paket → Serah Terima File Master'
  },
  {
    id: 'ct-8',
    title: 'Pembayaran Transfer Bebas Biaya & Kode Unik Verifikasi',
    icon: <ShieldCheck size={20} color="#10b981" />,
    badge: 'Keamanan & Anti-Fraud',
    desc: 'Saat melakukan pembayaran invoice atau paket jasa, sistem kami menyediakan opsi Transfer Bank langsung (BCA, Mandiri, dll) dan QRIS 0% biaya potongan. Setiap tagihan transfer dilengkapi 3 digit kode unik acak di akhir nominal (contoh: Rp 500.284) untuk mempercepat verifikasi otomatis dan melindungi transaksi dari fraud.',
    step: 'Pilih Rekening / QRIS → Transfer Sesuai Total Hingga 3 Digit Terakhir → Konfirmasi Otomatis Terverifikasi'
  },
  {
    id: 'ct-9',
    title: 'Cara Mengajukan Brief Desain Cepat via Form Inquiry',
    icon: <Sparkles size={20} color="#ec4899" />,
    badge: 'Brief Kilat & Estimasi',
    desc: 'Klik tombol "Mulai Proyek" di beranda untuk membuka formulir brief kreatif. Isi nama, brand, jenis layanan yang diinginkan, estimasi anggaran, serta link moodboard referensi visual Anda. Sistem kami akan langsung menyiapkan draft surat penawaran dan menghubungkan Anda ke WhatsApp tim kreatif kami.',
    step: 'Klik Mulai Proyek → Pilih Layanan & Budget → Isi Visi Singkat → Kirim & Lanjut WhatsApp'
  },
  {
    id: 'ct-10',
    title: 'Cara Memberikan Feedback & ACC Desain di Proofing Canvas',
    icon: <MousePointerClick size={20} color="#8b5cf6" />,
    badge: 'Review & Persetujuan',
    desc: 'Saat draft desain dikirimkan, buka tautan Proofing Canvas di layar Anda. Anda dapat mengklik titik visual mana saja pada gambar desain untuk menyematkan catatan revisi spesifik. Jika desain telah sesuai keinginan, klik tombol "ACC & Setujui" untuk serah terima file final.',
    step: 'Buka Link Proofing → Klik Titik Desain untuk Catatan → Tinjau Revisi → Klik ACC Desain'
  },
  {
    id: 'ct-11',
    title: 'Cara Menyerahkan File Materi via Client Asset Drop',
    icon: <Upload size={20} color="#06b6d4" />,
    badge: 'Pengiriman Materi',
    desc: 'Punya file logo vektor, materi foto produk HD, atau dokumen brief teks? Kunjungi rute /asset-drop lalu seret berkas Anda (drag & drop) secara langsung. Sistem secara otomatis mencatat dan menyimpan aset Anda ke vault studio tanpa risiko file terkompresi.',
    step: 'Buka /asset-drop → Masukkan Nama & ID Proyek → Drag & Drop Berkas → Notifikasi Terkirim'
  },
  {
    id: 'ct-12',
    title: 'Cara Melakukan Checkout Multi-Item di /checkout',
    icon: <ShoppingCart size={20} color="#10b981" />,
    badge: 'Checkout & Kasir',
    desc: 'Saat memilih produk digital atau jasa di /katalog, Anda dapat menambahkannya ke keranjang dan meninjau seluruh item di /checkout. Sistem akan menghitung total dengan kode unik verifikasi anti-fraud, lalu Anda dapat mengonfirmasikan bukti transfer ke WhatsApp admin dalam 1 klik.',
    step: 'Pilih Produk di /katalog → Masuk ke /checkout → Cek Kode Unik & Rekening → Konfirmasi WA'
  },
  {
    id: 'ct-13',
    title: 'Menyampaikan Testimoni & Review di /feedback',
    icon: <Heart size={20} color="#ec4899" />,
    badge: 'Ulasan Klien',
    desc: 'Setelah proyek desain selesai, Anda dapat memberikan rating bintang dan menceritakan pengalaman bekerjasama di /feedback. Ulasan terverifikasi berkesempatan tampil di etalase beranda studio dan berhak atas kupon diskon repeat-order.',
    step: 'Buka /feedback → Pilih Bintang Kepuasan → Tulis Testimoni Singkat → Kirim Ulasan'
  }
];

export const ECOSYSTEM_WORKFLOWS_DATA: WorkflowItem[] = [
  {
    id: 'wf-catalog-finance',
    title: 'Katalog Layanan ↔ Keuangan & Inventaris',
    badge: 'Otomatisasi Kasir',
    sourceModule: 'Katalog (/admin/catalog)',
    targetModule: 'Keuangan (/admin/transactions)',
    icon: <ShoppingBag size={20} color="#f59e0b" />,
    summary: 'Setiap kartu produk di Katalog kini memiliki tombol cepat "Buat Transaksi / Invoice". Saat transaksi baru disimpan di modul Keuangan, stok produk katalog akan otomatis berkurang secara real-time.',
    steps: [
      'Pilih produk apa pun di Katalog (/admin/catalog) lalu klik ikon Nota (Receipt)',
      'Sistem otomatis membuka formulir Kasir & Nota dengan nama, SKU, dan harga produk yang telah terisi',
      'Pilih status pembayaran (Lunas, DP, atau Quotation) lalu simpan transaksi',
      'Stok produk di katalog berkurang otomatis dan tercatat dalam audit transaksi'
    ],
    benefits: 'Mencegah ketidaksinkronan stok dan mempercepat proses penerbitan invoice kasir tanpa input manual berulang.'
  },
  {
    id: 'wf-booking-project',
    title: 'Jadwal Booking ↔ Kanban Proyek Studio',
    badge: 'Konversi Klien',
    sourceModule: 'Jadwal (/admin/schedule)',
    targetModule: 'Proyek Kanban (/admin/projects)',
    icon: <FolderGit2 size={20} color="#8b5cf6" />,
    summary: 'Calon klien yang menjadwalkan konsultasi dari formulir website dapat langsung dikonversi menjadi kartu kerja proyek aktif di Kanban Board hanya dengan satu klik.',
    steps: [
      'Buka menu Jadwal Booking (/admin/schedule) untuk melihat janji temu baru',
      'Klik tombol "Ke Proyek" pada kartu jadwal konsultasi klien',
      'Sistem otomatis membuat kartu Proyek baru berisi nama klien, kontak, jadwal pertemuan, dan catatan kebutuhan',
      'Buka papan Kanban untuk mulai menugaskan sub-task dan memantau kemajuan pengerjaan'
    ],
    benefits: 'Memastikan tidak ada calon klien atau brief konsultasi yang tercecer dari alur kerja tim kreatif.'
  },
  {
    id: 'wf-project-invoice',
    title: 'Proyek Kanban ↔ Penerbitan Faktur & Invoice',
    badge: 'Penagihan Proyek',
    sourceModule: 'Proyek Kanban (/admin/projects)',
    targetModule: 'Keuangan (/admin/transactions)',
    icon: <CreditCard size={20} color="#6366f1" />,
    summary: 'Buat tagihan termin atau pelunasan proyek langsung dari jendela detail proyek, baik melalui tampilan Desktop maupun menu aksi Mobile.',
    steps: [
      'Buka kartu proyek apa pun di modul Proyek Kanban (/admin/projects)',
      'Klik tombol "Buat Invoice / Nota" di bilah atas modal atau menu aksi mobile',
      'Modul Keuangan otomatis terbuka dengan nama proyek, anggaran (budget), kontak klien, dan deadline terisi otomatis',
      'Unduh faktur dalam format PDF beresolusi tinggi atau unggah langsung ke Google Drive'
    ],
    benefits: 'Memudahkan penagihan DP dan termin proyek secara profesional tanpa risiko salah ketik nominal.'
  },
  {
    id: 'wf-chat-crm',
    title: 'Live Chat Konsultasi ↔ CRM Kontak & Nota Kilat',
    badge: 'Live CRM & Sales',
    sourceModule: 'Live Chat (/admin/chat)',
    targetModule: 'Database Klien & Keuangan',
    icon: <MessageSquare size={20} color="#10b981" />,
    summary: 'Saat berdiskusi dengan calon klien di panel Live Chat, admin dapat langsung menyimpan kontak klien ke database CRM atau langsung menerbitkan nota penawaran.',
    steps: [
      'Buka percakapan aktif di ruang obrolan Live Chat (/admin/chat)',
      'Klik ikon "Simpan Kontak Klien" (UserPlus) di bilah atas untuk mendaftarkannya ke database kontak klien',
      'Klik ikon "Buat Nota / Invoice" (Receipt) untuk langsung membuat draf penawaran harga sesuai diskusi obrolan',
      'Kirim tautan faktur atau konfirmasi langsung ke klien melalui ruang obrolan'
    ],
    benefits: 'Mengubah percakapan obrolan menjadi prospek penjualan dan data pelanggan terstruktur secara instan.'
  },
  {
    id: 'wf-client-portal',
    title: 'Portal Akun Klien (/akun) ↔ Transparansi Proyek & Faktur',
    badge: 'Pengalaman Klien',
    sourceModule: 'Portal Klien (/akun)',
    targetModule: 'Database Studio',
    icon: <UserCheck size={20} color="#38bdf8" />,
    summary: 'Klien dapat masuk ke portal mandiri di /akun untuk melihat riwayat invoice resmi, memantau kemajuan proyek, serta mengakses link launcher aplikasi kustom mereka.',
    steps: [
      'Klien mengakses halaman login di /akun dengan kredensial mereka',
      'Dashboard klien menyajikan tab Riwayat Transaksi, Proyek Aktif, dan Modul Apps',
      'Klien dapat mengunduh ulang berkas PDF nota pembayaran kapan pun secara mandiri',
      'Klien dapat memainkan atau meluncurkan web apps/game yang telah dilisensikan'
    ],
    benefits: 'Meningkatkan kepercayaan dan profesionalisme studio di mata klien korporat maupun perorangan.'
  },
  {
    id: 'wf-mobile-accessibility',
    title: 'Responsivitas Ekstrem Mobile & Aksesibilitas Terpadu',
    badge: 'Aksesibilitas Universal',
    sourceModule: 'Seluruh Layar Perangkat',
    targetModule: 'Core System Engine',
    icon: <Zap size={20} color="#ec4899" />,
    summary: 'Tampilan dashboard dan seluruh kartu modul telah dioptimalkan secara presisi untuk layar ponsel terkecil (280px–360px) tanpa scroll horizontal, dilengkapi navigasi keyboard dan gestur back native.',
    steps: [
      'Buka dashboard di layar gawai terkecil apa pun; tata letak grid dan flexbox menyesuaikan secara dinamis dengan 0 horizontal overflow',
      'Gunakan tombol keyboard `Escape` untuk menutup dialog, modal, dan jendela editor seketika',
      'Gunakan tombol keyboard `Enter` untuk konfirmasi cepat pada form popup',
      'Dukungan tombol kembali gawai native (Android back gesture & browser history stack) untuk menutup laci menu'
    ],
    benefits: 'Pengalaman penggunaan yang mulus, ringan, cepat, dan nyaman di semua perangkat mulai dari ponsel saku hingga monitor ultrawide.'
  },
  {
    id: 'wf-business-hub',
    title: 'Pusat Bisnis & Kontak ↔ Seluruh Ekosistem Studio & Transaksi',
    badge: 'Master Brand & Payment Hub',
    sourceModule: 'Pusat Bisnis (/admin/settings)',
    targetModule: 'Invoice, Transaksi, Kasir & Katalog',
    icon: <Building2 size={20} color="#38bdf8" />,
    summary: 'Satu kali konfigurasi rekening bank, QRIS, WhatsApp, dan kode unik anti-fraud langsung tersinkronisasi ke seluruh faktur transaksi, PDF nota, checkout katalog, dan portal klien.',
    steps: [
      'Buka Pusat Bisnis & Kontak di Admin Pengaturan untuk mengatur nomor rekening dan QRIS Cloudinary',
      'Aktifkan opsi "Kode Unik Verifikasi (3 Digit)" untuk pengamanan transfer bank otomatis',
      'Saat menerbitkan invoice di Keuangan (/admin/transactions), rekening dan QRIS resmi langsung tersemat rapi',
      'Klien menerima faktur dengan rincian rekening terpercaya dan QRIS siap scan di layar HP mereka'
    ],
    benefits: 'Menghilangkan kekeliruan nomor rekening, mencegah bukti transfer palsu (anti-fraud), dan menghemat biaya merchant MDR 0%.'
  },
  {
    id: 'wf-inquiry-kanban',
    title: 'Creative Brief Inquiry ↔ Proyek Kanban & Penawaran Harga',
    badge: 'Otomatisasi Lead-to-Project',
    sourceModule: 'Inquiry Form (/ & Modal Brief)',
    targetModule: 'Proyek (/admin/projects) & Transaksi',
    icon: <Sparkles size={20} color="#ec4899" />,
    summary: 'Pengisian formulir brief desain oleh calon klien otomatis membuat kartu proyek prospek (Pending ACC) di Kanban Proyek dan draf Surat Penawaran (Quotation) di modul Transaksi.',
    steps: [
      'Calon klien mengisi formulir brief (layanan, visi, estimasi budget, link moodboard)',
      'Sistem mencatat brief ke database dan langsung menjembataninya ke daftar Proyek & Transaksi',
      'Admin menerima notifikasi pill di dashboard dan dapat me-review brief dalam 1 klik',
      'Admin dapat langsung meng-ACC proyek, menerbitkan SPK Kontrak, atau mengirim chat WA otomatis'
    ],
    benefits: 'Siklus konversi lead menjadi proyek resmi naik drastis karena brief langsung terstruktur tanpa perlu salin-tempel manual.'
  },
  {
    id: 'wf-proofing-delivery',
    title: 'Proofing Review Kanvas ↔ SPK Legal & Serah Terima Aset',
    badge: 'Siklus Review & Rilis',
    sourceModule: 'Proofing Canvas (/client/proofing)',
    targetModule: 'SPK Kontrak & Vault Aset',
    icon: <MousePointerClick size={20} color="#8b5cf6" />,
    summary: 'Proses koreksi visual desain terintegrasi dengan proteksi watermark dinamis. Begitu klien menyetujui (ACC) di kanvas proofing, sistem siap menerbitkan pelunasan dan merilis link download master berkas.',
    steps: [
      'Tim studio mengunggah draft desain beresolusi tinggi ke kanvas proofing klien',
      'Klien menyematkan pin komentar di titik yang perlu disempurnakan (Draft V1, V2)',
      'Setelah revisi tuntas, klien mengklik tombol ACC & Tanda Tangan Persetujuan',
      'Watermark dilepas otomatis setelah invoice pelunasan diverifikasi lunas oleh studio'
    ],
    benefits: 'Mencegah kesalahpahaman revisi desain, melindungi karya dari pembajakan sebelum pelunasan, dan serah terima tuntas profesional.'
  },
  {
    id: 'wf-flashsale-cashier',
    title: 'Flash Sale Countdown ↔ Katalog & Kasir QRIS 0%',
    badge: 'Promo Kilat & Kasir',
    sourceModule: 'Flash Sale Engine (/admin/catalog)',
    targetModule: 'Etalase /katalog & Transaksi',
    icon: <Flame size={20} color="#ef4444" />,
    summary: 'Kampanye diskon kilat berbatas waktu otomatis memicu banner spotlight di beranda dan katalog. Saat klien checkout, potongan harga promo dan kode unik 3-digit langsung tertera di invoice.',
    steps: [
      'Admin mengaktifkan jadwal Flash Sale dengan persentase diskon dan kuota unit terbatas',
      'Banner hitung mundur (countdown) otomatis aktif di Beranda Publik dan Katalog',
      'Pengunjung checkout paket promo dengan harga diskon khusus yang terkunci',
      'Sistem menghasilkan kode unik anti-fraud pada tagihan QRIS 0% biaya potongan'
    ],
    benefits: 'Meningkatkan konversi penjualan paket digital dan template secara masif dalam momen kampanye terbatas.'
  },
  {
    id: 'wf-quick-drawer',
    title: 'Multitasking Slide Drawer: Catatan, Kalkulator, Invoice & WA Hub Seketika',
    badge: 'Produktivitas Multitask',
    sourceModule: 'Slide-Over Drawer (Seluruh Modul)',
    targetModule: 'Memo, Transaksi, WhatsApp & Sistem',
    icon: <Sparkles size={20} color="#3b82f6" />,
    summary: 'Drawer multitasking pop-out yang dapat dibuka dari halaman admin mana saja tanpa berpindah rute (Zero Context Loss). Menyediakan Memo Kilat, Kalkulator Tarif Studio, Generator Invoice Kilat, Template WhatsApp Cepat, dan Pemantau Status Sistem.',
    steps: [
      'Gunakan shortcut keyboard Ctrl+Shift+N (Memo), Ctrl+Shift+C (Kalkulator), Ctrl+Shift+I (Invoice), atau Ctrl+Shift+W (WhatsApp) dari mana saja',
      'Atau klik ikon bintang (Sparkles) pada dock alat sidebar bawah untuk memunculkan drawer',
      'Hitung tarif proyek dengan margin profit dan PPN, lalu klik "Jadikan Nota / Invoice" untuk langsung memindahkan nominal ke formulir tagihan',
      'Simpan catatan kilat yang langsung tersinkronisasi ke modul Memo secara otomatis'
    ],
    benefits: 'Admin dan tim kreatif dapat mencatat ide, menghitung harga, atau membuat nota tanpa harus menutup atau meninggalkan kanvas editor aktif.'
  },
  {
    id: 'wf-omni-action',
    title: 'Omni Action Bus & Keyboard Shortcuts: Navigasi Tanpa Hambatan',
    badge: 'Akselerasi Keyboard',
    sourceModule: 'Command Palette (Ctrl + K)',
    targetModule: 'Seluruh Ekosistem Studio',
    icon: <Zap size={20} color="#ec4899" />,
    summary: 'Akses cepat menyeluruh dengan Command Center terpadu. Dukungan hotkey sekuensial linear (g + p ke Proyek, g + f ke Finansial, g + c ke Katalog, g + d ke Dashboard) dan aksi instan satu ketukan.',
    steps: [
      'Tekan Ctrl + K (atau Cmd + K) di mana pun untuk membuka Command Palette',
      'Pilih atau ketik nama aksi cepat: buat proyek, tambah produk, tulis memo kilat, atau buka preview multi-perangkat',
      'Gunakan tombol navigasi sekuensial cepat (g + key) untuk melompat antar modul dalam hitungan milidetik',
      'Tekan tanda tanya (?) untuk memunculkan cheatsheet lengkap seluruh shortcut yang tersedia'
    ],
    benefits: 'Memangkas waktu kerja berulang hingga 70% dengan meminimalkan ketergantungan pada klik kursor mouse.'
  },
  {
    id: 'wf-cart-checkout',
    title: 'Keranjang Belanja Multi-Item ↔ Kasir Invoice & Kode Unik Anti-Fraud',
    badge: 'E-Commerce & Kasir',
    sourceModule: 'Etalase Katalog (/katalog & /checkout)',
    targetModule: 'Modul Keuangan (/admin/transactions) & WhatsApp',
    icon: <ShoppingCart size={20} color="#10b981" />,
    summary: 'Klien memilih beberapa paket atau produk digital sekaligus, masuk ke keranjang /checkout, dan sistem otomatis menghasilkan tagihan invoice dengan kode unik anti-fraud serta direct notification ke WhatsApp.',
    steps: [
      'Pengunjung memasukkan paket jasa atau template dari etalase /katalog ke keranjang belanja',
      'Pada halaman /checkout, rincian biaya, kupon diskon, dan kode unik 3-digit dihitung otomatis',
      'Setelah menekan tombol "Bayar Sekarang", draf invoice resmi otomatis terbuat di modul Keuangan',
      'Pesan konfirmasi berisi rincian rekening studio dan total tagihan siap dikirim via WhatsApp dalam 1 ketukan'
    ],
    benefits: 'Memfasilitasi transaksi multi-item bebas ribet, meminimalkan human-error salah nominal, dan mencegah bukti transfer palsu.'
  },
  {
    id: 'wf-custom-forms-leads',
    title: 'Form Maker AI ↔ Leads Prospek & Proyek Studio',
    badge: 'AI Forms & Prospek',
    sourceModule: 'Form Maker (/admin/forms & /form/:id)',
    targetModule: 'Kanban Proyek (/admin/projects) & Database',
    icon: <ClipboardList size={20} color="#8b5cf6" />,
    summary: 'Formulir survei, RSVP acara, atau brief spesifik dibuat dengan bantuan AI Gemini. Respon yang diisi audiens otomatis tercatat dan dapat langsung dikonversi menjadi kartu pengerjaan proyek di Kanban.',
    steps: [
      'Admin membuat formulir kustom melalui prompt AI Form Generator di /admin/forms',
      'Tautan publik /form/:id dibagikan kepada audiens melalui WhatsApp atau media sosial',
      'Setiap respon masuk tercatat real-time dan dapat diekspor ke file Excel (.xlsx)',
      'Data responden yang memesan jasa dapat langsung di-ACC untuk melahirkan kartu proyek baru'
    ],
    benefits: 'Otomatisasi pengumpulan data riset dan brief klien tanpa batasan format kaku, siap olah di spreadsheet kapan saja.'
  },
  {
    id: 'wf-client-brand-vault',
    title: 'Brankas Aset Klien (Brand Vault) ↔ Kanvas Proofing & Serah Terima Final',
    badge: 'Arsip & Serah Terima',
    sourceModule: 'Client Asset Drop (/asset-drop & /admin/vault)',
    targetModule: 'Kanban Proyek & Proofing Canvas',
    icon: <Database size={20} color="#0ea5e9" />,
    summary: 'Materi logo vektor dan foto produk HD yang dikirimkan klien tanpa login di /asset-drop langsung terorganisir di Brankas Aset. Desainer menghubungkannya ke kanvas proofing hingga serah terima file final.',
    steps: [
      'Klien menyerahkan file mentah (AI, SVG, PNG HD) melalui portal /asset-drop',
      'Sistem mengarsipkan file ke folder Brand Vault klien secara otomatis tanpa kompresi',
      'Desainer mengambil materi untuk olah desain dan mengunggah preview ke kanvas proofing',
      'Setelah invoice pelunasan terverifikasi, watermark kanvas terbuka dan file master siap diunduh'
    ],
    benefits: 'Menghindari resiko file terkompresi atau tercecer di WhatsApp, alur serah terima berkas menjadi rapi dan aman.'
  },
  {
    id: 'wf-events-interactive',
    title: 'Undangan Digital & Photobooth ↔ Event Activation & Guest Check-In',
    badge: 'Aktivasi Acara & Apps',
    sourceModule: 'Undangan Web (/invitation/:slug) & Photobooth',
    targetModule: 'Apps Studio (/admin/apps) & Buku Tamu',
    icon: <PartyPopper size={20} color="#ec4899" />,
    summary: 'Ekosistem interaktif menyeluruh untuk event organizer dan wedding: mulai dari undangan digital responsif, konfirmasi RSVP, QR Code tiket masuk, hingga photo booth strip interaktif di lokasi acara.',
    steps: [
      'Klien mengonfigurasi website undangan interaktif di /admin/invitation dengan musik & galeri',
      'Tamu menerima link /invitation/:slug, mengisi RSVP, dan menerima QR Code check-in pribadi',
      'Di lokasi acara, panitia memindai QR tamu untuk validasi kehadiran di buku tamu digital',
      'Tamu menikmati photobooth web app di tablet dengan frame cetak kustom berlogo acara'
    ],
    benefits: 'Solusi all-in-one aktivasi event modern yang memadukan engagement digital pra-acara dengan hiburan interaktif di hari-H.'
  },
  {
    id: 'wf-updates-social',
    title: 'Updates Feed & Stiker Ekspresif ↔ Spotlight Beranda & Komunitas Studio',
    badge: 'Micro-Content Hub',
    sourceModule: 'Updates Manager (/admin/updates)',
    targetModule: 'Beranda Publik & Linimasa /updates',
    icon: <Radio size={20} color="#f97316" />,
    summary: 'Studio membagikan cuplikan progress kerja, rilis template, dan slot booking via update mikro bergaya media sosial. Pengunjung dapat bereaksi dan langsung terhubung ke layanan komersial.',
    steps: [
      'Admin mempublikasikan status kilat dengan stiker ekspresif dan tagar kategori di /admin/updates',
      'Status otomatis muncul di feed linimasa publik (/updates) dan widget ticker beranda',
      'Pengunjung melihat aktivitas studio yang aktif dan dapat memberikan reaksi emoji instan',
      'Tautan pada status mengarahkan pembaca langsung ke katalog produk atau konsultasi chat'
    ],
    benefits: 'Membangun kepercayaan audiens melalui transparansi aktivitas harian studio tanpa harus menulis artikel blog panjang.'
  },
  {
    id: 'wf-proofing-zoom',
    title: 'Proofing Canvas ↔ Zoom Engine 1x–3x & Pin Anotasi Anti-Scroll',
    badge: 'Inspeksi Detail 120 FPS',
    sourceModule: 'Proofing Canvas (/client/proofing)',
    targetModule: 'Proyek Kanban (/admin/projects)',
    icon: <ZoomIn size={20} color="#8b5cf6" />,
    summary: 'Kanvas proofing desain kini dilengkapi toolbar pembesaran dinamis (1x, 1.5x, 2x, 3x) serta gesture touch-lock seluler. Klien dapat memeriksa detail mikro tipografi dan bleed kemasan tanpa distorsi layar.',
    steps: [
      'Buka tautan kanvas proofing proyek pada perangkat seluler, tablet, atau desktop',
      'Gunakan tombol Zoom In (+) atau slider skala untuk memperbesar area detail desain hingga 300%',
      'Saat mode pin revisi aktif, gestur sentuh viewport otomatis terkunci sehingga pinning pin akurat 100% pada piksel sasaran',
      'Klik tombol reset 100% kapan pun untuk mengembalikan pratinjau kanvas utuh'
    ],
    benefits: 'Memungkinkan review cetak dan kemasan dengan presisi milimeter langsung di browser tanpa perlu mengunduh aplikasi desain berat.'
  },
  {
    id: 'wf-exact-copy-checkout',
    title: 'Checkout Kasir ↔ Salin Nominal Persis & Kode Unik Anti-Fraud',
    badge: 'Akurasi Finansial 100%',
    sourceModule: 'Keranjang Belanja (/checkout)',
    targetModule: 'Keuangan & Kasir (/admin/transactions)',
    icon: <Copy size={20} color="#10b981" />,
    summary: 'Halaman checkout kini memiliki tombol satu-sentuhan "Salin Nominal Persis" lengkap dengan 3-digit kode unik verifikasi anti-fraud, disertai getaran haptik dan konfirmasi visual instan.',
    steps: [
      'Pengunjung memasukkan paket desain atau template ke keranjang lalu menuju /checkout',
      'Sistem otomatis membuat kalkulasi total akhir termasuk kode unik verifikasi 3 digit acak',
      'Klien cukup mengetuk tombol "Salin Nominal Persis" untuk menyalin angka tepat ke clipboard',
      'Transfer bank klien cocok 100% dengan log mutasi studio tanpa salah ketik'
    ],
    benefits: 'Mencegah mutasi bank gagal terverifikasi akibat salah nominal atau lupa memasukkan kode unik pembayaran.'
  },
  {
    id: 'wf-unified-4-hubs',
    title: '4 Hub Terpadu CMS ↔ Navigasi Cepat & Command Palette Sync',
    badge: 'Arsitektur CMS 2026',
    sourceModule: 'Admin Sidebar & Dock',
    targetModule: 'Command Center (Ctrl + K)',
    icon: <Layers size={20} color="#38bdf8" />,
    summary: 'Seluruh 25+ modul studio dikelompokkan ke dalam 4 Pilar Terpadu: Studio & Ops, Kreatif & Showcase, Klien & Transaksi, serta Sistem & Panduan dengan sinkronisasi aktif dan pencarian instan.',
    steps: [
      'Buka panel admin dan lihat navigasi sidebar yang kini tersusun rapi dalam 4 Hub logis',
      'Klik langsung Portfolio, Katalog, Blog, Apps Studio, atau Guideline dalam 1 ketukan tanpa menu tersembunyi',
      'Buka Command Palette (Ctrl + K) untuk langsung melompat ke hub dan modul mana pun dengan indikator badge kategori',
      'Status rute aktif otomatis menyorot modul dan hub yang sedang dikerjakan secara real-time'
    ],
    benefits: 'Menghilangkan kebingungan navigasi bagi tim studio, mempercepat alur kerja harian hingga 40%.'
  }
];

