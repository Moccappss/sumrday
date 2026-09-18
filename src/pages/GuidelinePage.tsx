import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, Search, Globe, Shield, ArrowUpRight, CheckCircle2,
  FolderGit2, BookOpen, ShoppingBag, Gamepad2, LayoutGrid, UserCheck, Link2,
  Sparkles, Database, Settings, FileText, CreditCard, MessageSquare,
  Radio, HardDrive, HelpCircle, Layers, ExternalLink, ArrowLeft,
  Lock, RefreshCw, Sun, Moon, Info, Zap, Lightbulb, Check, ChevronDown, ChevronUp,
  Star, Share2, Eye, Award, ArrowRight, ArrowLeftRight, Workflow,
  Building2, QrCode, ShieldCheck
} from 'lucide-react';
import { useWebsiteTheme } from '../hooks/useWebsiteTheme';
import { useLandingData } from '../components/landing/useLandingData';
import { useContextMenu } from '../components/admin/ContextMenuProvider';
import LPNavbar from '../components/landing/LPNavbar';
import SEOHelmet from '../components/SEOHelmet';

interface GuidelineItem {
  id: string;
  name: string;
  type: 'public' | 'admin' | 'core';
  route: string;
  badge: string;
  icon: React.ReactNode;
  summary: string;
  features: string[];
  tips: string;
}

const GUIDELINE_DATA: GuidelineItem[] = [
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
    id: 'adm-apps',
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

// ── TIPS & TRIK KHUSUS KLIEN (CLIENT GUIDE DATA) ──
const CLIENT_TIPS_DATA = [
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
  }
];

// ── PUSAT INTEGRASI & ALUR KERJA ANTAR-FITUR (ECOSYSTEM WORKFLOWS) ──
interface WorkflowItem {
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

const ECOSYSTEM_WORKFLOWS_DATA: WorkflowItem[] = [
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
  }
];

export default function GuidelinePage({ onSwitchPage, isEmbeddedInAdmin = false }: { onSwitchPage?: (page: string) => void; isEmbeddedInAdmin?: boolean }) {
  const navigate = useNavigate();
  const { data } = useLandingData();
  const { isDark } = useWebsiteTheme(data?.theme?.defaultMode);
  const { openContextMenu } = useContextMenu();
  
  const [filterType, setFilterType] = useState<'all' | 'public' | 'admin' | 'client_tips' | 'workflows'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (filterType === 'client_tips' || filterType === 'workflows') return [];
    const q = searchQuery.trim().toLowerCase();
    return GUIDELINE_DATA.filter(item => {
      const matchType = filterType === 'all' || item.type === filterType;
      if (!matchType) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.route.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.features.some(f => f.toLowerCase().includes(q))
      );
    });
  }, [filterType, searchQuery]);

  const filteredClientTips = useMemo(() => {
    if (filterType === 'public' || filterType === 'admin' || filterType === 'workflows') return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CLIENT_TIPS_DATA;
    return CLIENT_TIPS_DATA.filter(tip => 
      tip.title.toLowerCase().includes(q) ||
      tip.desc.toLowerCase().includes(q) ||
      tip.badge.toLowerCase().includes(q)
    );
  }, [filterType, searchQuery]);

  const filteredWorkflows = useMemo(() => {
    if (filterType === 'public' || filterType === 'admin' || filterType === 'client_tips') return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ECOSYSTEM_WORKFLOWS_DATA;
    return ECOSYSTEM_WORKFLOWS_DATA.filter(wf =>
      wf.title.toLowerCase().includes(q) ||
      wf.summary.toLowerCase().includes(q) ||
      wf.badge.toLowerCase().includes(q) ||
      wf.sourceModule.toLowerCase().includes(q) ||
      wf.targetModule.toLowerCase().includes(q)
    );
  }, [filterType, searchQuery]);

  const handleNavigate = (route: string) => {
    if (isEmbeddedInAdmin && onSwitchPage) {
      if (route.startsWith('/admin')) {
        const adminSlug = route.replace(/^\/admin\/?/, '') || 'dashboard';
        onSwitchPage(adminSlug);
        return;
      }
      window.open(route, '_blank');
      return;
    }
    if (route.startsWith('/admin')) {
      navigate(route);
    } else {
      navigate(route);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGuidelineContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e, {
      title: 'Panduan Sistem & Peta Situs',
      subtitle: `${GUIDELINE_DATA.length} modul terdata`,
      items: [
        {
          label: 'Tampilkan Semua Halaman',
          icon: <Compass size={15} color="#38bdf8" />,
          action: () => setFilterType('all')
        },
        {
          label: 'Hanya Website Publik',
          icon: <Globe size={15} color="#10b981" />,
          action: () => setFilterType('public')
        },
        {
          label: 'Hanya Admin CMS',
          icon: <Shield size={15} color="#8b5cf6" />,
          action: () => setFilterType('admin')
        },
        {
          label: 'Buka Tips & Trik Klien',
          icon: <Lightbulb size={15} color="#f59e0b" />,
          action: () => setFilterType('client_tips')
        },
        { separator: true, label: '' },
        {
          label: 'Scroll ke Atas',
          icon: <ChevronUp size={15} />,
          action: () => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        },
        {
          label: 'Buka Beranda Publik',
          icon: <ExternalLink size={15} color="#38bdf8" />,
          action: () => window.open('/', '_blank')
        }
      ]
    });
  };

  const accentColor = data?.theme?.accentColor || '#7c3aed';
  const bgColor = isDark ? '#08080f' : '#f8fafc';
  const cardBg = isDark ? '#11121c' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div 
      ref={containerRef}
      onContextMenu={handleGuidelineContextMenu}
      style={{ 
        width: '100%',
        height: isEmbeddedInAdmin ? '100%' : 'auto',
        minHeight: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        background: bgColor, 
        color: textColor, 
        transition: 'background-color 0.3s ease',
        boxSizing: 'border-box'
      }}
    >
      <SEOHelmet 
        title="Peta Situs, Panduan Fitur & Tips Klien — sumr.day Studio"
        description="Dokumentasi lengkap seluruh rute URL, modul Website Publik, panel kendali Admin CMS (Keuangan, Notes, Proyek, Apps), serta tips & trik khusus klien."
      />

      {!isEmbeddedInAdmin && (
        <LPNavbar 
          items={(data?.navbar?.items || []) as any}
          loginBtnLabel={data?.navbar?.loginBtnLabel || 'Masuk'}
          logoText={data?.navbar?.logoText}
          accentColor={accentColor}
        />
      )}

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: isEmbeddedInAdmin ? '24px 24px 80px' : '110px 20px 90px', boxSizing: 'border-box' }}>
        
        {/* ── HEADER UTAMA ── */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', 
            borderRadius: 100, background: `${accentColor}18`, border: `1px solid ${accentColor}35`, 
            color: accentColor, fontSize: 12.5, fontWeight: 800, marginBottom: 14 
          }}>
            <Compass size={15} />
            <span>Peta Arsitektur, Panduan Modul & Tips Klien</span>
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.02em', color: textColor }}>
            Panduan Fitur & Lokasi Halaman Website
          </h1>
          <p style={{ margin: '0 auto', maxWidth: 720, fontSize: 15, lineHeight: 1.65, color: subTextColor }}>
            Dokumentasi lengkap seluruh rute URL (<code style={{ color: accentColor, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 6 }}>/</code>), fitur inti Admin CMS (Keuangan, Catatan, Proyek, Apps Studio), navigasi langsung, serta panduan praktis & tips trik terbaik bagi Klien.
          </p>
        </div>

        {/* ── KARTU HIGHLIGHT PENTING ── */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 32 
        }}>
          {/* Tip 1: Tema Persisten */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f59e0b20', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sun size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: textColor }}>Tema Selalu Persisten</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: subTextColor }}>
              Pilihan tema Gelap / Terang Anda tersimpan permanen di peramban dan <strong>tidak akan kembali ke mode awal</strong> saat Anda berpindah halaman.
            </p>
          </div>

          {/* Tip 2: Pembaruan Rute Apps */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ec489920', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayoutGrid size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: textColor }}>Rute Baru: /apps</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: subTextColor }}>
              Fitur Game kini menggunakan rute resmi <code style={{ color: '#ec4899', fontWeight: 700 }}>/apps</code> di website publik dan <code style={{ color: '#ec4899', fontWeight: 700 }}>/admin/apps</code> di CMS. Rute lama dialihkan otomatis.
            </p>
          </div>

          {/* Tip 3: Hapus Massal & Context Menu */}
          <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#10b98120', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: textColor }}>Tandai & Hapus Massal</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: subTextColor }}>
              Setiap modul berkas banyak (Notes, Chat, Portfolio, Blog, Catalog, Apps) kini dilengkapi <strong>kotak centang tandai</strong> dan tombol <strong>Hapus Ditandai</strong> massal.
            </p>
          </div>
        </div>

        {/* ── KONTROL PENCARIAN & TAB FILTER ── */}
        <div style={{ 
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', 
          gap: 12, marginBottom: 26, padding: '14px 18px', background: cardBg, 
          borderRadius: 16, border: `1px solid ${cardBorder}` 
        }}>
          {/* Tab Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Semua Modul' },
              { id: 'workflows', label: '⚡ Alur Integrasi Terpadu' },
              { id: 'public', label: 'Website Publik' },
              { id: 'admin', label: 'Admin CMS' },
              { id: 'client_tips', label: '🌟 Tips & Trik Klien' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                style={{
                  padding: '7px 15px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: filterType === tab.id ? `1.5px solid ${accentColor}` : `1px solid ${cardBorder}`,
                  background: filterType === tab.id ? accentColor : 'transparent',
                  color: filterType === tab.id ? '#ffffff' : subTextColor,
                  transition: 'all 0.18s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 380 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
            <input 
              type="text"
              placeholder="Cari rute, fitur (keuangan, notes, dll)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 10,
                border: `1px solid ${cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                color: textColor,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* ── BAGIAN UTAMA: ALUR KERJA & KONEKSI ANTAR-FITUR ── */}
        {(filterType === 'all' || filterType === 'workflows') && (
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.18)', color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Workflow size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: textColor }}>
                  Pusat Integrasi & Alur Fitur Terpadu (Ecosystem Workflow)
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: subTextColor }}>
                  Bagaimana modul Katalog, Keuangan, Proyek, Booking, Chat, dan Portal Klien saling terkoneksi otomatis tanpa input ganda.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {filteredWorkflows.map(wf => (
                <div 
                  key={wf.id}
                  style={{
                    background: cardBg,
                    border: `1.5px solid ${cardBorder}`,
                    borderRadius: 18,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.35)' : '0 4px 14px rgba(0,0,0,0.04)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {wf.icon}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 900, color: textColor }}>
                            {wf.title}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: subTextColor, marginTop: 3 }}>
                            <span>{wf.sourceModule}</span>
                            <ArrowRight size={10} color={accentColor} />
                            <span>{wf.targetModule}</span>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 850, padding: '3px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.12)', color: accentColor, whiteSpace: 'nowrap' }}>
                        {wf.badge}
                      </span>
                    </div>

                    {/* Summary */}
                    <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: subTextColor }}>
                      {wf.summary}
                    </p>

                    {/* Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: textColor }}>
                        Alur Kerja Otomatis:
                      </div>
                      {wf.steps.map((st, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: subTextColor, lineHeight: 1.5 }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>
                            {sIdx + 1}
                          </span>
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div style={{
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    fontSize: 12,
                    fontWeight: 650,
                    color: '#10b981'
                  }}>
                    ✨ <strong>Manfaat:</strong> {wf.benefits}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BAGIAN KHUSUS: TIPS & TRIK UNTUK KLIEN ── */}
        {(filterType === 'all' || filterType === 'client_tips') && (
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.18)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: textColor }}>
                  Tips & Trik Khusus Klien (Client Guide)
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: subTextColor }}>
                  Panduan praktis berinteraksi dengan studio, memesan jasa, mencoba demo aplikasi, dan memantau status pesanan.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {filteredClientTips.map(tip => (
                <div 
                  key={tip.id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 18,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {tip.icon}
                        </div>
                        <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: textColor }}>
                          {tip.title}
                        </h3>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', whiteSpace: 'nowrap' }}>
                        {tip.badge}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: subTextColor }}>
                      {tip.desc}
                    </p>
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9',
                    border: `1px solid ${cardBorder}`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: accentColor
                  }}>
                    🎯 <strong>Langkah:</strong> {tip.step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DAFTAR KARTU FITUR & RUTE LENGKAP ── */}
        {filterType !== 'client_tips' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accentColor}18`, color: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: textColor }}>
                  Katalog Seluruh Halaman & Modul Sistem
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: subTextColor }}>
                  {filteredItems.length} modul teridentifikasi — Dilengkapi tombol navigasi langsung ke masing-masing halaman.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {filteredItems.map(item => (
                <div 
                  key={item.id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 18,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.3)' : '0 4px 14px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    {/* Header Kartu */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 42, height: 42, borderRadius: 12, 
                          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                          {item.icon}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: textColor }}>{item.name}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ 
                              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, 
                              background: item.type === 'public' ? 'rgba(56,189,248,0.15)' : 'rgba(139,92,246,0.15)',
                              color: item.type === 'public' ? '#38bdf8' : '#8b5cf6' 
                            }}>
                              {item.badge}
                            </span>
                            <code style={{ fontSize: 12, fontWeight: 800, color: accentColor }}>
                              {item.route}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: subTextColor }}>
                      {item.summary}
                    </p>

                    {/* Daftar Fitur Lengkap */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: subTextColor, marginBottom: 6 }}>
                        Fitur & Kapabilitas Inti:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.65, color: textColor }}>
                        {item.features.map((f, idx) => (
                          <li key={idx} style={{ marginBottom: 3 }}>{f}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Petunjuk Penggunaan */}
                    <div style={{ 
                      padding: '9px 12px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9', 
                      border: `1px solid ${cardBorder}`, fontSize: 12, color: subTextColor, lineHeight: 1.5, marginBottom: 16 
                    }}>
                      💡 <strong>Tips Pro:</strong> {item.tips}
                    </div>
                  </div>

                  {/* Tombol Aksi Langsung */}
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.route)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 12,
                      border: `1px solid ${accentColor}40`,
                      background: `${accentColor}15`,
                      color: textColor,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.18s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = accentColor;
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${accentColor}15`;
                      e.currentTarget.style.color = textColor;
                    }}
                  >
                    <span>Buka {item.type === 'public' ? 'Halaman Publik' : 'Modul Admin'}</span>
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredItems.length === 0 && filterType !== 'client_tips' && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: subTextColor }}>
            <Compass size={38} style={{ opacity: 0.4, marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 17, color: textColor }}>Tidak ada rute atau modul yang cocok</h3>
            <p style={{ margin: 0, fontSize: 13 }}>Coba kata kunci lain atau pilih tab filter 'Semua Modul'.</p>
          </div>
        )}

      </main>
    </div>
  );
}
