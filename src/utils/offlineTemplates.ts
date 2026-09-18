/**
 * Offline Templates Library for Project Management & Notes / Memo
 * Provides a massive repository of 115+ production-ready, beautifully structured templates
 * that work 100% locally with 0 internet and 0 AI tokens.
 */

export interface OfflineProjectTemplate {
  id: string;
  label: string;
  category: 'design' | 'web' | 'business' | 'marketing' | 'content' | 'social' | 'video';
  icon: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  estimatedDays: number;
  tasks: string[];
  notes: string;
  caseStudyHtml?: string;
  prompt: string;
  type?: 'project' | 'content';
  platform?: string;
  format?: string;
}

export interface OfflineNoteTemplate {
  id: string;
  label: string;
  category: 'design' | 'business' | 'tasks' | 'marketing' | 'personal';
  folder: 'ideas' | 'clients' | 'tasks' | 'general';
  tags: string[];
  color: 'default' | 'purple' | 'sky' | 'emerald' | 'amber' | 'rose';
  title: string;
  content: string;
  prompt: string;
}

// ─────────────────────────────────────────────────────────────
// 1. OFFLINE PROJECT & CONTENT TEMPLATES (100+ Comprehensive Presets)
// ─────────────────────────────────────────────────────────────
export const OFFLINE_PROJECT_TEMPLATES: OfflineProjectTemplate[] = [
  // ── KONTEN MEDIA SOSIAL & CREATOR (25+ Presets) ──
  {
    id: 'content_reels_viral_hook',
    label: 'Instagram Reels: 3 Hook Rahasia Bisnis',
    category: 'content',
    icon: 'Sparkles',
    type: 'content',
    platform: 'instagram',
    format: 'reels',
    title: '3 Rahasia Desain Brand Mewah Tanpa Biaya Mahal',
    description: 'Naskah video Reels 30-45 detik dengan visual hook 3 detik pertama, poin pembahasan inti, dan call-to-action ke bio.',
    priority: 'high',
    tags: ['Instagram', 'Reels', 'Viral Hook', 'Branding'],
    estimatedDays: 1,
    tasks: [
      'Hook Visual: Tunjukkan Before-After drastis dalam 2.5 detik pertama',
      'Scripting: Masukkan 3 poin actionable tanpa basa-basi',
      'Shooting / Screen Recording demo visual',
      'Editing: Tambahkan auto-captions dinamis & sound trending',
      'Penyusunan Copywriting caption & 5 hashtag tertarget',
      'Jadwalkan upload pada jam prime time (19:00 WIB)'
    ],
    notes: 'Gunakan teks headline kontras tinggi pada 3 detik pertama untuk mempertahankan retensi penonton di atas 70%.',
    prompt: 'Buatkan naskah video pendek Reels/TikTok berdurasi 30 detik dengan hook kuat tentang tips desain dan branding.'
  },
  {
    id: 'content_tiktok_storytime',
    label: 'TikTok: Storytime Studi Kasus Klien',
    category: 'content',
    icon: 'Video',
    type: 'content',
    platform: 'tiktok',
    format: 'reels',
    title: 'Bagaimana Klien Ini Meningkatkan Penjualan 300% Setelah Redesign',
    description: 'Format narasi storytelling yang menceritakan tantangan nyata klien, proses solusi yang kami berikan, dan hasil akhirnya.',
    priority: 'medium',
    tags: ['TikTok', 'Storytelling', 'Case Study'],
    estimatedDays: 1,
    tasks: [
      'Hook Emosional: Ceritakan masalah fatal yang dialami klien',
      'Bahas langkah solusi konkret yang kita terapkan',
      'Tampilkan data grafik / bukti screenshot testimoni',
      'CTA: Ajak audiens konsultasi gratis via link bio',
      'Pemberian efek sound dramatis & transisi cepat'
    ],
    notes: 'Pastikan emosi cerita otentik dan fokus pada transformasi nilai bukan sekadar estetika.',
    prompt: 'Buatkan konsep video TikTok bertema storytime transformasi bisnis klien setelah menggunakan jasa kreatif kami.'
  },
  {
    id: 'content_carousel_edu_guide',
    label: 'Carousel Edukasi: 5 Kesalahan Fatal',
    category: 'content',
    icon: 'Layers',
    type: 'content',
    platform: 'instagram',
    format: 'carousel',
    title: '5 Kesalahan Desain Logo yang Membuat Brand Terlihat Murahan',
    description: 'Rangkaian slide carousel 7-10 halaman dengan headline provokatif, pembahasan mendalam per slide, dan slide penutup CTA simpan/bagikan.',
    priority: 'high',
    tags: ['Instagram', 'Carousel', 'Edukasi', 'Design Tips'],
    estimatedDays: 2,
    tasks: [
      'Slide 1: Headline kontras tinggi + visual pemikat',
      'Slide 2-6: Breakdown 5 poin kesalahan beserta contoh solusi benarnya',
      'Slide 7: Rangkuman ringkas (Actionable Summary)',
      'Slide 8: Profile branding & Call To Action "Save post ini untuk referensi!"',
      'Desain layout konsisten di Figma (1080x1350 px)',
      'Export 1080x1350 PNG & drafting caption lengkap'
    ],
    notes: 'Rasio 4:5 (1080x1350) memberikan area pandang 25% lebih luas di feed Instagram.',
    prompt: 'Buatkan naskah dan alur slide carousel Instagram 7 slide tentang 5 kesalahan fatal desain brand.'
  },
  {
    id: 'content_youtube_case_study',
    label: 'YouTube: Breakdown Portofolio Proyek',
    category: 'content',
    icon: 'Film',
    type: 'content',
    platform: 'youtube',
    format: 'article',
    title: 'Behind The Scenes: Proses Lengkap Redesign Brand dari Nol',
    description: 'Video komprehensif YouTube 8-12 menit yang mengupas tuntas metodologi desain, wawancara brief, tantangan teknis, dan serah terima.',
    priority: 'medium',
    tags: ['YouTube', 'Long-form', 'Behind The Scenes', 'Tutorial'],
    estimatedDays: 4,
    tasks: [
      'Penyusunan outline video (Intro, Problem, Ideation, Execution, Final Reveal, Outro)',
      'Perekaman voiceover / A-roll berbicara di depan kamera',
      'Screen capture proses kerja di Figma / Adobe Illustrator (B-roll)',
      'Editing video: Color grading, background music lo-fi, dan motion graphics',
      'Desain Thumbnail YouTube CTR tinggi dengan ekspresi wajah & teks 3 kata',
      'Optimasi SEO Judul, Deskripsi lengkap dengan timestamps, dan Tags'
    ],
    notes: 'Timestamps wajib dicantumkan di deskripsi untuk meningkatkan retensi dan SEO YouTube.',
    prompt: 'Buatkan struktur naskah video YouTube 10 menit dokumentasi studi kasus desain proyek agensi kreatif.'
  },
  {
    id: 'content_promo_launch_campaign',
    label: 'Kampanye Promo: Launching Layanan Baru',
    category: 'content',
    icon: 'Rocket',
    type: 'content',
    platform: 'instagram',
    format: 'carousel',
    title: 'Peluncuran Paket Eksklusif Branding & Web Kilat 2026',
    description: 'Seri konten kampanye launching yang terdiri dari fase Teaser (H-3), Announcement (Hari H), dan Urgency/Last Call (H+2).',
    priority: 'high',
    tags: ['Campaign', 'Launching', 'Promotion', 'Limited Offer'],
    estimatedDays: 3,
    tasks: [
      'Fase 1 (Teaser): Postingan cerita masalah umum & hitung mundur',
      'Fase 2 (Launch): Video pengumuman fitur + penawaran khusus slot terbatas',
      'Fase 3 (Social Proof): Testimoni early bird & FAQ penjelasan detail',
      'Fase 4 (Closing): Reminder 24 jam sebelum slot promo ditutup',
      'Persiapan form pendaftaran / direct WhatsApp gateway'
    ],
    notes: 'Batasi kuota atau waktu promo secara nyata untuk menciptakan urgensi yang jujur.',
    prompt: 'Buatkan rangkaian kampanye peluncuran paket layanan baru selama 3 hari berurutan di media sosial.'
  },
  {
    id: 'content_behind_the_scenes',
    label: 'Reels / Shorts: A Day in The Life Studio',
    category: 'content',
    icon: 'Camera',
    type: 'content',
    platform: 'tiktok',
    format: 'reels',
    title: 'Sehari Menjadi Desainer Agensi: Dari Ngopi Sampai Deadline 02:00',
    description: 'Konten santai dan relatable yang memperlihatkan kultur kerja studio kreatif, setup meja, dan kebiasaan produktif.',
    priority: 'low',
    tags: ['Behind The Scenes', 'Vlog', 'Studio Life'],
    estimatedDays: 1,
    tasks: [
      'Ambil cuplikan B-roll estetis (seduh kopi, menyalakan laptop, sketsa)',
      'Cuplikan time-lapse mendesain di layar',
      'Voiceover santai dengan cerita ringan / tips produktivitas',
      'Color filter clean minimalis & audio chillhop'
    ],
    notes: 'Kualitas pencahayaan alami di pagi hari memberikan nuansa sinematik yang disukai penonton.',
    prompt: 'Buatkan konsep naskah video pendek A Day In My Life desainer kreatif untuk TikTok/Reels.'
  },
  {
    id: 'content_myth_vs_fact',
    label: 'Post Mitos vs Fakta Industri Kreatif',
    category: 'content',
    icon: 'Lightbulb',
    type: 'content',
    platform: 'instagram',
    format: 'single',
    title: 'Mitos: Desain Mahal Pasti Rumit vs Fakta: Yang Mahal Itu Kejelasan!',
    description: 'Konten single image / carousel perbandingan sisi kiri vs sisi kanan yang mematahkan stigma keliru tentang dunia bisnis kreatif.',
    priority: 'medium',
    tags: ['Myth Busting', 'Edukasi', 'Perspective'],
    estimatedDays: 1,
    tasks: [
      'Tentukan 1 mitos paling umum yang merugikan klien / pasar',
      'Jelaskan alasan logis mengapa mitos tersebut salah',
      'Berikan fakta lapangan yang membuka wawasan audiens',
      'Ajak diskusi di kolom komentar: "Kalian pernah ngalamin yang mana?"'
    ],
    notes: 'Konten perdebatan sehat mendorong jumlah komentar hingga 3x lipat postingan biasa.',
    prompt: 'Buatkan postingan komparasi Mitos vs Fakta seputar harga dan proses pembuatan website profesional.'
  },

  // ── DESAIN & BRANDING (15 Templates) ──
  {
    id: 'brand_identity',
    label: 'Brand Identity & Logo Master',
    category: 'design',
    icon: 'PenTool',
    title: 'Perancangan Brand Identity & Desain Logo Lengkap',
    description: 'Proyek perancangan identitas visual komprehensif mulai dari riset pasar, eksplorasi logo primer/sekunder, palet warna, tipografi, hingga pembuatan brand guideline.',
    priority: 'high',
    tags: ['Branding', 'Logo', 'Visual Identity'],
    estimatedDays: 14,
    tasks: [
      'Discovery call & pengumpulan creative brief klien',
      'Riset kompetitor visual & pembuatan moodboard konsep',
      'Sketsa kasar & eksplorasi 3 arah konsep logo',
      'Digitalisasi vektor (Figma / Illustrator)',
      'Penentuan sistem warna (HEX, RGB, CMYK) & tipografi',
      'Penerapan mockup visual (stationery, merchandise, signage)',
      'Penyusunan dokumen Brand Guideline resmi (PDF)',
      'Export & serah terima file master (AI, EPS, SVG, PNG transparan)'
    ],
    notes: 'Pastikan file master memiliki outline font dan format warna CMYK untuk keperluan cetak serta RGB untuk digital.',
    prompt: 'Buatkan rencana proyek perancangan identitas visual & desain logo brand profesional dari riset hingga brand guideline.'
  },
  {
    id: 'packaging_design',
    label: 'Desain Kemasan / Packaging Box',
    category: 'design',
    icon: 'Layers',
    title: 'Desain Kemasan Produk & Labeling Siap Cetak',
    description: 'Pembuatan desain kemasan produk (box/pouch/botol) dengan layout pola potong (dieline), informasi gizi/legalitas, dan mockup visual 3D.',
    priority: 'high',
    tags: ['Packaging', 'Print', 'Product Design'],
    estimatedDays: 10,
    tasks: [
      'Pemeriksaan ukuran dimensi fisik & template dieline kemasan',
      'Eksplorasi 2 konsep layout visual kemasan depan & belakang',
      'Integrasi informasi barcode, legalitas BPOM, dan komposisi',
      'Rendering mockup 3D fotorealistis untuk presentasi klien',
      'Revisi & penyesuaian detail bahan cetak (foil, emboss, doff/glossy)',
      'Pre-flight check warna CMYK 300 DPI dan bleed cetak',
      'Finalisasi file print-ready PDF dengan layer cut/crease terpisah'
    ],
    notes: 'Cek toleransi bleed minimal 3mm dan pastikan teks ukuran kecil terbaca jelas pada skala 100%.',
    prompt: 'Buatkan rencana pengerjaan desain kemasan produk packaging lengkap dengan dieline dan persiapan pra-cetak.'
  },
  {
    id: 'stationery_pack',
    label: 'Stationery & Company Assets',
    category: 'design',
    icon: 'FileText',
    title: 'Desain Stationery & Perlengkapan Kantor Perusahaan',
    description: 'Pengerjaan identitas cetak kantor meliputi kartu nama eksekutif, kop surat resmi, amplop berbagai ukuran, map folder presentasi, dan ID card karyawan.',
    priority: 'medium',
    tags: ['Stationery', 'Corporate', 'Print'],
    estimatedDays: 6,
    tasks: [
      'Penetapan standar grid & penempatan logo pada media stationery',
      'Desain kartu nama 2 sisi dengan spot UV / foil accent',
      'Desain kop surat formal (A4) format Word & PDF cetak',
      'Desain amplop standar (DL & C4)',
      'Desain map folder presentasi dengan kantong kartu nama',
      'Desain ID card karyawan & lanyard template',
      'Pre-flight check warna CMYK dan export PDF resolusi tinggi'
    ],
    notes: 'Pastikan file template Word kop surat memiliki margin header/footer yang terkunci.',
    prompt: 'Buatkan rencana desain stationery perusahaan lengkap dari kartu nama hingga kop surat.'
  },
  {
    id: 'social_media_pack',
    label: 'Paket Desain Media Sosial 30 Hari',
    category: 'design',
    icon: 'ImageIcon',
    title: 'Paket Konten Visual & Template Social Media 30 Hari',
    description: 'Produksi rangkaian aset grafis media sosial (Instagram Feed, Carousel Edukasi, Story, Banner Promosi) dengan template siap pakai.',
    priority: 'medium',
    tags: ['Social Media', 'Content Design', 'Instagram'],
    estimatedDays: 7,
    tasks: [
      'Penyusunan pilar konten & kalender tema visual bulanan',
      'Perancangan master template carousel edukasi (1080x1350)',
      'Pembuatan 12 aset desain feed grafis informatif',
      'Pembuatan 6 template Instagram Stories interaktif',
      'Penyusunan panduan copy & call-to-action (CTA)',
      'Pengecekan konsistensi visual grid Instagram',
      'Export aset format PNG resolusi tinggi & upload ke Google Drive'
    ],
    notes: 'Gunakan rasio 4:5 untuk feed agar visibilitas di timeline optimal tanpa terpotong.',
    prompt: 'Buatkan rencana produksi paket konten media sosial 30 hari mencakup feed, carousel, dan story.'
  },
  {
    id: 'brochure_catalog',
    label: 'Brosur & Katalog Cetak Produk',
    category: 'design',
    icon: 'FileText',
    title: 'Desain Brosur Lipat & Katalog Produk Multi-Halaman',
    description: 'Perancangan materi pemasaran cetak berupa brosur tri-fold atau booklet katalog produk lengkap dengan layout tabel spesifikasi harga dan foto resolusi tinggi.',
    priority: 'medium',
    tags: ['Brochure', 'Catalog', 'Print Marketing'],
    estimatedDays: 8,
    tasks: [
      'Penyusunan struktur halaman, daftar isi & hierarki informasi',
      'Kurasi dan touch-up foto produk resolusi tinggi',
      'Desain layout grid halaman sampul & halaman dalam',
      'Penyusunan tabel spesifikasi teknis dan daftar harga',
      'Pemberian nomor halaman otomatis dan header/footer rapi',
      'Pemeriksaan resolusi gambar (minimal 300 DPI) & warna CMYK',
      'Export file PDF cetak (Press Quality) & versi interaktif (Web)'
    ],
    notes: 'Sediakan margin dalam (gutter) yang cukup jika dijilid kawat atau binding lem panas.',
    prompt: 'Buatkan rencana pengerjaan desain katalog produk multi-halaman siap cetak.'
  },
  {
    id: 'rebranding_master',
    label: 'Rebranding & Audit Visual',
    category: 'design',
    icon: 'Palette',
    title: 'Transformasi Rebranding & Modernisasi Visual Bisnis',
    description: 'Proyek audit mendalam terhadap aset brand yang ada, penataan ulang posisi visual (repositioning), dan peremajaan seluruh titik sentuh brand (brand touchpoints).',
    priority: 'high',
    tags: ['Rebranding', 'Audit Brand', 'Strategy'],
    estimatedDays: 21,
    tasks: [
      'Audit menyeluruh aset visual lama & identifikasi kelemahan',
      'Wawancara stakeholder & riset persepsi pelanggan saat ini',
      'Penyusunan Brand Architecture & Visual Direction baru',
      'Desain logo baru / refreshment elemen kunci',
      'Redesain stationery perusahaan (kartu nama, kop surat, map)',
      'Redesain aset digital (website, email template, sosial media)',
      'Penyusunan Brand Transition Roadmap untuk peluncuran',
      'Pelatihan tim internal mengenai panduan brand baru'
    ],
    notes: 'Dokumentasikan perbandingan before/after untuk mempermudah sosialisasi brand baru ke publik.',
    prompt: 'Buatkan rencana transformasi rebranding dan modernisasi visual bisnis secara menyeluruh.'
  },
  {
    id: 'mascot_character',
    label: 'Desain Maskot & Ilustrasi Brand',
    category: 'design',
    icon: 'Sparkles',
    title: 'Perancangan Karakter Maskot & Set Ilustrasi Brand',
    description: 'Kreasi karakter maskot brand yang ikonik dengan berbagai variasi ekspresi, pose aksi, pakaian musiman, dan integrasi ke dalam materi promosi.',
    priority: 'medium',
    tags: ['Mascot', 'Illustration', 'Character Design'],
    estimatedDays: 12,
    tasks: [
      'Penyusunan persona, kepribadian & backstory karakter maskot',
      'Eksplorasi sketsa kasar anatomi dan siluet karakter',
      'Pemilihan palet warna karakter sesuai brand guidelines',
      'Digitalisasi vektor karakter pose utama (Front, Side, 3/4 View)',
      'Pembuatan 6 variasi ekspresi emosi (Senang, Semangat, Berpikir, dll)',
      'Pembuatan 4 variasi pose interaksi dengan produk',
      'Penyusunan panduan penggunaan maskot (Do & Don\'t)',
      'Export aset vektor SVG, AI dan PNG resolusi 4K'
    ],
    notes: 'Pastikan siluet maskot mudah dikenali bahkan dalam ukuran kecil (misal: stiker WhatsApp).',
    prompt: 'Buatkan rencana perancangan karakter maskot brand dari konsep hingga set pose aksi.'
  },
  {
    id: 'merchandise_apparel',
    label: 'Desain Merchandise & Kaos Kantor',
    category: 'design',
    icon: 'Layers',
    title: 'Desain Paket Merchandise & Apparel Eksklusif',
    description: 'Desain koleksi merchandise promosi dan seragam tim (kaos, hoodie, tumbler, tote bag, stiker, lanyard, notebook) siap sablon/bordir.',
    priority: 'low',
    tags: ['Merchandise', 'Apparel', 'Branding'],
    estimatedDays: 5,
    tasks: [
      'Penetapan jenis item merchandise & batas area sablon/cetak',
      'Desain grafis kaos & hoodie (depan, belakang, lengan)',
      'Desain laser engrave tumbler & botol minum',
      'Desain tote bag kain kanvas & patch bordir',
      'Desain paket stiker vinyl tahan air (die-cut set)',
      'Pembuatan mockup presentasi merchandise fotorealistis',
      'Penyusunan lembar spesifikasi teknis sablon untuk vendor konveksi'
    ],
    notes: 'Sertakan kode warna Pantone (PMS) agar hasil sablon akurat dengan warna brand.',
    prompt: 'Buatkan rencana pengerjaan desain merchandise dan apparel kantor siap produksi.'
  },
  {
    id: 'booth_expo_banner',
    label: 'Desain Booth Pameran & Banner',
    category: 'design',
    icon: 'Monitor',
    title: 'Desain Booth Pameran, Backdrop & Roll-Up Banner',
    description: 'Perancangan materi visual pameran dagang (expo booth, backdrop photobooth, roll banner, meja resepsionis) skala besar dengan resolusi tajam.',
    priority: 'high',
    tags: ['Exhibition', 'Booth', 'Large Format Print'],
    estimatedDays: 7,
    tasks: [
      'Pemeriksaan ukuran bidang cetak booth 3x3m / backdrop',
      'Perancangan pesan kunci & headline keterbacaan jarak 5 meter',
      'Desain backdrop utama dengan logo sponsor dan tagline',
      'Desain 2 unit roll-up banner penjelas produk (85x200cm)',
      'Desain meja counter pendaftaran & display flyer',
      'Simulasi visual layout booth 3D',
      'Pengecekan resolusi 150 DPI skala 1:1 format TIFF/PDF CMYK'
    ],
    notes: 'Letakkan logo dan informasi kontak penting di atas ketinggian 1 meter agar tidak tertutup orang berdiri.',
    prompt: 'Buatkan rencana desain booth pameran expo dan banner promosi skala besar.'
  },
  {
    id: 'ebook_digital_pub',
    label: 'Desain E-Book & Publikasi Digital',
    category: 'design',
    icon: 'FileText',
    title: 'Tata Letak E-Book Edukasi & Lead Magnet Bisnis',
    description: 'Layouting buku digital interaktif dengan desain cover menarik, daftar isi berkait (clickable), tipografi nyaman dibaca, dan infografis ringkas.',
    priority: 'medium',
    tags: ['E-Book', 'Layout', 'Lead Magnet'],
    estimatedDays: 6,
    tasks: [
      'Penyusunan master template halaman (grid, margin, running head)',
      'Desain cover e-book 3D & 2D',
      'Layouting konten teks 15-20 halaman dengan visual pendukung',
      'Pembuatan 3 infografis penjelasan konsep kunci',
      'Pemasangan hyperlink internal dan tombol Call-to-Action interaktif',
      'Optimasi ukuran file PDF (di bawah 5MB) tanpa menurunkan ketajaman',
      'Pembuatan aset cover promo untuk media sosial & landing page'
    ],
    notes: 'Pastikan kontras teks nyaman dibaca baik di layar smartphone maupun tablet.',
    prompt: 'Buatkan rencana pengerjaan tata letak e-book digital dan lead magnet bisnis.'
  },
  {
    id: 'restaurant_menu',
    label: 'Desain Menu Restoran & Kafe',
    category: 'design',
    icon: 'Layers',
    title: 'Desain Menu Kuliner & Papan Menu Digital (Menu Board)',
    description: 'Perancangan buku menu fisik berestetika tinggi dan layout menu board TV digital untuk restoran/kafe dengan penataan kategori strategis.',
    priority: 'medium',
    tags: ['Menu Design', 'F&B', 'Culinary'],
    estimatedDays: 5,
    tasks: [
      'Penyusunan kategori menu & penetapan item unggulan (Chef\'s Recommendation)',
      'Kurasi & editing foto makanan/minuman agar tampak menggugah selera',
      'Desain tata letak buku menu 4 halaman (Layout Eye-Magnet)',
      'Desain versi digital menu board TV 16:9 Full HD',
      'Penyusunan QR Code menu digital untuk meja pelanggan',
      'Pre-flight cetak dengan bahan anti-air (laminasi doff/hardcover)',
      'Finalisasi file print PDF & PNG resolusi layar'
    ],
    notes: 'Terapkan teknik menu engineering untuk menempatkan menu dengan profit tertinggi di sudut kanan atas.',
    prompt: 'Buatkan rencana pembuatan desain buku menu restoran dan menu board digital.'
  },
  {
    id: 'billboard_ooh',
    label: 'Desain Billboard & Reklame OOH',
    category: 'design',
    icon: 'Monitor',
    title: 'Desain Billboard Reklame Luar Ruang & LED Megatron',
    description: 'Desain iklan luar ruang (Out-Of-Home) berdaya ingat tinggi dengan pesan ringkas 5 detik, kontras visual kuat, dan adaptasi format horizontal/vertikal.',
    priority: 'high',
    tags: ['Billboard', 'OOH', 'Advertising'],
    estimatedDays: 4,
    tasks: [
      'Analisa lokasi pemasangan & sudut pandang pengendara jalan',
      'Perumusan pesan singkat maksimal 7 kata yang berdampak',
      'Desain visual billboard horizontal (misal: 4x8m / 5x10m)',
      'Desain adaptasi LED videotron digital (1920x1080)',
      'Simulasi visual pada foto lokasi asli (day & night mockup)',
      'Pre-flight check resolusi cetak large format CMYK',
      'Serah terima file master ke biro reklame'
    ],
    notes: 'Hindari teks panjang; fokus pada satu visual dominan dan satu nomor/alamat web yang sangat mudah diingat.',
    prompt: 'Buatkan rencana desain iklan reklame billboard luar ruang dan videotron.'
  },
  {
    id: 'product_3d_render',
    label: '3D Product Visual & Realistic Render',
    category: 'design',
    icon: 'Palette',
    title: 'Pembuatan Visual 3D Produk & Studio Lighting Render',
    description: 'Modeling 3D produk, penerapan tekstur material fotorealistis, pencahayaan studio sinematik, dan rendering multi-angle untuk portofolio atau e-commerce.',
    priority: 'high',
    tags: ['3D Design', 'Product Render', 'Blender'],
    estimatedDays: 9,
    tasks: [
      'Pengumpulan referensi dimensi teknis & blueprint produk',
      '3D Poly Modeling objek produk dengan topologi rapi',
      'Penerapan shader material (kaca, logam, tekstur plastik matte)',
      'Penataan pencahayaan studio 3-titik & bayangan lembut',
      'Rendering kamera multi-angle (Front, Perspective, Close-up Detail)',
      'Post-processing & color grading di Photoshop',
      'Export file resolusi 4K format PNG transparan & JPEG'
    ],
    notes: 'Simpan file shader material untuk kebutuhan rendering varian warna produk lainnya di masa depan.',
    prompt: 'Buatkan rencana pengerjaan visual 3D produk realistis dengan rendering studio.'
  },
  {
    id: 'motion_logo_intro',
    label: 'Motion Graphic & Logo Animation',
    category: 'design',
    icon: 'Sparkles',
    title: 'Animasi Logo & Bumper Video Pembuka (Logo Stinger)',
    description: 'Pembuatan animasi gerak logo berdurasi 3-5 detik dengan efek suara sinematik untuk intro video YouTube, presentasi, dan materi promosi media sosial.',
    priority: 'medium',
    tags: ['Motion Graphic', 'After Effects', 'Animation'],
    estimatedDays: 5,
    tasks: [
      'Penyusunan storyboard alur gerak animasi 3 detik',
      'Pemisahan layer vektor logo di Illustrator',
      'Penganimasian keyframe di After Effects (Easing & Snap)',
      'Penambahan efek partikel, glow halus, dan transisi keluar',
      'Sinkronisasi efek suara (SFX whoosh/ding) & audio branding',
      'Export video format MP4 H.264 (Web) dan MOV ProRes 4444 (Transparan)',
      'Pembuatan versi animasi GIF berulang (Looping)'
    ],
    notes: 'Pastikan durasi animasi tidak lebih dari 5 detik agar penonton tidak merasa bosan sebelum konten utama.',
    prompt: 'Buatkan rencana produksi animasi motion graphic logo bumper video profesional.'
  },
  {
    id: 'brand_guideline_doc',
    label: 'Brand Guidelines Standar Korporat',
    category: 'design',
    icon: 'FileText',
    title: 'Penyusunan Dokumen Brand Guidelines Korporat Lengkap',
    description: 'Buku panduan standar merek 30+ halaman mencakup filosofi logo, clear space, minimum size, palet warna primer/sekunder, hierarki tipografi, dan contoh penerapan keliru.',
    priority: 'high',
    tags: ['Brand Guidelines', 'Standards', 'Manual'],
    estimatedDays: 10,
    tasks: [
      'Penyusunan bab Filosofi Merek, Visi, Misi & Karakter Suara Brand',
      'Dokumentasi konstruksi logo, safe zone area, dan minimum size',
      'Spesifikasi kode warna resmi (Pantone, CMYK, RGB, HEX)',
      'Panduan sistem tipografi (Primary, Secondary, Web Fallback)',
      'Aturan penggunaan fotografi dan gaya ilustrasi pendukung',
      'Halaman larangan penerapan logo yang salah (Incorrect Usage)',
      'Kompilasi layout panduan dalam format buku PDF interaktif',
      'Export dokumen master siap cetak & versi digital'
    ],
    notes: 'Berikan contoh visual konkret untuk setiap larangan penggunaan agar mudah dipahami tim non-desainer.',
    prompt: 'Buatkan rencana penyusunan buku brand guidelines komprehensif untuk korporat.'
  },

  // ── UI/UX & DESAIN DIGITAL (10 Templates) ──
  {
    id: 'ui_ux_redesign',
    label: 'Redesain UI/UX Web & Apps',
    category: 'design',
    icon: 'Layout',
    title: 'Redesain Antarmuka Pengguna & Pengalaman Pengguna (UI/UX)',
    description: 'Peningkatan alur interaksi pengguna, modernisasi desain visual, pembuatan komponen design system, dan prototipe interaktif di Figma.',
    priority: 'high',
    tags: ['UI/UX', 'Figma', 'Product Design'],
    estimatedDays: 18,
    tasks: [
      'Heuristic evaluation & analisa masalah UX pada aplikasi saat ini',
      'Perancangan Information Architecture & User Flow baru',
      'Pembuatan Wireframe Low-Fidelity untuk validasi alur',
      'Penyusunan Design System (Colors, Typography, UI Components)',
      'Pengerjaan High-Fidelity UI Design untuk seluruh layar',
      'Pembuatan Interactive Prototype di Figma',
      'Sesi Usability Testing dengan 5 pengguna potensial',
      'Handoff ke tim developer dengan spesifikasi aset & flow'
    ],
    notes: 'Gunakan auto-layout Figma dan beri penamaan layer yang terstruktur untuk mempermudah slicing developer.',
    prompt: 'Buatkan rencana proyek redesain UI/UX lengkap mulai dari user flow, design system, prototyping hingga handoff.'
  },
  {
    id: 'mobile_app_design',
    label: 'Desain Aplikasi Mobile (iOS & Android)',
    category: 'design',
    icon: 'Layout',
    title: 'Perancangan UI/UX Aplikasi Mobile Native & Hybrid',
    description: 'Desain lengkap alur aplikasi mobile dari Splash Screen, Onboarding, Authentication, Dashboard Utama, Detail Transaksi, hingga Halaman Akun.',
    priority: 'high',
    tags: ['Mobile UI', 'iOS', 'Android'],
    estimatedDays: 15,
    tasks: [
      'Riset panduan Human Interface Guidelines (iOS) & Material You (Android)',
      'Pembuatan User Journey Map untuk 3 persona pengguna kunci',
      'Perancangan 25+ layar UI High-Fidelity (Light & Dark Mode)',
      'Desain komponen micro-interactions & status bar responsif',
      'Pembuatan alur prototyping navigasi tab bar & bottom sheet',
      'Pengujian ergonomi jempol (Thumb Zone Testing)',
      'Export aset ikon @1x, @2x, @3x dan SVG untuk developer'
    ],
    notes: 'Pertahankan target ukuran tombol minimal 44x44pt agar nyaman ditekan pada layar sentuh.',
    prompt: 'Buatkan rencana pengerjaan desain UI aplikasi mobile lengkap dari onboarding hingga checkout.'
  },
  {
    id: 'design_system_lib',
    label: 'Design System & UI Kit Figma',
    category: 'design',
    icon: 'Workflow',
    title: 'Pembangunan Design System & UI Kit Berskala Besar',
    description: 'Membangun pustaka komponen UI terpusat di Figma mencakup Design Tokens, Typography Styles, Buttons, Form Inputs, Modals, dan Tables dengan fitur Auto-Layout.',
    priority: 'high',
    tags: ['Design System', 'Figma Tokens', 'UI Kit'],
    estimatedDays: 14,
    tasks: [
      'Definisi Design Tokens (Warna, Spacing, Radius, Shadow, Elevation)',
      'Penyusunan Typography Scale & Line-height token',
      'Pembuatan komponen Button dengan seluruh state (Default, Hover, Active, Disabled)',
      'Pembuatan komponen Input Form, Checkbox, Radio, Switch, Dropdown',
      'Pembuatan komponen Navigasi (Header, Sidebar, Pagination, Breadcrumb)',
      'Penerapan Figma Component Properties & Variants',
      'Penyusunan dokumentasi pedoman penggunaan komponen di Zeroheight / Figma',
      'Publikasi ke Figma Team Library & sosialisasi tim'
    ],
    notes: 'Pastikan seluruh komponen memenuhi standar kontras aksesibilitas WCAG 2.1 AA.',
    prompt: 'Buatkan rencana pembuatan design system dan UI kit modular di Figma.'
  },
  {
    id: 'wireframe_prototype',
    label: 'Wireframing & Interactive Prototype',
    category: 'design',
    icon: 'Layout',
    title: 'Wireframing Cepat & Prototipe Interaktif Validasi Ide',
    description: 'Pembuatan wireframe struktural low-to-mid fidelity untuk menguji fungsionalitas dan logika alur sebelum masuk ke fase visual polish.',
    priority: 'medium',
    tags: ['Wireframe', 'Prototype', 'UX Validation'],
    estimatedDays: 6,
    tasks: [
      'Pemetaan skenario skenario tugas pengguna (Task Flow)',
      'Sketsa wireframe kasar di whiteboard / paper',
      'Digitalisasi wireframe grayscale di Figma',
      'Penyusunan hirarki informasi & peletakan tombol aksi utama',
      'Penghubungan link interaktif & transisi slide/overlay',
      'Sesi walkthrough demo prototipe bersama stakeholder',
      'Pencatatan feedback dan perbaikan struktur alur'
    ],
    notes: 'Fokus pada fungsi dan kemudahan alur; hindari berdebat soal warna di tahap wireframe.',
    prompt: 'Buatkan rencana pengerjaan wireframe dan prototipe interaktif untuk validasi ide bisnis.'
  },
  {
    id: 'ux_research_audit',
    label: 'Usability Testing & Audit UX Riset',
    category: 'design',
    icon: 'Monitor',
    title: 'Audit Pengalaman Pengguna (UX Audit) & Usability Testing',
    description: 'Evaluasi mendalam terhadap gesekan alur (friction points), analisis drop-off funnels, pengujian kegunaan bersama responden nyata, dan rekomendasi perbaikan.',
    priority: 'high',
    tags: ['UX Audit', 'Usability Testing', 'Research'],
    estimatedDays: 8,
    tasks: [
      'Penyusunan skenario tes usability & kriteria responden',
      'Perekrutan 5 peserta uji coba sesuai target demografi',
      'Pelaksanaan sesi moderated usability testing (Think Aloud protocol)',
      'Analisa rekaman sesi, heatmaps, dan titik kebingungan pengguna',
      'Pemberian skor System Usability Scale (SUS Score)',
      'Penyusunan laporan temuan masalah (Severity 1-4)',
      'Rekomendasi solusi desain berbasis data (Actionable Insights)'
    ],
    notes: 'Menguji 5 pengguna sudah cukup untuk menemukan 85% masalah kegunaan utama pada antarmuka.',
    prompt: 'Buatkan rencana pelaksanaan audit UX dan usability testing aplikasi secara komprehensif.'
  },
  {
    id: 'dashboard_analytics_ui',
    label: 'Desain Dashboard Admin & Analitik',
    category: 'design',
    icon: 'Monitor',
    title: 'Perancangan Antarmuka Dashboard Admin & Visualisasi Data',
    description: 'Desain portal analitik data padat informasi dengan grafik interaktif, ringkasan KPI cards, tabel filter canggih, dan manajemen izin pengguna.',
    priority: 'high',
    tags: ['Dashboard', 'Analytics', 'Data Viz'],
    estimatedDays: 12,
    tasks: [
      'Identifikasi metrik kunci (KPIs) yang paling sering dilihat pengguna',
      'Perancangan layout grid modular bento untuk widget statistik',
      'Desain berbagai jenis grafik (Line chart, Bar, Donut, Heatmap)',
      'Desain komponen tabel data dengan fitur sorting, filtering, dan export',
      'Desain modal detail data dan form input inline',
      'Penerapan mode gelap (Dark Mode) untuk kenyamanan pemantauan lama',
      'Penyusunan spesifikasi responsif untuk layar laptop & ultrawide'
    ],
    notes: 'Gunakan palet warna grafik yang mudah dibedakan dan tidak melelahkan mata saat dipantau berjam-jam.',
    prompt: 'Buatkan rencana desain antarmuka dashboard admin dan analitik data bisnis.'
  },
  {
    id: 'custom_icon_set',
    label: 'Desain Icon Set Kustom & Vektor',
    category: 'design',
    icon: 'PenTool',
    title: 'Perancangan 50+ Ikon Kustom Khusus Identitas Brand',
    description: 'Pembuatan set ikon vektor orisinil berbasis grid 24px dengan 3 variasi gaya (Outline, Solid, Duotone) yang konsisten dengan tipografi merek.',
    priority: 'medium',
    tags: ['Icons', 'Vector', 'Iconography'],
    estimatedDays: 7,
    tasks: [
      'Penetapan grid acuan dasar (24x24px dengan safe margin 2px)',
      'Penentuan ketebalan garis (stroke weight) dan sudut kurva (corner radius)',
      'Perancangan 20 ikon navigasi dasar (Home, Search, User, Settings, dll)',
      'Perancangan 30 ikon khusus domain industri klien',
      'Eksplorasi versi Fill / Solid dan Duotone',
      'Pengecekan konsistensi visual visual weight di ukuran 16px dan 32px',
      'Export set ikon format SVG, Iconjar, dan Font Icon (.woff2)'
    ],
    notes: 'Pastikan seluruh anchor point di-snap ke pixel grid agar tepi ikon tidak blur pada layar resolusi standar.',
    prompt: 'Buatkan rencana pembuatan set ikon vektor kustom 50+ item yang konsisten.'
  },
  {
    id: 'landing_ui_slicing',
    label: 'Landing Page UI Slicing Siap Dev',
    category: 'design',
    icon: 'Code',
    title: 'Desain Landing Page Terstruktur Siap Slicing Developer',
    description: 'Desain landing page modern dengan struktur section rapi, penamaan layer standar semantik HTML, auto-layout penuh, dan panduan aset animasi.',
    priority: 'medium',
    tags: ['Landing UI', 'Slicing Ready', 'Figma to Code'],
    estimatedDays: 6,
    tasks: [
      'Penyusunan wireframe konversi (Hero, Social Proof, Features, FAQ, CTA)',
      'Penerapan sistem grid 12 kolom (Bootstrap / Tailwind layout)',
      'Pengerjaan desain visual high-fidelity desktop (1440px) & mobile (375px)',
      'Penerapan Figma Auto-Layout di seluruh grup dan komponen',
      'Pemberian anotasi spesifikasi efek hover, scroll reveal, dan padding',
      'Export seluruh gambar aset dalam format SVG dan WebP teroptimasi',
      'Sesi walkthrough handoff dengan tim frontend developer'
    ],
    notes: 'Hindari efek visual yang sulit diimplementasikan secara performan dalam kode CSS murni.',
    prompt: 'Buatkan rencana desain UI landing page siap slicing developer dengan anotasi lengkap.'
  },
  {
    id: 'onboarding_flow_ux',
    label: 'Onboarding Flow & UX Aktivasi',
    category: 'design',
    icon: 'Sparkles',
    title: 'Desain Alur Onboarding & Aktivasi Pengguna Baru',
    description: 'Perancangan pengalaman pertama pengguna (First-Time User Experience / FTUX) yang mulus untuk meningkatkan tingkat retensi dan mengurangi drop-off saat registrasi.',
    priority: 'medium',
    tags: ['Onboarding', 'UX Retention', 'Product Growth'],
    estimatedDays: 7,
    tasks: [
      'Pemetaan momen "Aha!" kunci yang harus dialami pengguna baru',
      'Penyederhanaan form registrasi (Social Login Google / Apple)',
      'Desain 3 slide pengenalan nilai utama produk (Value Proposition)',
      'Desain alur personalisasi preferensi pengguna (Questionnaire flow)',
      'Pembuatan interaktif interactive tooltip panduan fitur pertama kali',
      'Desain empty state yang memotivasi pengguna melakukan tindakan pertama',
      'Uji coba prototipe alur pendaftaran dalam waktu di bawah 60 detik'
    ],
    notes: 'Biarkan pengguna mencoba fitur inti sebelum meminta verifikasi data yang rumit.',
    prompt: 'Buatkan rencana perancangan alur onboarding aplikasi yang memikat dan mudah.'
  },
  {
    id: 'responsive_tablet_web',
    label: 'Adaptasi Layout Tablet & Responsif',
    category: 'design',
    icon: 'Monitor',
    title: 'Adaptasi Desain Responsif Tablet, Foldable & Desktop Lebar',
    description: 'Penyesuaian tata letak antarmuka agar tampil proporsional di seluruh breakpoint perangkat (iPad 10.2", iPad Pro 12.9", Samsung Fold, Laptop 13", Layar 27").',
    priority: 'medium',
    tags: ['Responsive', 'Breakpoints', 'Adaptive UI'],
    estimatedDays: 5,
    tasks: [
      'Penetapan sistem breakpoint (Mobile <640px, Tablet 768-1024px, Desktop >1280px)',
      'Adaptasi navigasi dari drawer mobile ke floating sidebar tablet',
      'Penyesuaian tata letak kolom (1 kolom mobile -> 2 kolom tablet -> 3 kolom desktop)',
      'Pemeriksaan ukuran sentuh dan keterbacaan teks di tablet mode landscape',
      'Penyusunan panduan responsive behavior untuk tim frontend',
      'Uji coba mockup interaktif di simulator perangkat nyata'
    ],
    notes: 'Perhatikan area notch dan safe area pada tablet modern dengan bezel tipis.',
    prompt: 'Buatkan rencana adaptasi layout desain responsif untuk perangkat tablet dan desktop.'
  },

  // ── WEB & PENGEMBANGAN (15 Templates) ──
  {
    id: 'company_profile_web',
    label: 'Website Profil Perusahaan',
    category: 'web',
    icon: 'Code',
    title: 'Pengembangan Website Profil Perusahaan (Company Profile)',
    description: 'Pembuatan website profesional yang mencakup halaman Beranda, Tentang Kami, Layanan, Portofolio, Blog, dan Kontak dengan integrasi formulir pesan.',
    priority: 'high',
    tags: ['Web Dev', 'Company Profile', 'Frontend'],
    estimatedDays: 12,
    tasks: [
      'Penyusunan sitemap & struktur navigasi website',
      'Penulisan copywriting & kurasi foto aset perusahaan',
      'Pembuatan mockup desain UI responsive (Desktop & Mobile)',
      'Slicing frontend & implementasi animasi transisi halus',
      'Integrasi formulir kontak dengan email notifikasi / WhatsApp',
      'Optimasi SEO on-page (meta tags, sitemap.xml, schema markup)',
      'Testing kecepatan halaman (Google PageSpeed 90+)',
      'Deployment ke custom domain & setup sertifikat SSL'
    ],
    notes: 'Pastikan ukuran gambar teroptimasi format WebP untuk menjaga kecepatan load di bawah 2 detik.',
    prompt: 'Buatkan rencana pembuatan website company profile modern, responsif, dan teroptimasi SEO.'
  },
  {
    id: 'ecommerce_store',
    label: 'Toko Online / E-Commerce',
    category: 'web',
    icon: 'Workflow',
    title: 'Pengembangan Platform Toko Online (E-Commerce Store)',
    description: 'Pembangunan website toko online lengkap dengan katalog produk dinamis, keranjang belanja, checkout flow, payment gateway, dan kalkulator ongkir.',
    priority: 'high',
    tags: ['E-Commerce', 'Store', 'Payment Gateway'],
    estimatedDays: 20,
    tasks: [
      'Perancangan skema database produk, kategori & varian',
      'Desain UI katalog produk, halaman detail & keranjang',
      'Implementasi alur checkout & form data pengiriman',
      'Integrasi payment gateway (Midtrans / Xendit / QRIS)',
      'Integrasi API cek ongkir otomatis (RajaOngkir / ekspedisi)',
      'Pengembangan dashboard manajemen pesanan & inventaris',
      'Simulasi transaksi end-to-end (sandbox testing)',
      'Go-live & pelatihan operasional admin toko'
    ],
    notes: 'Pastikan notifikasi status pesanan via email atau WhatsApp otomatis terkirim setelah pembayaran sukses.',
    prompt: 'Buatkan rencana pengerjaan website toko online e-commerce lengkap dengan payment gateway dan pengiriman.'
  },
  {
    id: 'landing_page_leads',
    label: 'Landing Page Konversi Tinggi',
    category: 'web',
    icon: 'Zap',
    title: 'Landing Page Penjualan & Perolehan Prospek (High-Converting)',
    description: 'Halaman promosi fokus konversi tunggal dengan copywriting persuasif AIDA, hero section menarik, testimoni, FAQ, dan form leads instan.',
    priority: 'medium',
    tags: ['Landing Page', 'Conversion', 'Leads'],
    estimatedDays: 6,
    tasks: [
      'Riset target audiens & penulisan sales copy formula AIDA',
      'Desain visual hero banner dengan headline kuat',
      'Penyusunan section fitur, manfaat utama & keunggulan',
      'Integrasi social proof (testimoni video/teks, logo partner)',
      'Pembuatan form leads / tombol direct WhatsApp checkout',
      'Pemasangan tracking pixel (Meta Pixel, Google Tag Manager)',
      'Uji responsivitas di berbagai ukuran layar smartphone',
      'Peluncuran landing page & monitoring conversion rate'
    ],
    notes: 'Pertahankan Call-to-Action (CTA) konsisten di atas lipatan layar (above the fold) dan di bagian akhir.',
    prompt: 'Buatkan rencana peluncuran landing page konversi tinggi untuk promosi produk atau perolehan leads.'
  },
  {
    id: 'react_frontend_slicing',
    label: 'Web App Slicing React / Next.js',
    category: 'web',
    icon: 'Code',
    title: 'Slicing UI Figma ke Komponen React / Next.js Modern',
    description: 'Pengkodean desain Figma menjadi komponen frontend React yang modular, responsif, type-safe (TypeScript), dan berkinerja tinggi menggunakan Tailwind / Vanilla CSS.',
    priority: 'high',
    tags: ['React', 'Next.js', 'Frontend Slicing'],
    estimatedDays: 10,
    tasks: [
      'Inisialisasi arsitektur folder proyek React / Vite / Next.js',
      'Setup theme tokens, font Google, dan CSS variables global',
      'Pembuatan komponen atomik (Button, Input, Card, Modal, Badge)',
      'Slicing halaman utama & implementasi layout responsif',
      'Integrasi state management & mock data API',
      'Implementasi animasi transisi halus (Framer Motion / CSS)',
      'Lighthouse audit & pengujian cross-browser (Chrome, Safari, Firefox)',
      'Build bundling optimasi & deploy ke Vercel / Netlify'
    ],
    notes: 'Gunakan dynamic import untuk komponen berat guna meminimalkan initial bundle size.',
    prompt: 'Buatkan rencana pengerjaan slicing frontend React dari desain Figma hingga deployment.'
  },
  {
    id: 'portfolio_creative_web',
    label: 'Website Portofolio Kreatif',
    category: 'web',
    icon: 'Sparkles',
    title: 'Pengembangan Website Portofolio Kreatif & Interaktif',
    description: 'Pembuatan website portofolio profesional pribadi / agensi dengan showcase studi kasus mendalam, filter kategori interaktif, dark mode, dan CMS terintegrasi.',
    priority: 'medium',
    tags: ['Portfolio', 'Creative Web', 'Showcase'],
    estimatedDays: 8,
    tasks: [
      'Kurasi 8-10 karya terbaik dengan dokumentasi before/after',
      'Desain halaman Beranda dengan efek hero visual memikat',
      'Pengembangan halaman detail studi kasus dengan rich media',
      'Implementasi filter kategori portofolio instan tanpa reload',
      'Integrasi fitur toggle Dark/Light mode dengan penyimpanan lokal',
      'Integrasi formulir kontak penawaran proyek langsung ke WhatsApp',
      'Optimasi SEO nama personal / brand agensi',
      'Peluncuran website & update link di seluruh profil media sosial'
    ],
    notes: 'Sertakan metrik hasil nyata (misal: kenaikan penjualan klien) di setiap studi kasus portofolio.',
    prompt: 'Buatkan rencana pembuatan website portofolio kreatif interaktif untuk desainer atau agensi.'
  },
  {
    id: 'web_performance_seo',
    label: 'Audit Kecepatan & SEO Web',
    category: 'web',
    icon: 'Monitor',
    title: 'Audit Komprehensif Performa Kecepatan & SEO Website',
    description: 'Investigasi mendalam terhadap Core Web Vitals, optimalisasi aset gambar, caching, perbaikan error struktur SEO, dan ranking keyword.',
    priority: 'medium',
    tags: ['SEO', 'Performance', 'Optimization'],
    estimatedDays: 5,
    tasks: [
      'Audit PageSpeed Insights, GTmetrix & Google Search Console',
      'Kompresi & konversi seluruh gambar menjadi format WebP modern',
      'Minifikasi kode CSS/JS & eliminasi render-blocking resources',
      'Perbaikan meta title, description, dan struktur tag Heading (H1-H4)',
      'Implementasi Canonical URL, Sitemap XML, dan Robots.txt',
      'Pemeriksaan broken link (404) & setup redirect 301',
      'Pengujian ulang performa Core Web Vitals (LCP, FID, CLS)',
      'Penyusunan laporan hasil optimasi & rekomendasi lanjutan'
    ],
    notes: 'Targetkan skor performa minimal 90 di desktop dan 85 di mobile pada Google PageSpeed.',
    prompt: 'Buatkan rencana audit dan optimasi kecepatan serta SEO on-page website secara detail.'
  },
  {
    id: 'event_webinar_web',
    label: 'Website Registrasi Event & Webinar',
    category: 'web',
    icon: 'Zap',
    title: 'Website Pendaftaran Event, Tiket & Webinar Online',
    description: 'Landing page pendaftaran acara lengkap dengan jadwal sesi pembicara, hitung mundur (countdown timer), integrasi pembayaran tiket, dan e-ticket otomatis.',
    priority: 'medium',
    tags: ['Event', 'Webinar', 'Ticketing'],
    estimatedDays: 7,
    tasks: [
      'Desain hero section dengan tanggal, waktu, dan hitung mundur live',
      'Penyusunan profil pembicara & jadwal rundown acara terperinci',
      'Pembuatan paket tiket (Early Bird, Regular, VIP)',
      'Integrasi form data peserta & validasi email unik',
      'Integrasi payment gateway untuk pembelian tiket otomatis',
      'Setup pengiriman email konfirmasi instan dengan QR Code E-Ticket',
      'Pembuatan halaman konfirmasi sukses & tombol tambah ke Google Calendar',
      'Testing alur pendaftaran peserta dari awal hingga selesai'
    ],
    notes: 'Pasang auto-responder email pengingat H-1 dan H-1 jam sebelum acara dimulai.',
    prompt: 'Buatkan rencana pembuatan website registrasi event dan tiket webinar otomatis.'
  },
  {
    id: 'career_portal_web',
    label: 'Portal Lowongan Kerja / Career Page',
    category: 'web',
    icon: 'Briefcase',
    title: 'Pengembangan Halaman Karir & Penerimaan Pelamar (ATS)',
    description: 'Halaman portal lowongan kerja perusahaan dengan daftar posisi aktif, filter departemen, formulir upload CV resume, dan dashboard peninjauan pelamar.',
    priority: 'medium',
    tags: ['Careers', 'Recruitment', 'Portal'],
    estimatedDays: 9,
    tasks: [
      'Penyusunan narasi budaya kerja perusahaan, benefit, dan testimoni tim',
      'Desain UI daftar lowongan pekerjaan dengan filter divisi & lokasi',
      'Pengembangan halaman detail deskripsi pekerjaan & kualifikasi',
      'Pembuatan form aplikasi pelamar dengan upload file PDF resume',
      'Integrasi notifikasi email otomatis ke tim HR saat ada pelamar baru',
      'Penyusunan database pelamar terintegrasi di Google Sheets / CMS',
      'Testing formulir lamaran kerja di perangkat mobile'
    ],
    notes: 'Batasi ukuran upload file CV maksimal 5MB format PDF untuk mencegah kegagalan pengiriman.',
    prompt: 'Buatkan rencana pembuatan portal karir dan formulir lamaran kerja perusahaan.'
  },
  {
    id: 'booking_service_web',
    label: 'Web Booking & Reservasi Layanan',
    category: 'web',
    icon: 'Calendar',
    title: 'Website Reservasi Jadwal & Booking Layanan Online',
    description: 'Sistem pemesanan jadwal temu (konsultasi, klinik, salon, studio) dengan pemilihan tanggal/jam interaktif, pencegahan jadwal ganda, dan sinkronisasi kalender.',
    priority: 'high',
    tags: ['Booking', 'Reservation', 'Appointments'],
    estimatedDays: 11,
    tasks: [
      'Perancangan alur pemilihan jenis layanan, terapis/konsultan, dan durasi',
      'Pengembangan kalender interaktif pemilih tanggal & slot jam yang tersedia',
      'Implementasi logika pencegahan double-booking pada jam yang sama',
      'Integrasi form data reservasi & konfirmasi WhatsApp otomatis',
      'Integrasi pembayaran deposit / DP pemesanan',
      'Sinkronisasi jadwal ke Google Calendar tim penyedia layanan',
      'Simulasi alur booking dari sudut pandang pelanggan'
    ],
    notes: 'Sertakan fitur pembatalan atau penjadwalan ulang minimal 24 jam sebelum waktu reservasi.',
    prompt: 'Buatkan rencana pembuatan sistem booking dan reservasi jadwal online.'
  },
  {
    id: 'wa_automation_webhook',
    label: 'Integrasi WhatsApp & Webhook Form',
    category: 'web',
    icon: 'MessageSquare',
    title: 'Otomasi Notifikasi WhatsApp & Webhook Formulir Website',
    description: 'Integrasi pengiriman pesan notifikasi WhatsApp instan ke nomor admin dan pelanggan setiap kali ada form kontak, order baru, atau leads masuk di website.',
    priority: 'medium',
    tags: ['WhatsApp API', 'Automation', 'Webhook'],
    estimatedDays: 4,
    tasks: [
      'Setup akun WhatsApp Business API / Gateway (Fonnte / Wablas)',
      'Pembuatan endpoint Webhook penerima data formulir website',
      'Penyusunan template pesan otomatis yang personal dan ramah',
      'Pengujian pengiriman notifikasi instan saat form disubmit',
      'Pencegahan spam dengan validasi reCAPTCHA / honeypot pada form',
      'Setup pencatatan riwayat pesan terkirim di database lokal',
      'Dokumentasi teknis pemeliharaan gateway WhatsApp'
    ],
    notes: 'Gunakan format pesan rapi dengan baris baru dan cetak tebal pada poin-poin penting.',
    prompt: 'Buatkan rencana integrasi notifikasi WhatsApp otomatis untuk formulir website.'
  },
  {
    id: 'i18n_multilanguage_web',
    label: 'Setup Multi-Bahasa (i18n) Website',
    category: 'web',
    icon: 'Globe',
    title: 'Implementasi Fitur Multi-Bahasa (i18n) Website Global',
    description: 'Penambahan dukungan multi-bahasa (Bahasa Indonesia & English) dengan switch bahasa instan, pengalihan URL hreflang, dan penyimpanan preferensi bahasa pengguna.',
    priority: 'medium',
    tags: ['i18n', 'Localization', 'Multilingual'],
    estimatedDays: 6,
    tasks: [
      'Inisialisasi pustaka i18n (i18next / custom JSON dictionary)',
      'Ekstraksi seluruh teks hardcoded ke dalam file kamus bahasa (id.json & en.json)',
      'Penerjemahan konten profesional tanpa bergantung pada Google Translate otomatis',
      'Pembuatan komponen pemilih bahasa (Language Switcher) di header navigasi',
      'Implementasi tag HTML hreflang untuk optimasi SEO internasional',
      'Penyimpanan preferensi bahasa pengguna di localStorage browser',
      'Pemeriksaan tampilan teks agar tidak merusak layout saat bahasa berubah'
    ],
    notes: 'Perhatikan perbedaan panjang kalimat antara Bahasa Indonesia dan Bahasa Inggris agar tidak memicu teks terpotong.',
    prompt: 'Buatkan rencana implementasi fitur multi-bahasa i18n pada website.'
  },
  {
    id: 'domain_ssl_migration',
    label: 'Migrasi Web & Setup Domain SSL',
    category: 'web',
    icon: 'Code',
    title: 'Migrasi Server Website & Setup Custom Domain SSL',
    description: 'Pemindahan hosting/server website dengan zero downtime, konfigurasi DNS record (A, CNAME, TXT), instalasi sertifikat SSL HTTPS, dan pengalihan 301 redirect.',
    priority: 'high',
    tags: ['DevOps', 'Domain', 'SSL Setup'],
    estimatedDays: 3,
    tasks: [
      'Backup penuh database dan seluruh aset file website lama',
      'Setup hosting/server baru (Vercel / Cloudflare / VPS)',
      'Konfigurasi DNS Cloudflare (A Record, CNAME, DNSSEC)',
      'Instalasi & aktivasi sertifikat keamanan SSL/TLS HTTPS otomatis',
      'Setup redirect paksa dari HTTP ke HTTPS dan non-WWW ke WWW',
      'Pemeriksaan Broken Link dan error mixed content pada aset gambar',
      'Uji stabilitas akses website dari berbagai provider internet (ISP)'
    ],
    notes: 'Atur TTL DNS ke 300 detik (5 menit) sebelum hari migrasi untuk mempercepat propagasi global.',
    prompt: 'Buatkan rencana migrasi hosting website dan konfigurasi custom domain dengan SSL.'
  },
  {
    id: 'web_security_audit',
    label: 'Web Security & Protection Audit',
    category: 'web',
    icon: 'Monitor',
    title: 'Audit Keamanan Website & Perlindungan Serangan Web',
    description: 'Pemeriksaan kerentanan keamanan website, proteksi Cross-Site Scripting (XSS), implementasi Content Security Policy (CSP), rate limiting, dan proteksi brute-force.',
    priority: 'high',
    tags: ['Security', 'CSP', 'Web Protection'],
    estimatedDays: 4,
    tasks: [
      'Audit header keamanan HTTP (Content-Security-Policy, X-Frame-Options, HSTS)',
      'Sanitasi seluruh input formulir pengguna untuk mencegah XSS & SQLi',
      'Implementasi proteksi rate limiting pada endpoint autentikasi',
      'Setup Cloudflare WAF (Web Application Firewall) & proteksi DDoS',
      'Pemeriksaan izin akses file sensitif (.env, .git, config backups)',
      'Uji coba simulasi serangan formulir dan bypass login',
      'Penyusunan laporan audit keamanan & SOP update rutin'
    ],
    notes: 'Pastikan tidak ada API Key rahasia yang terekspos di kode frontend client-side.',
    prompt: 'Buatkan rencana audit keamanan website dan penguatan proteksi server.'
  },
  {
    id: 'pwa_offline_caching',
    label: 'PWA Setup & Offline Caching',
    category: 'web',
    icon: 'Zap',
    title: 'Penerapan PWA (Progressive Web App) & Caching Offline',
    description: 'Mengubah website menjadi Progressive Web App yang dapat di-install di layar HP, bekerja offline dengan Service Worker cache, dan loading instan.',
    priority: 'medium',
    tags: ['PWA', 'Service Worker', 'Offline Cache'],
    estimatedDays: 5,
    tasks: [
      'Pembuatan file manifest.webmanifest dengan ikon berbagai ukuran (192px, 512px)',
      'Konfigurasi Service Worker dengan strategi caching Workbox (Stale-While-Revalidate)',
      'Penyusunan halaman fallback offline interaktif yang menarik',
      'Implementasi banner ajakan install aplikasi (Add to Home Screen)',
      'Pengujian performa offline di Chrome DevTools Application Tab',
      'Validasi skor PWA 100% pada audit Google Lighthouse',
      'Peluncuran update service worker dengan mekanisme update prompt'
    ],
    notes: 'Pastikan caching tidak mengunci file data dinamis yang memerlukan update realtime dari server.',
    prompt: 'Buatkan rencana penerapan fitur PWA dan caching offline pada website.'
  },
  {
    id: 'google_analytics_gtm',
    label: 'Setup Google Analytics 4 & GTM',
    category: 'web',
    icon: 'Monitor',
    title: 'Pemasangan Google Tag Manager & Google Analytics 4 (GA4)',
    description: 'Integrasi analitik pengunjung tingkat lanjut, tracking klik tombol WhatsApp, scroll depth, form submission leads, dan pembuatan custom dashboard Looker Studio.',
    priority: 'medium',
    tags: ['Analytics', 'GTM', 'GA4 Tracking'],
    estimatedDays: 3,
    tasks: [
      'Pemasangan script Google Tag Manager (GTM) di header & body',
      'Konfigurasi data stream Google Analytics 4 (GA4)',
      'Pembuatan Custom Event Trigger untuk klik tombol WhatsApp',
      'Pembuatan Trigger pelacakan pengiriman formulir kontak sukses',
      'Setup pelacakan scroll kedalaman halaman (Scroll Depth 25%, 50%, 75%, 90%)',
      'Pengujian event tracking di GTM Preview & Debug Mode',
      'Pembuatan dashboard laporan ringkasan trafik di Looker Studio'
    ],
    notes: 'Kecualikan IP address kantor/pribadi dari data GA4 agar data trafik tidak bias.',
    prompt: 'Buatkan rencana pemasangan Google Tag Manager dan pelacakan event GA4.'
  },

  // ── BISNIS, KONSULTASI & MANAJEMEN (10 Templates) ──
  {
    id: 'retainer_contract',
    label: 'Paket Retainer Desain Bulanan',
    category: 'business',
    icon: 'MessageSquare',
    title: 'Manajemen Layanan Desain Berkelanjutan (Monthly Retainer)',
    description: 'Pengelolaan kuota pengerjaan desain rutin bulanan untuk klien tetap, mencakup koordinasi weekly review, antrean tugas, dan laporan capaian.',
    priority: 'medium',
    tags: ['Retainer', 'Client Care', 'Monthly'],
    estimatedDays: 30,
    tasks: [
      'Kick-off meeting bulanan & penetapan target kuota desain',
      'Setup Kanban board antrean tugas bersama tim klien',
      'Eksekusi batch desain pekan 1 (Kebutuhan rutin media sosial)',
      'Eksekusi batch desain pekan 2 (Materi promosi & kampanye)',
      'Eksekusi batch desain pekan 3 (Katalog / revisi materi cetak)',
      'Eksekusi batch desain pekan 4 (Laporan bulanan & aset darurat)',
      'Sesi Monthly Review & evaluasi kepuasan klien',
      'Penerbitan invoice perpanjangan kontrak retainer'
    ],
    notes: 'Tetapkan batas waktu revisi maksimal 2 hari kerja agar alur kerja retainer tetap on-schedule.',
    prompt: 'Buatkan rencana manajemen paket retainer desain bulanan untuk klien korporat.'
  },
  {
    id: 'client_onboarding',
    label: 'SOP Onboarding Klien Baru',
    category: 'business',
    icon: 'Briefcase',
    title: 'SOP Onboarding & Kickoff Klien Baru Profesional',
    description: 'Standard Operating Procedure (SOP) penyambutan klien baru, penandatanganan kontrak, pengumpulan materi aset awal, dan penjadwalan meeting perdana.',
    priority: 'high',
    tags: ['Onboarding', 'Client SOP', 'Contract'],
    estimatedDays: 4,
    tasks: [
      'Pengiriman Welcome Email & formulir kuesioner kebutuhan proyek',
      'Finalisasi Surat Perjanjian Kerjasama (MoU) & tanda tangan digital',
      'Penerbitan invoice uang muka (DP 50%) & konfirmasi pembayaran',
      'Pembuatan shared Google Drive folder & grup komunikasi proyek',
      'Pengumpulan aset materi klien (logo, foto produk, brand guideline)',
      'Penyusunan Project Timeline & Milestone kerja resmi',
      'Pelaksanaan Kickoff Meeting online via Google Meet / Zoom',
      'Pengiriman rangkuman notula meeting & persetujuan final scope'
    ],
    notes: 'Pastikan DP telah masuk ke rekening sebelum memulai fase riset dan eksekusi kreatif.',
    prompt: 'Buatkan alur onboarding klien baru profesional dari kontrak, DP, hingga kick-off meeting.'
  },
  {
    id: 'pitch_deck_investor',
    label: 'Pitch Deck Presentasi Bisnis',
    category: 'business',
    icon: 'FileText',
    title: 'Desain Pitch Deck & Presentasi Bisnis Strategis',
    description: 'Pembuatan slide presentasi profesional untuk penawaran investasi, proposal kemitraan bisnis, atau presentasi tender skala besar.',
    priority: 'high',
    tags: ['Pitch Deck', 'Presentation', 'Business'],
    estimatedDays: 7,
    tasks: [
      'Penyusunan narasi cerita slide (Problem, Solution, Market, Traction)',
      'Perancangan struktur 12-15 slide presentasi kunci',
      'Desain visual slide modern dengan grafik infografis informatif',
      'Visualisasi data keuangan, target pasar & metrik pertumbuhan',
      'Revisi visual bersama tim founder / direksi',
      'Penyusunan versi presentasi (16:9) & versi cetak ringkas (PDF)',
      'Export format editable (Figma / PowerPoint / Keynote)',
      'Simulasi latihan presentasi & penyesuaian durasi waktu'
    ],
    notes: 'Gunakan prinsip satu ide utama per slide agar audiens fokus menangkap pesan kunci.',
    prompt: 'Buatkan rencana perancangan pitch deck presentasi bisnis strategis untuk investor atau kemitraan.'
  },
  {
    id: 'brand_audit_competitor',
    label: 'Audit Brand & Riset Kompetitor',
    category: 'business',
    icon: 'Briefcase',
    title: 'Audit Persepsi Brand & Analisis Kompetitor Pasar',
    description: 'Investigasi komprehensif terhadap posisi brand di benak audiens, evaluasi titik sentuh visual, pemetaan kelebihan/kelemahan 5 kompetitor utama, dan perumusan strategi diferensiasi.',
    priority: 'high',
    tags: ['Audit', 'Competitor Analysis', 'Strategy'],
    estimatedDays: 10,
    tasks: [
      'Pengumpulan seluruh materi promosi dan saluran komunikasi brand saat ini',
      'Identifikasi 5 kompetitor langsung & 3 kompetitor tidak langsung',
      'Penyusunan tabel matriks perbandingan fitur, harga, dan gaya visual',
      'Analisis ulasan pelanggan (Review Mining) untuk menemukan celah pasar',
      'Penyusunan analisis SWOT (Strengths, Weaknesses, Opportunities, Threats)',
      'Perumusan Unique Selling Proposition (USP) dan Value Proposition baru',
      'Penyusunan laporan presentasi strategi diferensiasi bisnis'
    ],
    notes: 'Fokus pada celah kebutuhan pelanggan yang diabaikan oleh para kompetitor besar.',
    prompt: 'Buatkan rencana audit brand dan analisis kompetitor pasar secara mendalam.'
  },
  {
    id: 'project_budget_estimator',
    label: 'Perencanaan Anggaran Proyek',
    category: 'business',
    icon: 'FileText',
    title: 'Penyusunan Rencana Anggaran Biaya (RAB) & Estimasi Proyek',
    description: 'Penghitungan alokasi anggaran pengerjaan proyek mencakup biaya SDM (man-hours), lisensi aset/tools, biaya operasional server, margin keuntungan, dan dana darurat.',
    priority: 'medium',
    tags: ['Budgeting', 'Finance', 'Project Cost'],
    estimatedDays: 3,
    tasks: [
      'Rincian seluruh item pekerjaan dan estimasi jam kerja per modul',
      'Penghitungan tarif kerja per jam (Hourly Rate) setiap anggota tim',
      'Identifikasi biaya pembelian lisensi font, foto stok, dan plugin',
      'Penetapan biaya infrastruktur hosting, domain, dan server testing',
      'Penambahan margin profit (25-35%) dan buffer risiko (10%)',
      'Penyusunan dokumen RAB resmi dalam format spreadsheet & PDF',
      'Persetujuan anggaran bersama pimpinan proyek / klien'
    ],
    notes: 'Selalu cantumkan dana kontinjensi minimal 10% untuk mengantisipasi perubahan scope tak terduga.',
    prompt: 'Buatkan rencana penyusunan rencana anggaran biaya proyek dan estimasi alokasi dana.'
  },
  {
    id: 'project_closure_report',
    label: 'Laporan Akhir & Serah Terima Proyek',
    category: 'business',
    icon: 'Briefcase',
    title: 'Penyusunan Laporan Penutupan Proyek & Serah Terima Final',
    description: 'Dokumentasi resmi penutupan proyek yang merangkum pencapaian deliverables, perbandingan timeline rencana vs realisasi, serah terima akun/kredensial, dan formulir tanda tangan selesai.',
    priority: 'high',
    tags: ['Project Closure', 'Final Report', 'Handover'],
    estimatedDays: 4,
    tasks: [
      'Pemeriksaan kembali seluruh deliverable terhadap scope of work awal',
      'Kompilasi seluruh tautan file master dan hak akses kredensial',
      'Penyusunan laporan ringkasan pencapaian dan metrik hasil proyek',
      'Penerbitan Berita Acara Serah Terima (BAST) proyek resmi',
      'Pengiriman invoice pelunasan akhir sisa biaya proyek',
      'Permintaan testimoni resmi & izin mencantumkan karya ke portofolio',
      'Pengarsipan file proyek ke Google Drive arsip jangka panjang'
    ],
    notes: 'Pastikan penandatanganan BAST telah selesai sebelum mengarsipkan dokumen proyek.',
    prompt: 'Buatkan rencana penyusunan laporan akhir dan serah terima penutupan proyek resmi.'
  },
  {
    id: 'tender_proposal_pitch',
    label: 'Proposal Penawaran Tender Resmi',
    category: 'business',
    icon: 'FileText',
    title: 'Penyusunan Dokumen Proposal Penawaran Tender Korporat',
    description: 'Penyusunan dokumen proposal penawaran formal untuk tender proyek korporat/pemerintah mencakup profil tim, metodologi kerja, portofolio relevan, timeline, dan penawaran harga.',
    priority: 'high',
    tags: ['Tender', 'Proposal', 'Corporate Pitch'],
    estimatedDays: 8,
    tasks: [
      'Pembedahan dokumen Kerangka Acuan Kerja (KAK / Terms of Reference)',
      'Penyusunan ringkasan eksekutif dan pemahaman masalah klien',
      'Perumusan metodologi teknis pengerjaan dan standar kualitas',
      'Kurasi 3 studi kasus portofolio yang paling relevan dengan industri klien',
      'Penyusunan susunan tim ahli beserta Curriculum Vitae (CV) ringkas',
      'Penyusunan jadwal kerja Gantt Chart dan deliverables per fase',
      'Penyusunan rincian penawaran biaya kompetitif',
      'Penggabungan seluruh dokumen menjadi PDF profesional siap kirim'
    ],
    notes: 'Pastikan seluruh syarat administratif dalam dokumen KAK terpenuhi tanpa ada yang terlewat.',
    prompt: 'Buatkan rencana penyusunan dokumen proposal penawaran tender proyek korporat.'
  },
  {
    id: 'creative_team_sop',
    label: 'SOP Standar Operasional Tim Kreatif',
    category: 'business',
    icon: 'Workflow',
    title: 'Standard Operating Procedure (SOP) Alur Kerja Tim Kreatif',
    description: 'Penyusunan pedoman standar operasional tim desain/kreatif mulai dari penerimaan brief, aturan penamaan file, alur review internal, batas waktu revisi, hingga backup data.',
    priority: 'medium',
    tags: ['SOP', 'Operations', 'Team Workflow'],
    estimatedDays: 5,
    tasks: [
      'Penyusunan alur penerimaan brief dan estimasi kapasitas kerja tim',
      'Penetapan konvensi penamaan folder dan file (misal: YYMMDD_Client_Project_v1)',
      'Standarisasi alur Quality Check internal sebelum materi dikirim ke klien',
      'Penetapan batas waktu respon komunikasi dan jadwal revisi',
      'Penyusunan checklist kelengkapan aset sebelum serah terima final',
      'Standarisasi prosedur backup harian dan arsip cloud storage',
      'Sosialisasi SOP kepada seluruh anggota tim dan peninjauan berkala'
    ],
    notes: 'SOP yang jelas mengurangi 80% miskomunikasi internal dan mempercepat waktu pengerjaan.',
    prompt: 'Buatkan dokumen SOP alur kerja standar operasional tim kreatif desain.'
  },
  {
    id: 'copyright_contract_licensing',
    label: 'Kontrak Lisensi & Hak Cipta Desain',
    category: 'business',
    icon: 'FileText',
    title: 'Manajemen Kontrak Lisensi Desain & Pengalihan Hak Cipta',
    description: 'Penyusunan klausul hukum perlindungan karya desain, batasan penggunaan komersial, hak moral pencipta, klausul ganti rugi, dan hak pemajangan karya di portofolio.',
    priority: 'high',
    tags: ['Contract', 'Copyright', 'Legal'],
    estimatedDays: 4,
    tasks: [
      'Penyusunan klausul batasan penggunaan karya (Digital vs Cetak vs Global)',
      'Penetapan waktu peralihan hak cipta (setelah pelunasan 100%)',
      'Penyertaan hak pencipta untuk menampilkan karya dalam portofolio pribadi',
      'Penetapan batas jumlah revisi yang termasuk dalam paket awal',
      'Penyusunan klausul kompensasi jika proyek dibatalkan di tengah jalan (Kill Fee)',
      'Konsultasi tinjauan hukum klausul kontrak',
      'Penyediaan format kontrak template digital siap tanda tangan'
    ],
    notes: 'Jangan pernah menyerahkan hak cipta tanpa klausul bahwa pembayaran telah lunas 100%.',
    prompt: 'Buatkan draf kontrak perjanjian lisensi desain dan pengalihan hak cipta profesional.'
  },
  {
    id: 'client_crisis_resolution',
    label: 'Penanganan Komplain & Krisis Klien',
    category: 'business',
    icon: 'MessageSquare',
    title: 'SOP Penanganan Komplain Kritis & Resolusi Masalah Klien',
    description: 'Prosedur tanggap darurat menangani ketidakpuasan klien, keterlambatan jadwal, atau kesalahan teknis secara tenang, profesional, dan berorientasi solusi.',
    priority: 'high',
    tags: ['Crisis Management', 'Client Care', 'Conflict Resolution'],
    estimatedDays: 3,
    tasks: [
      'Penerimaan keluhan secara empati tanpa bersikap defensif',
      'Investigasi internal akar penyebab masalah (Root Cause Analysis)',
      'Penyusunan 2 opsi rencana tindakan perbaikan (Corrective Action Plan)',
      'Jadwalkan panggilan darurat dengan klien untuk menyelaraskan solusi',
      'Eksekusi perbaikan prioritas tinggi dengan pembaruan berkala setiap 6 jam',
      'Penyampaian hasil perbaikan disertai permohonan maaf resmi',
      'Dokumentasi pembelajaran krisis agar tidak terulang di masa mendatang'
    ],
    notes: 'Klien yang komplain dan tertangani dengan baik justru sering menjadi pelanggan paling loyal.',
    prompt: 'Buatkan rencana dan SOP penanganan komplain serta resolusi krisis klien.'
  },

  // ── PEMASARAN & KAMPANYE (10 Templates) ──
  {
    id: 'product_launch_campaign',
    label: 'Kampanye Peluncuran Produk',
    category: 'marketing',
    icon: 'Sparkles',
    title: 'Strategi & Eksekusi Kampanye Peluncuran Produk Baru (Product Launch)',
    description: 'Rangkaian kampanye terpadu fase Teaser, Launch Day, dan Post-Launch meliputi materi visual, copywriting, broadcast pesan, dan promosi berbayar.',
    priority: 'high',
    tags: ['Campaign', 'Product Launch', 'Marketing'],
    estimatedDays: 14,
    tasks: [
      'Penentuan tanggal peluncuran & tema utama kampanye',
      'Produksi materi visual fase Teaser / Coming Soon (H-7)',
      'Produksi video unboxing / demo produk pendek',
      'Penyusunan penawaran khusus Early Bird & bonus terbatas',
      'Setup landing page penjualan khusus peluncuran',
      'Broadcast pesan WhatsApp / Email ke database pelanggan',
      'Aktivasi kampanye iklan berbayar (Meta Ads / TikTok Ads)',
      'Monitoring penjualan hari pertama & respon pelanggan',
      'Evaluasi performa kampanye & tindak lanjut prospek'
    ],
    notes: 'Bangun urgensi dengan batas waktu promo dan ketersediaan stok yang jelas.',
    prompt: 'Buatkan rencana kampanye peluncuran produk baru terpadu dari fase teaser hingga evaluasi.'
  },
  {
    id: 'meta_tiktok_ads_campaign',
    label: 'Kampanye Iklan Meta & TikTok Ads',
    category: 'marketing',
    icon: 'Zap',
    title: 'Pengelolaan Kampanye Iklan Berbayar Meta & TikTok Ads',
    description: 'Perencanaan struktur kampanye iklan berbayar (Top of Funnel, Middle of Funnel, Retargeting), pengujian variasi materi visual (A/B Testing), dan optimasi ROAS.',
    priority: 'high',
    tags: ['Paid Ads', 'Meta Ads', 'TikTok Ads'],
    estimatedDays: 10,
    tasks: [
      'Riset audiens target (Interest, Demografi, Lookalike Audience)',
      'Produksi 5 variasi materi kreatif iklan (3 Video Hook + 2 Gambar Carousel)',
      'Penulisan 3 variasi copywriting iklan (Headline, Primary Text, Call-to-Action)',
      'Setup struktur kampanye di Ads Manager (CBO vs ABO)',
      'Pemasangan tracking pixel & custom conversion event',
      'Peluncuran kampanye fase testing budget kecil (3-5 hari)',
      'Analisa metrik CTR, CPC, CPM, dan ROAS',
      'Scaling budget pada ad set pemenang & matikan iklan yang boncos'
    ],
    notes: 'Fokus pada 3 detik pertama video hook untuk menghentikan jempol audiens yang scrolling.',
    prompt: 'Buatkan rencana pengelolaan kampanye iklan Meta dan TikTok Ads berkinerja tinggi.'
  },
  {
    id: 'video_reels_tiktok_plan',
    label: 'Produksi Video Reels & TikTok',
    category: 'marketing',
    icon: 'Sparkles',
    title: 'Rencana Produksi 15 Video Pendek (Reels & TikTok)',
    description: 'Perencanaan konten video format vertikal 9:16 mencakup penulisan skrip hook-story-offer, pengambilan gambar (shooting list), editing dinamis, dan subtitle.',
    priority: 'medium',
    tags: ['Shorts', 'Reels', 'TikTok', 'Video Marketing'],
    estimatedDays: 8,
    tasks: [
      'Riset 15 topik tren, pertanyaan umum pelanggan, dan mitos industri',
      'Penulisan naskah skrip video formula Hook (0-3 detik) -> Edukasi -> CTA',
      'Persiapan peralatan rekaman (Smartphone, mic wireless, ring light)',
      'Sesi pengambilan gambar (Batch Shooting 15 video dalam 1 hari)',
      'Editing video dinamis (Fast-cut, efek suara SFX, zoom-in, B-roll)',
      'Penambahan teks caption subtitle otomatis yang mudah dibaca',
      'Penjadwalan posting 1 video per hari di Instagram Reels & TikTok'
    ],
    notes: 'Gunakan musik tren yang sedang viral di platform untuk memperluas jangkauan algoritma.',
    prompt: 'Buatkan rencana produksi 15 video pendek Reels dan TikTok terstruktur.'
  },
  {
    id: 'email_newsletter_auto',
    label: 'Email Marketing & Otomasi',
    category: 'marketing',
    icon: 'MessageSquare',
    title: 'Pembangunan Saluran Email Marketing & Welcome Sequence',
    description: 'Setup sistem email marketing otomatis meliputi form penangkap email (lead magnet), 5 email sambutan otomatis (Welcome Sequence), dan newsletter mingguan.',
    priority: 'medium',
    tags: ['Email Marketing', 'Automation', 'Newsletter'],
    estimatedDays: 7,
    tasks: [
      'Setup platform email marketing (Mailchimp / Brevo / ConvertKit)',
      'Desain form popup lead magnet di website',
      'Penulisan Email 1: Pengiriman file gratisan + Sambutan hangat',
      'Penulisan Email 2: Cerita di balik layar & mengatasi masalah terbesar audiens',
      'Penulisan Email 3: Studi kasus & bukti hasil nyata klien sebelumnya',
      'Penulisan Email 4: Jawaban pertanyaan umum (FAQ) & mengatasi keraguan',
      'Penulisan Email 5: Penawaran khusus & ajakan konsultasi langsung',
      'Uji coba alur otomasi dan deliverability ke inbox (bebas spam)'
    ],
    notes: 'Gunakan baris subjek yang membuat penasaran dan hindari kata-kata pemicu filter spam.',
    prompt: 'Buatkan rencana rangkaian email marketing welcome sequence otomatis untuk pelanggan baru.'
  },
  {
    id: 'press_release_media_kit',
    label: 'Press Release & Media Kit',
    category: 'marketing',
    icon: 'FileText',
    title: 'Penyusunan Press Release & Media Kit Publikasi',
    description: 'Paket publikasi media berita resmi meliputi naskah siaran pers terstandar jurnalistik (5W+1H), foto rilis resmi, lembar fakta perusahaan (Fact Sheet), dan kontak media.',
    priority: 'medium',
    tags: ['PR', 'Press Release', 'Media Kit'],
    estimatedDays: 5,
    tasks: [
      'Perumusan sudut pandang berita yang bernilai (Newsworthy Angle)',
      'Penulisan draf Press Release format standar AP Style (Headline, Dateline, Body, Boilerplate)',
      'Penyertaan kutipan resmi dari pimpinan / founder perusahaan',
      'Kompilasi foto resolusi tinggi dan logo aset dalam Google Drive media kit',
      'Penyusunan Fact Sheet satu halaman profil perusahaan',
      'Penyebaran rilis ke database jurnalis dan portal media partner',
      'Monitoring publikasi dan kliping liputan media'
    ],
    notes: 'Kirimkan rilis pers pada hari kerja pagi hari (Selasa - Kamis) antara pukul 08.00 - 10.00.',
    prompt: 'Buatkan rencana penyusunan press release media kit untuk peluncuran inovasi baru.'
  },
  {
    id: 'seasonal_promo_discount',
    label: 'Kampanye Promo & Diskon Musiman',
    category: 'marketing',
    icon: 'Zap',
    title: 'Strategi Kampanye Promo Musiman (Payday / Harbolnas / Lebaran)',
    description: 'Perancangan kampanye diskon terbatas (Flash Sale) dengan penawaran bundling khusus, kupon voucher eksklusif, countdown urgensi, dan broadcast serentak.',
    priority: 'high',
    tags: ['Promo', 'Discount', 'Seasonal Campaign'],
    estimatedDays: 6,
    tasks: [
      'Penetapan mekanisme promo (Potongan harga, Flash Sale, atau Buy 1 Get 1)',
      'Penghitungan batas margin laba aman setelah diskon',
      'Desain banner promosi website, popup modal, dan media sosial',
      'Setup kode voucher diskon di sistem e-commerce',
      'Pemasangan timer hitung mundur promo di header website',
      'Broadcast pesan promosi ke database WhatsApp dan Email (H-1 & Hari H)',
      'Monitoring lonjakan transaksi dan kesiapan tim customer service',
      'Evaluasi total omzet dan produk terlaris setelah promo berakhir'
    ],
    notes: 'Tegakkan batas waktu promo secara ketat untuk membangun kredibilitas dan urgensi nyata.',
    prompt: 'Buatkan rencana kampanye promosi diskon musiman dengan batas waktu ketat.'
  },
  {
    id: 'referral_affiliate_program',
    label: 'Program Referral & Afiliasi Bisnis',
    category: 'marketing',
    icon: 'Workflow',
    title: 'Perancangan Program Referral & Afiliasi Komisi Pelanggan',
    description: 'Pembangunan sistem komisi rujukan bagi pelanggan setia yang merekomendasikan layanan/produk ke rekan mereka dengan link tracking unik dan bonus ganda.',
    priority: 'medium',
    tags: ['Referral', 'Affiliate', 'Word of Mouth'],
    estimatedDays: 8,
    tasks: [
      'Penetapan skema insentif (Komisi tunai, diskon langganan, atau saldo)',
      'Desain alur registrasi mitra afiliasi dan dashboard perolehan komisi',
      'Implementasi sistem link rujukan unik (Unique Referral Link / Code)',
      'Penyusunan materi promosi siap pakai untuk dibagikan oleh mitra (Media Kit)',
      'Penyusunan halaman syarat & ketentuan program afiliasi resmi',
      'Uji coba pelacakan transaksi dari link referral hingga pembayaran komisi',
      'Sosialisasi program referral ke database pelanggan eksisting'
    ],
    notes: 'Berikan reward ganda (baik untuk pihak yang mereferensikan maupun yang direferensikan).',
    prompt: 'Buatkan rencana pembangunan program referral dan afiliasi bisnis yang menarik.'
  },
  {
    id: 'influencer_kol_campaign',
    label: 'Kolaborasi Influencer & KOL',
    category: 'marketing',
    icon: 'Sparkles',
    title: 'Manajemen Kampanye Endorsement Influencer & KOL Kreatif',
    description: 'Proses kurasi dan pemilihan Key Opinion Leaders (KOL) yang relevan, pengiriman creative brief, review materi konten, tracking kode promo, dan evaluasi ROI.',
    priority: 'medium',
    tags: ['Influencer', 'KOL', 'Endorsement'],
    estimatedDays: 9,
    tasks: [
      'Kurasi 10 influencer mikro/makro dengan engagement rate di atas 3%',
      'Penyusunan brief konten kreatif (Do & Don\'t, Unique Selling Point, CTA)',
      'Negosiasi rate card dan penandatanganan perjanjian kerjasama sponsorship',
      'Pengiriman sampel produk ke alamat masing-masing influencer',
      'Review draf video/foto materi sebelum jadwal tayang',
      'Monitoring penayangan konten dan interaksi di kolom komentar',
      'Analisa konversi penjualan dari kode promo khusus masing-masing KOL'
    ],
    notes: 'Pilih influencer berdasarkan relevansi audiens dan kualitas komentar nyata, bukan sekadar jumlah followers.',
    prompt: 'Buatkan rencana manajemen kampanye endorsement influencer dan KOL.'
  },
  {
    id: 'google_business_local_seo',
    label: 'Google Business & Local SEO',
    category: 'marketing',
    icon: 'Globe',
    title: 'Optimasi Profil Google Bisnisku & SEO Lokal Peta',
    description: 'Peningkatan visibilitas bisnis di pencarian lokal Google Maps dan Google Search untuk menarik pelanggan terdekat di area kota Anda.',
    priority: 'medium',
    tags: ['Local SEO', 'Google Maps', 'Google Business'],
    estimatedDays: 4,
    tasks: [
      'Klaim dan verifikasi resmi Profil Bisnis Google (Google Business Profile)',
      'Lengkapi informasi jam operasional, alamat presisi, nomor telepon, dan URL website',
      'Upload 20 foto resolusi tinggi kantor, tim, dan hasil karya produk',
      'Penyusunan daftar layanan terperinci beserta kisaran harga',
      'Penyusunan strategi pengumpulan 20 ulasan bintang 5 dari klien puas',
      'Optimasi kata kunci lokal pada deskripsi profil (misal: "Jasa Desain Logo Jakarta")',
      'Posting pembaruan mingguan (Google Posts) terkait promo dan portofolio'
    ],
    notes: 'Balas setiap ulasan yang masuk (baik positif maupun kritik) dalam waktu kurang dari 24 jam.',
    prompt: 'Buatkan rencana optimasi profil Google Bisnisku dan ranking pencarian lokal Google Maps.'
  },
  {
    id: 'offline_promo_activation',
    label: 'Event Promosi & Brand Activation',
    category: 'marketing',
    icon: 'Sparkles',
    title: 'Perancangan Aktivasi Brand & Kegiatan Promosi Offline',
    description: 'Penyelenggaraan acara tatap muka promosi interaktif (pop-up booth, workshop kreatif, sharing session) untuk membangun kedekatan emosional dengan komunitas lokal.',
    priority: 'medium',
    tags: ['Activation', 'Event', 'Offline Marketing'],
    estimatedDays: 12,
    tasks: [
      'Penetapan tema acara, target peserta, dan pemilihan lokasi strategis',
      'Penyusunan anggaran biaya operasional dan sponsor pendukung',
      'Desain seluruh materi promosi cetak (Flyer, Spanduk, Tiket, Souvenir)',
      'Produksi photobooth interaktif yang menarik difoto dan dibagikan ke media sosial',
      'Penyusunan susunan acara interaktif dan sesi games berhadiah',
      'Pelaksanaan acara dengan dokumentasi video/foto profesional',
      'Pengumpulan database kontak peserta untuk follow-up penawaran pasca-acara'
    ],
    notes: 'Sediakan spot foto yang estetik (Instagrammable) untuk memicu publikasi gratis dari para pengunjung.',
    prompt: 'Buatkan rencana penyelenggaraan kegiatan promosi aktivasi brand dan workshop offline.'
  }
];

// ─────────────────────────────────────────────────────────────
// 2. OFFLINE NOTE TEMPLATES (65+ Structured Markdown Presets)
// ─────────────────────────────────────────────────────────────
export const OFFLINE_NOTE_TEMPLATES: OfflineNoteTemplate[] = [
  // ── DESAIN & KREATIF (15 Templates) ──
  {
    id: 'brief_desain_klien',
    label: 'Creative Brief Desain Klien',
    category: 'design',
    folder: 'clients',
    tags: ['Brief', 'Klien', 'Desain'],
    color: 'purple',
    title: 'Creative Brief Desain Klien',
    content: `# Creative Brief Desain Klien

## 1. Informasi Umum Proyek
- Nama Klien / Perusahaan: 
- Jenis Industri / Bidang: 
- Target Deadline: 
- Anggaran / Budget: 

## 2. Sasaran & Tujuan Utama
Jelaskan tujuan utama yang ingin dicapai melalui proyek desain ini:
- [ ] Membangun identitas visual baru yang profesional
- [ ] Meningkatkan daya tarik produk di pasar kompetitif
- [ ] Meremajakan tampilan brand agar lebih relevan dengan generasi muda

## 3. Target Audiens
- Rentang Usia: 20 - 35 Tahun
- Status Ekonomi: Menengah ke Atas
- Karakteristik & Kebiasaan: Aktif di media sosial, menghargai desain estetik dan kepraktisan.

## 4. Gaya Visual & Preferensi Desain
- Gaya Desain: Minimalis, Modern, Elegan, Bersih
- Warna Utama yang Diinginkan: Deep Navy, Soft Emerald, Putih Bersih
- Warna yang Dihindari: Warna neon menyala
- Referensi Kompetitor yang Disukai: Apple, Aesop, Tokopedia

## 5. Daftar Deliverables yang Wajib Diserahkan
- [ ] Logo Primer, Sekunder, dan Favicon
- [ ] File Master Vektor (AI, EPS, SVG)
- [ ] File Gambar Transparan (PNG High-Res)
- [ ] Buku Panduan Brand Guideline (PDF)

> Catatan: Segala perubahan di luar poin deliverables di atas akan dikenakan penyesuaian biaya tambahan.`,
    prompt: 'Buatkan lembar creative brief desain klien yang rapi dan terstruktur.'
  },
  {
    id: 'moodboard_konsep',
    label: 'Konsep Visual & Moodboard',
    category: 'design',
    folder: 'ideas',
    tags: ['Moodboard', 'Konsep', 'Ide'],
    color: 'sky',
    title: 'Eksplorasi Konsep Visual & Moodboard',
    content: `# Eksplorasi Konsep Visual & Moodboard

## 1. Tema Utama (Core Concept)
Tema visual mengusung konsep **Modern Craftsmanship** yang menggabungkan kesederhanaan minimalis dengan detail tipografi berkarakter kuat.

## 2. Pilar Visual
- **Kesederhanaan (Simplicity):** Ruang kosong (white space) yang lapang dan tata letak yang bernapas.
- **Kepercayaan (Trustworthiness):** Palet warna netral yang menonjolkan profesionalisme dan keandalan.
- **Karakter Unik:** Bentuk geometris halus yang mudah diingat pada pandangan pertama.

## 3. Palet Warna (Color Palette)
- **Primary Color:** #0F172A (Deep Slate Navy)
- **Secondary Color:** #0EA5E9 (Sky Blue Accent)
- **Neutral Dark:** #1E293B (Dark Charcoal)
- **Neutral Light:** #F8FAFC (Soft Pearl White)

## 4. Panduan Tipografi
- **Heading Font:** Outfit / Plus Jakarta Sans (Bold, Modern Sans-Serif)
- **Body Font:** Inter / DM Sans (Regular 400 & Medium 500, Nyaman dibaca)

## 5. Action Items Selanjutnya
- [ ] Kumpulkan 15 gambar referensi tekstur dan layout
- [ ] Buat 3 variasi sketsa kasar di kertas sketsa
- [ ] Mulai digitalisasi logo monogram di software vektor

> Catatan: Pastikan moodboard telah disetujui klien sebelum memulai pembuatan mockup 3D.`,
    prompt: 'Buatkan dokumen konsep visual dan moodboard desain profesional.'
  },
  {
    id: 'sop_serah_terima_file',
    label: 'SOP Serah Terima File Master',
    category: 'design',
    folder: 'clients',
    tags: ['SOP', 'Serah Terima', 'Handoff'],
    color: 'emerald',
    title: 'SOP Serah Terima File Master Desain',
    content: `# SOP Serah Terima File Master Desain

## 1. Checklist Kelengkapan File Master
Pastikan seluruh format file berikut telah diekspor dan tertata rapi:
- [ ] **Folder Vektor:** Format .AI (Illustrator) dan .EPS siap edit
- [ ] **Folder Web & Digital:** Format .SVG dan .PNG transparan resolusi 4000px
- [ ] **Folder Dokumen:** Format .PDF Print-Ready (Warna CMYK, 300 DPI)
- [ ] **Folder Font:** Tautan lisensi resmi font komersial / Google Fonts

## 2. Struktur Folder Pengiriman di Google Drive
- 📁 01_Logo_Master_Files (AI, EPS, SVG, PNG)
- 📁 02_Brand_Guidelines_PDF
- 📁 03_Stationery_Assets (Kop Surat, Kartu Nama, Invoice)
- 📁 04_Mockup_Previews (JPEG High-Res)

## 3. Ketentuan Hak Cipta & Lisensi
Hak cipta penuh atas desain final beralih kepada klien setelah pelunasan biaya proyek 100% diterima. Desainer berhak menyertakan karya ini ke dalam portofolio profesional.

## 4. Konfirmasi Penerimaan
- [ ] File telah diunggah ke shared folder Google Drive
- [ ] Hak akses folder disetel ke 'Viewer' bagi klien
- [ ] Email serah terima resmi telah dikirimkan ke klien

> Catatan: Beri waktu masa garansi 7 hari kerja untuk bantuan teknis ekspor ulang jika klien mengalami kendala membuka file.`,
    prompt: 'Buatkan SOP serah terima file master desain kepada klien secara lengkap.'
  },
  {
    id: 'design_feedback_log',
    label: 'Log Revisi Desain & Feedback',
    category: 'design',
    folder: 'clients',
    tags: ['Revisi', 'Feedback', 'Client Log'],
    color: 'amber',
    title: 'Log Masukan & Revisi Desain Klien',
    content: `# Log Masukan & Revisi Desain Klien

## Informasi Revisi
- Proyek: [Nama Proyek]
- Putaran Revisi: Putaran ke-1 dari Maksimal 3 Putaran
- Tanggal Masukan: [Tanggal]

## Poin Revisi dari Klien
1. **Logo Simbol:** Kurangi ketebalan garis ikon sebanyak 15% agar terlihat lebih ramping.
2. **Palet Warna:** Ubah aksen kuning menjadi nuansa emas hangat (Warm Gold #D97706).
3. **Tipografi:** Coba eksplorasi font sekunder dengan gaya Sans-Serif geometris.

## Status Pengerjaan Tim Desain
- [ ] Penyesuaian ketebalan garis vektor di Illustrator
- [ ] Pembaruan kode warna pada mockup presentasi
- [ ] Rendering ulang preview mockup 3D
- [ ] Pengiriman dokumen revisi v1.1 ke klien

> Catatan: Permintaan perubahan konsep total di luar brief awal akan dihitung sebagai proyek baru.`,
    prompt: 'Buatkan log pencatatan revisi dan masukan desain klien terstruktur.'
  },
  {
    id: 'typography_color_palette',
    label: 'Panduan Tipografi & Warna',
    category: 'design',
    folder: 'ideas',
    tags: ['Tipografi', 'Warna', 'Design Tokens'],
    color: 'sky',
    title: 'Spesifikasi Sistem Warna & Tipografi Brand',
    content: `# Spesifikasi Sistem Warna & Tipografi Brand

## 1. Palet Warna Resmi
| Peran Warna | Nama Warna | Kode HEX | Kode RGB | Kode CMYK |
|---|---|---|---|---|
| Primary Base | Midnight Navy | #0F172A | 15, 23, 42 | 64, 45, 0, 84 |
| Accent Action | Electric Sky | #0EA5E9 | 14, 165, 233 | 94, 29, 0, 9 |
| Success / Safe | Emerald Glow | #10B981 | 16, 185, 129 | 91, 0, 30, 27 |
| Warning / Alert | Amber Warm | #F59E0B | 245, 158, 11 | 0, 35, 96, 4 |
| Neutral Light | Cloud White | #F8FAFC | 248, 250, 252 | 2, 1, 0, 1 |

## 2. Hirarki Tipografi
- **Primary Heading (H1-H2):** Plus Jakarta Sans / Outfit (Bold 700 - 800)
- **Secondary Subheading (H3-H4):** Plus Jakarta Sans (SemiBold 600)
- **Body Text Paragraph:** Inter / DM Sans (Regular 400 - Medium 500)
- **Caption & Data Tables:** Inter (Medium 500, Size 11-12px)

## 3. Aturan Keterbacaan & Kontras
- Teks putih hanya digunakan di atas latar belakang dengan kontras rasio minimal 4.5:1.
- Jarak spasi baris (Line Height) paragraf minimal 1.5x dari ukuran font.

> Catatan: Simpan token ini untuk diterapkan pada file CSS dan komponen Figma.`,
    prompt: 'Buatkan lembar spesifikasi sistem warna dan hirarki tipografi brand.'
  },
  {
    id: 'print_preflight_checklist',
    label: 'Checklist Pra-Cetak (Pre-Flight)',
    category: 'design',
    folder: 'tasks',
    tags: ['Preflight', 'Cetak', 'Percetakan'],
    color: 'rose',
    title: 'Checklist Pra-Cetak (Pre-Flight Print Production)',
    content: `# Checklist Pra-Cetak (Pre-Flight Print Production)

## 1. Validasi Warna & Resolusi
- [ ] Seluruh elemen warna telah diubah ke mode **CMYK** (bukan RGB)
- [ ] Seluruh gambar foto memiliki resolusi minimal **300 DPI** pada skala 100%
- [ ] Warna hitam pekat teks menggunakan *100% K Black* (C:0 M:0 Y:0 K:100) untuk mencegah buram
- [ ] Warna hitam pekat latar belakang (Rich Black) menggunakan C:40 M:30 Y:30 K:100

## 2. Area Bleed & Potong (Trim)
- [ ] Bleed minimal 3mm telah ditambahkan di sekeliling layout luar
- [ ] Seluruh teks penting berada di dalam area aman (Safe Zone) minimal 5mm dari garis potong
- [ ] Garis pola potong (Dieline / Cut Line) ditempatkan pada layer terpisah dengan warna Spot Color

## 3. Font & Vektor
- [ ] Seluruh teks font telah di-*Create Outlines / Convert to Curves*
- [ ] Seluruh garis stroke telah di-*Expand / Outline Stroke*
- [ ] Tidak ada link gambar eksternal yang hilang (Missing Links)

## 4. Ekspor File Final
- [ ] Format PDF/X-1a:2001 atau PDF/X-4 siap cetak
- [ ] Sertakan crop marks dan registration marks

> Catatan: Lakukan pengecekan digital proofing 100% sebelum mengirim file ke mesin cetak offset.`,
    prompt: 'Buatkan checklist persiapan pra-cetak pre-flight untuk percetakan offset.'
  },
  {
    id: 'sketch_brainstorm_notes',
    label: 'Sketsa Konsep & Brainstorming',
    category: 'design',
    folder: 'ideas',
    tags: ['Sketsa', 'Brainstorming', 'Ide'],
    color: 'default',
    title: 'Catatan Sketsa & Eksplorasi Awal Logo',
    content: `# Catatan Sketsa & Eksplorasi Awal Logo

## 1. Kata Kunci Utama (Mind Mapping)
- **Asosiasi Makna:** Kecepatan, Modernitas, Terpercaya, Pertumbuhan, Presisi
- **Elemen Bentuk:** Panah ke atas, Geometris heksagonal, Monogram huruf inisial

## 2. Eksplorasi Arah Desain
1. **Arah 1 (Monogram Minimalis):** Gabungan huruf inisial brand dengan garis kontinu yang melambangkan konektivitas.
2. **Arah 2 (Simbol Abstrak):** Bentuk geometris kristal yang memancarkan energi dan profesionalisme.
3. **Arah 3 (Typographic Wordmark):** Logo berbasis teks kustom dengan modifikasi sudut huruf unik.

## 3. Hasil Pemilihan Konsep
- [x] Konsep 1 dipilih untuk digitalisasi tahap pertama
- [ ] Eksplorasi variasi grid geometris pada vektor
- [ ] Uji keterbacaan pada ukuran favicon 16px

> Catatan: Simpan foto sketsa kasar di kertas ke dalam folder aset proyek.`,
    prompt: 'Buatkan lembar catatan brainstorming ide dan eksplorasi sketsa logo.'
  },
  {
    id: 'ui_handoff_dev_checklist',
    label: 'Checklist Handoff UI ke Developer',
    category: 'design',
    folder: 'tasks',
    tags: ['Handoff', 'UI/UX', 'Developer'],
    color: 'emerald',
    title: 'Checklist Serah Terima UI Design ke Developer',
    content: `# Checklist Serah Terima UI Design ke Developer

## 1. Kerapian File Figma
- [ ] Seluruh frame telah menggunakan sistem Figma Auto-Layout
- [ ] Penamaan layer rapi dan semantik (bukan Frame 123 / Rectangle 45)
- [ ] Seluruh komponen terhubung ke Design System utama
- [ ] Tersedia mockup tampilan Desktop (1440px) dan Mobile (375px)

## 2. Spesifikasi Interaksi & State
- [ ] State tombol lengkap: Default, Hover, Active, Focus, Disabled
- [ ] State form input lengkap: Normal, Filled, Error dengan pesan validasi
- [ ] Animasi transisi dan durasi waktu dicatat jelas (misal: 200ms ease-out)
- [ ] Halaman Empty State dan Loading Skeleton telah dirancang

## 3. Ekspor Aset & Ikon
- [ ] Seluruh ikon diekspor dalam format SVG bersih tanpa background fill
- [ ] Gambar foto diekspor dalam format WebP / PNG resolusi 2x
- [ ] Hak akses link Figma disetel ke 'Viewer with inspect mode' untuk tim dev

> Catatan: Jadwalkan sesi meeting walk-through handoff 30 menit untuk menjawab pertanyaan tim developer.`,
    prompt: 'Buatkan checklist serah terima UI handoff ke tim pengembang developer.'
  },
  {
    id: 'brand_naming_ideas',
    label: 'Eksplorasi Nama Brand (Naming)',
    category: 'design',
    folder: 'ideas',
    tags: ['Naming', 'Brand', 'Ide'],
    color: 'amber',
    title: 'Daftar Eksplorasi Nama Brand & Ketersediaan Domain',
    content: `# Daftar Eksplorasi Nama Brand & Ketersediaan Domain

## 1. Kriteria Nama Ideal
- Mudah diucapkan dan diingat (maksimal 2-3 suku kata)
- Memiliki asosiasi makna positif sesuai industri
- Tersedia domain .com atau .id dan handle username media sosial

## 2. Kategori Eksplorasi Nama
### Tipe 1: Deskriptif & Langsung
- KopiKini, DesainCepat, KreasiDigital

### Tipe 2: Neologisme / Kata Ciptaan Baru
- Agenze, Nexoria, Lumina, Zevora

### Tipe 3: Metafora & Simbolik
- Apex Studio, Horizon Creative, Zenith Labs

## 3. Pengecekan Ketersediaan
| Nama Calon | Domain .com | Domain .id | Instagram Handle | Skor Kesukaan |
|---|---|---|---|---|
| Agenze | Tersedia | Tersedia | @agenze.id | 9 / 10 |
| Lumina | Terpakai | Tersedia | @lumina.studio | 8 / 10 |
| Zevora | Tersedia | Tersedia | @zevorapro | 8.5 / 10 |

> Catatan: Cek database merek dagang DJKI untuk memastikan nama bebas dari sengketa hukum.`,
    prompt: 'Buatkan lembar kerja eksplorasi nama brand dan pengecekan ketersediaan domain.'
  },
  {
    id: 'case_study_structure_note',
    label: 'Struktur Studi Kasus Portofolio',
    category: 'design',
    folder: 'ideas',
    tags: ['Studi Kasus', 'Portofolio', 'Case Study'],
    color: 'purple',
    title: 'Kerangka Penulisan Studi Kasus Portofolio Desain',
    content: `# Kerangka Penulisan Studi Kasus Portofolio Desain

## 1. Judul & Ringkasan Proyek
- **Judul Proyek:** [Nama Klien] - Transformasi Identitas Visual & Website
- **Peran Saya:** Lead UI/UX & Brand Designer
- **Durasi Pengerjaan:** 4 Pekan
- **Ringkasan Hasil:** Peningkatan konversi penjualan sebesar 150% dalam 2 bulan pasca-rilis.

## 2. Latar Belakang & Masalah (The Challenge)
Jelaskan tantangan utama yang dihadapi klien sebelum proyek dimulai:
- Tampilan lama terlihat kuno dan tidak mencerminkan kualitas produk premium.
- Navigasi website lama membingungkan sehingga banyak calon pembeli membatalkan pesanan.

## 3. Proses Riset & Solusi (The Solution)
- **Langkah 1: Riset Audiens & Moodboard** (Analisis preferensi visual generasi modern).
- **Langkah 2: Eksplorasi Desain Logo & Grid System** (Pembuatan identitas yang mudah diingat).
- **Langkah 3: Redesain UI/UX & Prototipe** (Alur checkout disederhanakan dari 5 langkah menjadi 2 langkah).

## 4. Hasil Nyata & Dampak Bisnis (The Impact)
- [x] Nilai transaksi rata-rata (AOV) naik 35%
- [x] Waktu loading halaman turun dari 4.5 detik menjadi 1.2 detik
- [x] Klien mendapatkan liputan positif di media industri

> Catatan: Sertakan visual perbandingan Before vs After berukuran besar di bagian tengah artikel.`,
    prompt: 'Buatkan kerangka penulisan studi kasus portofolio desain yang persuasif.'
  },
  {
    id: 'iconography_rules',
    label: 'Aturan Standar Ikonografi',
    category: 'design',
    folder: 'ideas',
    tags: ['Icons', 'Design System', 'Standar'],
    color: 'sky',
    title: 'Standar & Pedoman Ikonografi Proyek',
    content: `# Standar & Pedoman Ikonografi Proyek

## 1. Spesifikasi Teknis Dasar
- **Ukuran Kanvas:** 24 x 24 piksel
- **Area Aman (Live Area):** 20 x 20 piksel (Padding 2px di seluruh sisi)
- **Ketebalan Garis (Stroke):** 1.5 piksel seragam
- **Corner Radius:** 2 piksel pada sudut tajam
- **Ujung Garis (Stroke Cap):** Round Cap & Round Join

## 2. Panduan Gaya Visual
- Gunakan bentuk dasar geometris (lingkaran, persegi, segitiga) sebagai fondasi.
- Pertahankan sudut kemiringan garis diagonal pada 45 derajat.
- Hindari detail visual berlebih yang tidak terlihat jelas pada skala 16px.

## 3. Checklist Validasi Ikon Baru
- [ ] Ikon telah diselaraskan dengan optical balance di tengah kanvas
- [ ] Stroke telah dikonversi menjadi outline path sebelum diekspor
- [ ] File SVG di-clean dari layer tersembunyi

> Catatan: Gunakan satu set icon library yang sama di seluruh produk untuk menjaga konsistensi.`,
    prompt: 'Buatkan pedoman standar teknis pembuatan set ikonografi desain.'
  },
  {
    id: 'color_accessibility_audit',
    label: 'Audit Aksesibilitas Warna (WCAG)',
    category: 'design',
    folder: 'tasks',
    tags: ['Aksesibilitas', 'WCAG', 'Kontras Warna'],
    color: 'emerald',
    title: 'Audit Aksesibilitas Kontras Warna (WCAG 2.1)',
    content: `# Audit Aksesibilitas Kontras Warna (WCAG 2.1)

## 1. Standar Rasio Kontras
- **Teks Biasa (di bawah 18pt):** Rasio kontras minimal **4.5 : 1** (Level AA)
- **Teks Besar (18pt bold ke atas):** Rasio kontras minimal **3.0 : 1** (Level AA)
- **Elemen UI & Tombol:** Rasio kontras minimal **3.0 : 1** terhadap latar belakang

## 2. Hasil Pengujian Kombinasi Warna
| Elemen | Warna Teks | Warna Latar | Rasio Kontras | Status WCAG |
|---|---|---|---|---|
| Tombol Utama | #FFFFFF | #0EA5E9 | 4.8 : 1 | LOLOS (AA) |
| Paragraf Body | #1E293B | #FFFFFF | 12.6 : 1 | LOLOS (AAA) |
| Teks Muted | #64748B | #F8FAFC | 4.6 : 1 | LOLOS (AA) |
| Tombol Bahaya | #FFFFFF | #EF4444 | 4.5 : 1 | LOLOS (AA) |

## 3. Tindakan Perbaikan
- [x] Naikkan kegelapan teks abu-abu dari #94A3B8 menjadi #64748B
- [ ] Uji tampilan dengan simulator buta warna (Protanopia & Deuteranopia)

> Catatan: Aksesibilitas yang baik memastikan seluruh audiens dapat menggunakan produk dengan nyaman.`,
    prompt: 'Buatkan lembar audit aksesibilitas kontras warna WCAG untuk UI web.'
  },
  {
    id: 'presentation_deck_outline',
    label: 'Outline Presentasi Klien',
    category: 'design',
    folder: 'ideas',
    tags: ['Presentasi', 'Pitching', 'Slide Outline'],
    color: 'amber',
    title: 'Kerangka Slide Presentasi Desain ke Klien',
    content: `# Kerangka Slide Presentasi Desain ke Klien

## 1. Urutan Slide Presentasi (10-12 Slide)
1. **Slide 1:** Judul Presentasi & Nama Proyek Klien
2. **Slide 2:** Rekapitulasi Sasaran & Tantangan Utama (The Brief)
3. **Slide 3:** Riset Pasar & Moodboard Visual Direction
4. **Slide 4:** Konsep Utama 1 (Filosofi & Logo Konstruksi)
5. **Slide 5:** Penerapan Konsep 1 pada Mockup Nyata (Kemasan, Stationery, Web)
6. **Slide 6:** Konsep Utama 2 (Alternatif Arah Visual)
7. **Slide 7:** Penerapan Konsep 2 pada Mockup Nyata
8. **Slide 8:** Perbandingan Kedua Konsep Secara Bersisian
9. **Slide 9:** Rekomendasi Tim Desain & Alasan Strategisnya
10. **Slide 10:** Timeline Tahapan Selanjutnya (Next Steps) & Sesi Diskusi

## 2. Tips Saat Mempresentasikan
- Ceritakan *mengapa* desain ini diciptakan sebelum menunjukkan wujud visualnya.
- Fokus pada bagaimana desain menyelesaikan masalah bisnis klien.

> Catatan: Sediakan waktu minimal 15 menit untuk sesi tanya jawab dan feedback klien.`,
    prompt: 'Buatkan kerangka alur presentasi konsep desain ke hadapan klien.'
  },
  {
    id: 'print_sampling_review',
    label: 'Evaluasi Sampel Cetak (Proofing)',
    category: 'design',
    folder: 'tasks',
    tags: ['Proofing', 'Cetak', 'Evaluasi'],
    color: 'rose',
    title: 'Lembar Evaluasi Sampel Hasil Cetak (Proof Print)',
    content: `# Lembar Evaluasi Sampel Hasil Cetak (Proof Print)

## 1. Informasi Sampel
- Item Cetak: Kemasan Box Produk / Brosur
- Vendor Percetakan: [Nama Percetakan]
- Tanggal Uji Sampel: [Tanggal]

## 2. Poin Pengecekan Kualitas Fisik
- [ ] **Akurasi Warna:** Warna cetak sesuai dengan bukti warna digital (tidak pudar/terlalu gelap)
- [ ] **Ketajaman Teks:** Teks font ukuran kecil (6pt) terbaca jelas tanpa ghosting
- [ ] **Kerapian Potong:** Garis potong presisi, tidak ada konten terpotong miring
- [ ] **Finishing & Laminasi:** Lapisan doff/glossy rata tanpa gelembung udara
- [ ] **Kualitas Lipatan:** Lipatan kertas tidak pecah atau mengelupas

## 3. Catatan Revisi untuk Vendor Percetakan
- Warna merah pada logo perlu dinaikkan saturasinya sebanyak 5%.
- Geser pisau pond sebanyak 1mm ke arah kiri pada area lipatan box samping.

## 4. Keputusan
- [ ] ACC Cetak Masal (Approved)
- [ ] Cetak Ulang Sampel Perbaikan

> Catatan: Simpan sampel fisik yang telah di-ACC sebagai standar acuan kontrol kualitas produksi masal.`,
    prompt: 'Buatkan lembar evaluasi dan kontrol kualitas sampel cetak proof print.'
  },
  {
    id: 'design_archive_guidelines',
    label: 'SOP Pengarsipan Proyek Selesai',
    category: 'design',
    folder: 'tasks',
    tags: ['Arsip', 'SOP', 'File Management'],
    color: 'default',
    title: 'SOP Pengarsipan & Manajemen File Proyek Selesai',
    content: `# SOP Pengarsipan & Manajemen File Proyek Selesai

## 1. Pembersihan File Kerja (Cleanup)
- [ ] Hapus layer tersembunyi, sketsa yang tidak terpakai, dan file duplikat
- [ ] Bersihkan file cache dan temporary export dari folder lokal
- [ ] Pastikan seluruh file final memiliki penamaan standar resmi (misal: *FINAL_v1.0*)

## 2. Struktur Folder Arsip Google Drive
- 📁 [TAHUN]_[NAMA_KLIEN]_[NAMA_PROYEK]
  - 📁 01_Final_Deliverables
  - 📁 02_Source_Files_AI_PSD_Figma
  - 📁 03_Contracts_Invoices_BAST
  - 📁 04_Raw_Assets_Photos

## 3. Backup & Proteksi
- [ ] Sinkronkan folder arsip ke Google Drive / Cloud Storage utama
- [ ] Simpan salinan cadangan ke Hard Disk Eksternal terenkripsi
- [ ] Setel izin akses folder menjadi 'Restricted / Read-Only'

> Catatan: File arsip wajib disimpan minimal 3 tahun untuk kebutuhan pemulihan data klien sewaktu-waktu.`,
    prompt: 'Buatkan SOP pengarsipan file proyek desain yang telah selesai.'
  },

  // ── BISNIS, KLIEN & NEGOSIASI (15 Templates) ──
  {
    id: 'draf_balas_klien',
    label: 'Draf Balasan Email Penawaran',
    category: 'business',
    folder: 'clients',
    tags: ['Email', 'Komunikasi', 'Klien'],
    color: 'sky',
    title: 'Draf Balasan Email Klien & Penawaran Jasa',
    content: `# Draf Balasan Email Klien & Penawaran Jasa

## Format Email Penawaran Jasa Baru

**Subjek:** Penawaran Kerjasama Proyek Desain - [Nama Klien / Perusahaan]

**Yth. Bapak/Ibu [Nama Klien],**

Terima kasih banyak atas ketertarikan Anda untuk bekerjasama dengan kami. Kami sangat antusias untuk membantu mewujudkan kebutuhan visual dan identitas brand bisnis Anda.

Berdasarkan diskusi awal kita, berikut adalah ringkasan ruang lingkup kerja yang kami rekomendasikan:

## Ruang Lingkup Kerja (Scope of Work)
1. Perancangan 3 Konsep Desain Logo Awal
2. Hingga 3 Putaran Revisi untuk Konsep Terpilih
3. Buku Panduan Brand Guideline Standar (Warna, Tipografi, Penggunaan)
4. Seluruh File Master Siap Cetak & Digital (AI, EPS, SVG, PNG, PDF)

## Estimasi Biaya & Jadwal Pengerjaan
- **Investasi Proyek:** Rp [Jumlah Biaya]
- **Durasi Pengerjaan:** 10 - 14 Hari Kerja
- **Termin Pembayaran:** DP 50% di awal dan Pelunasan 50% saat serah terima file

Jika penawaran ini telah sesuai, silakan konfirmasi balasan email ini agar kami dapat menyiapkan dokumen perjanjian kerjasama dan invoice uang muka.

Salam hangat,  
**[Nama Anda]**  
*Desainer & Konsultan Kreatif*

> Catatan: Simpan template ini dan sesuaikan angka estimasi serta nama klien sebelum mengirim.`,
    prompt: 'Buatkan draf balasan email penawaran jasa kreatif kepada calon klien.'
  },
  {
    id: 'template_invoice_penawaran',
    label: 'Template Invoice & Penawaran Biaya',
    category: 'business',
    folder: 'clients',
    tags: ['Invoice', 'Keuangan', 'Bisnis'],
    color: 'emerald',
    title: 'Template Rincian Invoice & Penawaran Biaya',
    content: `# Template Rincian Invoice & Penawaran Biaya

## Informasi Invoice
- **No. Invoice:** INV/2026/08/001
- **Tanggal Terbit:** [Tanggal Hari Ini]
- **Jatuh Tempo:** [7 Hari ke Depan]
- **Klien:** [Nama Klien / Perusahaan]

## Rincian Layanan (Itemized Services)

| No | Deskripsi Layanan | Qty | Harga Satuan | Total |
|---|---|---|---|---|
| 1 | Desain Brand Identity & Logo Master | 1 Paket | Rp 3.500.000 | Rp 3.500.000 |
| 2 | Desain Brosur & Stationery Perusahaan | 1 Paket | Rp 1.200.000 | Rp 1.200.000 |
| 3 | Penyusunan Brand Guideline PDF | 1 Dokumen | Rp 800.000 | Rp 800.000 |

- **Subtotal:** Rp 5.500.000
- **Uang Muka / DP (50%):** Rp 2.750.000
- **Sisa Pelunasan:** Rp 2.750.000

## Informasi Rekening Pembayaran
- **Nama Bank:** Bank Central Asia (BCA)
- **No. Rekening:** 123-456-7890
- **Atas Nama:** [Nama Rekening Anda]

## Ketentuan Pembayaran (Terms & Conditions)
- Pengerjaan proyek dimulai setelah konfirmasi pembayaran DP 50% diterima.
- Pelunasan wajib diselesaikan sebelum penyerahan seluruh file master vektor.

> Catatan: Lampirkan bukti transfer pembayaran via WhatsApp atau email konfirmasi.`,
    prompt: 'Buatkan template invoice resmi penawaran biaya proyek desain dan ketentuan pembayaran.'
  },
  {
    id: 'notula_rapat_klien',
    label: 'Notula Rapat & Action Items',
    category: 'business',
    folder: 'clients',
    tags: ['Meeting', 'Notula', 'Klien'],
    color: 'amber',
    title: 'Notula Rapat & Action Items Klien',
    content: `# Notula Rapat & Action Items Klien

## 1. Detail Pertemuan
- **Tanggal & Waktu:** [Hari, Tanggal - Jam]
- **Media Pertemuan:** Google Meet / Zoom / Tatap Muka
- **Peserta Rapat:** [Nama Anda], [Nama Klien 1], [Nama Klien 2]
- **Agenda Utama:** Review Konsep Awal & Penyelarasan Jadwal Rilis

## 2. Poin-Poin Penting Diskusi
- Klien menyukai arah Konsep 2 dengan nuansa warna biru tua dan aksen emas.
- Perlu penyesuaian pada ikon simbol agar terlihat lebih tegas saat diperkecil di favicon.
- Format packaging akan disesuaikan dengan ukuran botol 250ml dan 500ml.

## 3. Keputusan yang Disepakati
1. Konsep desain 2 dipilih sebagai konsep final yang akan dikembangkan.
2. Penambahan waktu pengerjaan 3 hari untuk penyesuaian dieline kemasan baru.
3. Seluruh materi copywriting akan disediakan oleh tim klien pada hari Jumat.

## 4. Daftar Tindakan Selanjutnya (Action Items)
- [ ] Kirimkan revisi ikon logo ukuran 16x16px dan 32x32px (PIC: Desainer - Batas: Rabu)
- [ ] Kirimkan teks komposisi produk lengkap (PIC: Klien - Batas: Jumat)
- [ ] Jadwalkan sesi presentasi finalisasi desain kemasan (PIC: Desainer - Batas: Senin)

> Catatan: Kirimkan salinan notula ini kepada seluruh peserta rapat maksimal 2 jam setelah meeting selesai.`,
    prompt: 'Buatkan template notula rapat klien lengkap dengan action items dan PIC.'
  },
  {
    id: 'client_onboarding_questionnaire',
    label: 'Kuesioner Onboarding Klien',
    category: 'business',
    folder: 'clients',
    tags: ['Kuesioner', 'Onboarding', 'Klien'],
    color: 'purple',
    title: 'Kuesioner Kebutuhan Proyek Klien Baru',
    content: `# Kuesioner Kebutuhan Proyek Klien Baru

Mohon luangkan waktu 5-10 menit untuk melengkapi pertanyaan berikut guna membantu kami memahami visi bisnis Anda:

## 1. Profil & Visi Bisnis
- Apa nama resmi brand/perusahaan Anda?
- Ceritakan secara singkat produk atau layanan utama yang Anda tawarkan:
- Apa nilai pembeda utama (USP) bisnis Anda dibandingkan kompetitor?

## 2. Target Pelanggan
- Siapa target pelanggan ideal Anda (usia, profesi, gaya hidup)?
- Masalah apa yang paling ingin Anda selesaikan untuk pelanggan Anda?

## 3. Preferensi Visual & Nada Komunikasi
- 3 kata sifat yang paling menggambarkan brand Anda (misal: Mewah, Bersahabat, Inovatif):
- Sebutkan 2-3 contoh brand atau website yang gayanya sangat Anda kagumi:
- Warna apa yang WAJIB ada dan warna apa yang TIDAK BOLEH digunakan?

## 4. Ruang Lingkup & Tenggat Waktu
- Apa saja output akhir yang paling mendesak dibutuhkan?
- Kapan tanggal peluncuran resmi yang Anda targetkan?

> Terima kasih atas waktu Anda. Jawaban ini menjadi fondasi riset kreatif tim kami.`,
    prompt: 'Buatkan lembar kuesioner onboarding klien baru untuk menggali kebutuhan proyek.'
  },
  {
    id: 'quotation_letter_formal',
    label: 'Surat Penawaran Harga (Quotation)',
    category: 'business',
    folder: 'clients',
    tags: ['Quotation', 'Penawaran', 'Bisnis'],
    color: 'sky',
    title: 'Surat Penawaran Harga Resmi (Quotation)',
    content: `# Surat Penawaran Harga Resmi (Quotation)

**Nomor Surat:** QUO/2026/08/104  
**Tanggal:** [Tanggal Hari Ini]  
**Lampiran:** 1 Berkas Rincian Teknis  

**Kepada Yth.**  
Bapak/Ibu Pimpinan [Nama Perusahaan Klien]  
di Tempat  

Dengan hormat,  
Sehubungan dengan rencana pengembangan identitas visual dan website perusahaan Bapak/Ibu, bersama surat ini kami mengajukan penawaran harga layanan profesional sebagai berikut:

## Rincian Paket Penawaran

| No | Nama Paket Layanan | Spesifikasi Ringkas | Investasi |
|---|---|---|---|
| 1 | Paket Brand Identity Master | Logo primer/sekunder, brand guidelines, stationery | Rp 4.500.000 |
| 2 | Paket Website Company Profile | 5 Halaman responsif, CMS, SEO on-page, SSL | Rp 6.500.000 |

**Total Nilai Penawaran:** Rp 11.000.000 (Sebelas Juta Rupiah)

## Ketentuan Penawaran:
1. Penawaran harga ini berlaku selama 14 hari sejak tanggal surat diterbitkan.
2. Waktu pengerjaan diperkirakan selama 20 hari kerja efektif sejak DP diterima.
3. Pembayaran dilakukan bertahap (DP 50% dan Pelunasan 50%).

Demikian surat penawaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.

Hormat kami,  
**[Nama Anda]**  
*Managing Director*`,
    prompt: 'Buatkan surat penawaran harga resmi quotation untuk klien institusi.'
  },
  {
    id: 'mou_agreement_contract',
    label: 'Perjanjian Kerjasama (MoU)',
    category: 'business',
    folder: 'clients',
    tags: ['MoU', 'Kontrak', 'Legal'],
    color: 'emerald',
    title: 'Surat Perjanjian Kerjasama Jasa Kreatif (MoU)',
    content: `# Surat Perjanjian Kerjasama Jasa Kreatif (MoU)

Pada hari ini, [Hari], [Tanggal], kami yang bertanda tangan di bawah ini:
1. **PIHAK PERTAMA:** [Nama Anda / Agensi], berkedudukan di [Alamat Anda], bertindak sebagai Penyedia Jasa.
2. **PIHAK KEDUA:** [Nama Klien / Perusahaan], berkedudukan di [Alamat Klien], bertindak sebagai Pengguna Jasa.

Kedua belah pihak sepakat mengadakan perjanjian kerjasama dengan ketentuan:

## Pasal 1: Ruang Lingkup Pekerjaan
PIHAK PERTAMA berkewajiban merancang dan menyelesaikan proyek [Nama Proyek] sesuai dengan rincian brief yang disepakati.

## Pasal 2: Biaya & Tata Cara Pembayaran
1. Total biaya proyek yang disepakati adalah sebesar Rp [Jumlah Biaya].
2. Pembayaran dilakukan via transfer bank dalam 2 termin:
   - Termin 1: Uang muka 50% dibayarkan saat penandatanganan perjanjian.
   - Termin 2: Pelunasan 50% dibayarkan sebelum penyerahan seluruh file master.

## Pasal 3: Hak Cipta & Portofolio
1. Hak cipta penuh beralih ke PIHAK KEDUA setelah pembayaran lunas 100%.
2. PIHAK PERTAMA berhak menampilkan karya ini dalam portofolio promosi profesionalnya.

Pihak Pertama, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Pihak Kedua,  
*(Tanda Tangan & Materai)* &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; *(Tanda Tangan & Materai)*  
**[Nama Anda]** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **[Nama Klien]**`,
    prompt: 'Buatkan surat perjanjian kerjasama MoU jasa desain dan pengembangan web.'
  },
  {
    id: 'copyright_handover_cert',
    label: 'Surat Serah Terima Hak Cipta',
    category: 'business',
    folder: 'clients',
    tags: ['Hak Cipta', 'Copyright', 'Sertifikat'],
    color: 'purple',
    title: 'Surat Pengalihan Hak Cipta & Kepemilikan Desain',
    content: `# Surat Pengalihan Hak Cipta & Kepemilikan Desain

**Nomor Sertifikat:** CR-TRANS/2026/08/01  

Dengan ini menyatakan bahwa:
- **Pencipta / Desainer:** [Nama Anda]
- **Penerima Pengalihan:** [Nama Klien / Perusahaan]
- **Karya yang Dialihkan:** Desain Logo & Identitas Visual [Nama Brand]

## Pernyataan Pengalihan Hak:
1. Desainer menyatakan bahwa karya tersebut adalah murni karya orisinil dan bebas dari sengketa hak cipta pihak ketiga.
2. Terhitung sejak tanggal pelunasan [Tanggal Pelunasan], seluruh Hak Ekonomi dan Kepemilikan Komersial atas karya tersebut dialihkan sepenuhnya kepada Penerima Pengalihan tanpa batasan wilayah dan waktu.
3. Desainer tetap memegang Hak Moral sebagai pencipta orisinil untuk mencantumkan karya dalam portofolio profesional.

Diterbitkan di: [Kota Anda]  
Pada tanggal: [Tanggal]  

**Pencipta Desain,**  
*(Tanda Tangan Digital)*  
**[Nama Anda]**`,
    prompt: 'Buatkan surat pernyataan pengalihan hak cipta desain orisinil kepada klien.'
  },
  {
    id: 'client_complaint_resolution',
    label: 'Penanganan Komplain & Resolusi',
    category: 'business',
    folder: 'clients',
    tags: ['Komplain', 'Resolusi', 'Klien'],
    color: 'rose',
    title: 'Formulir Penanganan Komplain & Rencana Perbaikan',
    content: `# Formulir Penanganan Komplain & Rencana Perbaikan

## 1. Data Keluhan Klien
- **Klien:** [Nama Klien]
- **Tanggal Diterima:** [Tanggal]
- **Subjek Keluhan:** [Misal: Keterlambatan Pengiriman File / Ketidaksesuaian Warna Cetak]
- **Tingkat Urgensi:** Tinggi (Segera Diselesaikan dalam 24 Jam)

## 2. Deskripsi Masalah & Dampak
Jelaskan kronologi keluhan yang disampaikan oleh klien:
*Klien merasa warna biru pada hasil cetak kartu nama terlalu gelap dibanding preview layar.*

## 3. Investigasi Penyebab (Root Cause)
Perbedaan profil warna mesin cetak vendor lokal yang tidak menggunakan profil FOGRA39.

## 4. Solusi & Rencana Tindakan Perbaikan
- [ ] Buat file penyesuaian kurva warna cetak yang dikoreksi (naikkan brightness 10%)
- [ ] Tanggung biaya cetak ulang sampel kartu nama (Garansi Kepuasan)
- [ ] Kirimkan hasil cetak baru ke kantor klien via kurir instan
- [ ] Follow-up panggilan telepon untuk memastikan kepuasan klien

> Catatan: Respon cepat dan solusi nyata adalah kunci mempertahankan kepercayaan klien.`,
    prompt: 'Buatkan lembar formulir penanganan komplain klien dan rencana perbaikan garansi.'
  },
  {
    id: 'client_testimonial_form',
    label: 'Formulir Review & Testimoni Klien',
    category: 'business',
    folder: 'clients',
    tags: ['Testimoni', 'Review', 'Social Proof'],
    color: 'emerald',
    title: 'Formulir Pengumpulan Testimoni & Review Klien',
    content: `# Formulir Pengumpulan Testimoni & Review Klien

Halo [Nama Klien], terima kasih telah mempercayakan proyek Anda kepada kami. Kami sangat senang bisa menjadi bagian dari kesuksesan brand Anda!

Mohon kesediaan Anda menjawab 3 pertanyaan singkat berikut untuk evaluasi dan testimoni portofolio kami:

## 1. Pengalaman Kerjasama
*Bagaimana pengalaman Anda bekerjasama dengan tim kami selama pengerjaan proyek?*  
> "Pelayanan sangat profesional, komunikatif, dan hasil desain jauh melebihi ekspektasi awal kami!"

## 2. Hasil Nyata yang Dirasakan
*Apa perubahan atau hasil positif paling nyata yang dirasakan bisnis Anda setelah menggunakan desain baru ini?*  
> "Klien kami memuji tampilan baru yang terlihat jauh lebih mewah dan konversi penjualan kami meningkat drastis."

## 3. Rekomendasi
*Apakah Anda bersedia merekomendasikan layanan kami kepada rekan bisnis lainnya?*  
- [x] Ya, Sangat Merekomendasikan (Bintang 5 ⭐⭐⭐⭐⭐)

---
- **Nama & Gelar:** [Nama Klien]
- **Jabatan & Perusahaan:** [Jabatan, PT / Brand]
- **Izin Foto Profil:** [x] Diizinkan dipasang di website portofolio`,
    prompt: 'Buatkan formulir pengumpulan ulasan dan testimoni kepuasan klien.'
  },
  {
    id: 'price_negotiation_script',
    label: 'Skrip Negosiasi Harga & Scope',
    category: 'business',
    folder: 'clients',
    tags: ['Negosiasi', 'Harga', 'Komunikasi'],
    color: 'amber',
    title: 'Skrip Tanggapan Negosiasi Harga & Penyesuaian Scope',
    content: `# Skrip Tanggapan Negosiasi Harga & Penyesuaian Scope

## Skenario: Klien Meminta Diskon / Anggaran Kurang

**Format Respon Balasan Sopan & Tegas:**

"Yth. Bapak/Ibu [Nama Klien],

Terima kasih atas tanggapan Anda. Kami sangat memahami pertimbangan anggaran yang sedang disesuaikan oleh perusahaan Anda.

Standar biaya yang kami tawarkan mencerminkan riset mendalam, kualitas aset vektor orisinil, dan garansi pendampingan purna-jual. Kami tidak dapat menurunkan harga untuk ruang lingkup kerja (scope) yang sama guna menjaga standar kualitas terbaik.

Namun, kami memiliki **opsi alternatif penyesuaian scope** agar pas dengan anggaran Anda saat ini:

### Opsi Alternatif yang Disesuaikan:
1. **Opsi A (Fokus Kebutuhan Utama):** Kami kerjakan 1 konsep logo terpilih dengan 2x revisi (tanpa brand guidelines tebal). Biaya: Rp [Anggaran Klien].
2. **Opsi B (Termin Fleksibel):** Ruang lingkup tetap lengkap, namun pembayaran dibagi menjadi 3 termin bulanan.

Silakan beri tahu kami opsi mana yang paling nyaman untuk Anda lanjutkan."

> Catatan: Jangan pernah menurunkan harga tanpa mengurangi ruang lingkup kerja (scope of work).`,
    prompt: 'Buatkan skrip komunikasi diplomatis saat menghadapi klien yang meminta diskon harga.'
  },
  {
    id: 'followup_pending_proposal',
    label: 'Template Email Follow-Up Proposal',
    category: 'business',
    folder: 'clients',
    tags: ['Follow Up', 'Email', 'Penawaran'],
    color: 'sky',
    title: 'Template Email Follow-Up Penawaran Tertunda',
    content: `# Template Email Follow-Up Penawaran Tertunda

## Follow-Up 1 (H+3 Setelah Kirim Proposal)

**Subjek:** Follow-up: Penawaran Kerjasama Desain - [Nama Klien]

**Yth. Bapak/Ibu [Nama Klien],**

Semoga Anda dalam keadaan sehat dan produktif.

Saya ingin memastikan apakah dokumen proposal penawaran yang kami kirimkan pada hari [Hari Pengiriman] telah diterima dengan baik?

Jika ada poin ruang lingkup kerja atau rincian biaya yang ingin didiskusikan atau disesuaikan lebih lanjut, kami dengan senang hati siap menjadwalkan panggilan singkat 10 menit.

Terima kasih banyak atas waktu dan pertimbangan Anda.

Salam hangat,  
**[Nama Anda]**

---

## Follow-Up 2 (H+7 - Pengecekan Slot Pengerjaan)
"Kami ingin menginformasikan bahwa slot pengerjaan proyek untuk bulan ini tersisa 2 slot. Jika Anda berencana memulai bulan ini, kami sarankan konfirmasi minggu ini agar jadwal peluncuran Anda tetap aman."`,
    prompt: 'Buatkan template email follow up penawaran proposal yang ramah dan tidak memaksa.'
  },
  {
    id: 'overdue_invoice_reminder',
    label: 'Skrip Penagihan Invoice Jatuh Tempo',
    category: 'business',
    folder: 'clients',
    tags: ['Invoice', 'Penagihan', 'Keuangan'],
    color: 'rose',
    title: 'Skrip Pengingat Pembayaran Invoice Jatuh Tempo',
    content: `# Skrip Pengingat Pembayaran Invoice Jatuh Tempo

## Tingkat 1: Pengingat Halus (H-2 Sebelum Jatuh Tempo)
"Yth. Bapak/Ibu [Nama Klien], hanya ingin mengingatkan dengan ramah bahwa Invoice **[No. Invoice]** sebesar Rp [Jumlah] akan jatuh tempo pada tanggal [Tanggal]. Tautan invoice dan nomor rekening BCA terlampir. Terima kasih banyak!"

---

## Tingkat 2: Pengingat Formal (H+1 Setelah Jatuh Tempo)
**Subjek:** Pengingat Pembayaran Invoice [No. Invoice] - [Nama Perusahaan]

**Yth. Bapak/Ibu [Nama Klien],**

Berdasarkan catatan administrasi kami, pembayaran untuk Invoice **[No. Invoice]** yang jatuh tempo pada [Tanggal Jatuh Tempo] belum kami terima.

Mohon konfirmasi status proses pembayaran dari tim keuangan Anda. Jika pembayaran telah dilakukan, mohon lampirkan bukti transfer agar sistem kami dapat segera memperbarui status akun Anda.

Terima kasih atas kerjasamanya.

---

## Tingkat 3: Pemberitahuan Penghentian Sementara (H+7)
"Mengingat invoice telah melewati jatuh tempo 7 hari kerja, dengan berat hati pengerjaan proyek sementara kami jeda hingga konfirmasi pelunasan diterima."`,
    prompt: 'Buatkan skrip berjenjang pengingat penagihan invoice jatuh tempo secara profesional.'
  },
  {
    id: 'scope_change_request_form',
    label: 'Formulir Perubahan Scope (CR)',
    category: 'business',
    folder: 'clients',
    tags: ['Change Request', 'Scope', 'Kontrak'],
    color: 'amber',
    title: 'Formulir Perubahan Lingkup Kerja (Change Request)',
    content: `# Formulir Perubahan Lingkup Kerja (Change Request)

**No. CR:** CR/2026/08/03  
**Nama Proyek:** [Nama Proyek]  
**Klien:** [Nama Klien]  

## 1. Permintaan Fitur / Desain Tambahan
Jelaskan penambahan pekerjaan di luar perjanjian awal:
- Penambahan 3 halaman web baru (Halaman Karir, Studi Kasus, FAQ Interaktif).
- Integrasi sistem pembayaran tambahan (Multi-currency USD & SGD).

## 2. Dampak Terhadap Biaya & Waktu
- **Penyesuaian Biaya Tambahan:** Rp 2.500.000
- **Penambahan Waktu Pengerjaan:** +5 Hari Kerja dari timeline awal
- **Target Deadline Baru:** [Tanggal Baru]

## 3. Persetujuan
Pekerjaan tambahan akan mulai dikerjakan setelah formulir ini disetujui kedua belah pihak.

Disetujui oleh Klien, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Disetujui oleh Desainer,  
**[Nama Klien]** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **[Nama Anda]**`,
    prompt: 'Buatkan formulir change request resmi untuk penambahan scope kerja dan biaya.'
  },
  {
    id: 'declining_project_politely',
    label: 'Draf Penolakan Proyek Sopan',
    category: 'business',
    folder: 'clients',
    tags: ['Penolakan', 'Komunikasi', 'Etika'],
    color: 'default',
    title: 'Draf Menolak Tawaran Proyek Secara Sopan & Elegan',
    content: `# Draf Menolak Tawaran Proyek Secara Sopan & Elegan

## Skenario: Kapasitas Penuh / Proyek Tidak Sesuai Spesialisasi

**Subjek:** Tanggapan Tawaran Proyek: [Nama Proyek] - [Nama Klien]

**Yth. Bapak/Ibu [Nama Klien],**

Terima kasih banyak atas kehormatan dan kepercayaan Anda telah menghubungi kami terkait proyek [Nama Proyek].

Setelah meninjau jadwal dan kapasitas studio kami secara seksama, saat ini seluruh slot produksi kami telah terisi penuh hingga akhir bulan depan. Demi menjaga standar kualitas dan komitmen tenggat waktu bagi klien yang sedang berjalan, dengan berat hati kami belum dapat menerima proyek baru dalam waktu dekat.

Jika Anda berkenan, kami dengan senang hati dapat merekomendasikan rekan desainer profesional di jaringan kami yang memiliki spesialisasi di bidang Anda.

Kami mendoakan kelancaran dan kesuksesan untuk proyek Anda, dan berharap dapat bekerjasama di kesempatan mendatang.

Salam hangat,  
**[Nama Anda]**`,
    prompt: 'Buatkan draf email menolak tawaran proyek klien secara sopan dan tetap profesional.'
  },
  {
    id: 'project_post_mortem_review',
    label: 'Evaluasi Pasca-Proyek (Post-Mortem)',
    category: 'business',
    folder: 'tasks',
    tags: ['Evaluasi', 'Post-Mortem', 'Pembelajaran'],
    color: 'purple',
    title: 'Evaluasi Pasca-Proyek & Analisis Kinerja Tim',
    content: `# Evaluasi Pasca-Proyek & Analisis Kinerja Tim (Post-Mortem)

## 1. Ringkasan Kinerja Proyek
- **Proyek:** [Nama Proyek]
- **Target Deadline vs Realisasi:** 14 Hari -> Selesai dalam 12 Hari (2 Hari Lebih Cepat)
- **Target Anggaran vs Realisasi Biaya:** Rp 10.000.000 -> Pengeluaran Rp 7.200.000 (Margin 28%)

## 2. Apa yang Berjalan Sangat Baik? (What Went Well)
- Kuesioner onboarding di awal sangat membantu memperjelas brief sehingga revisi minim.
- Penggunaan Figma Design System mempercepat proses slicing frontend sebesar 40%.

## 3. Apa yang Perlu Ditingkatkan? (Areas for Improvement)
- Vendor cetak sempat terlambat 1 hari; perlu menyiapkan vendor cadangan terverifikasi.
- Instruksi copywriting dari klien sempat terlambat masuk.

## 4. Tindakan Perbaikan untuk Proyek Berikutnya
- [ ] Buat perjanjian klausul penguncian jadwal jika materi teks dari klien terlambat.
- [ ] Tambahkan daftar 2 vendor percetakan alternatif di dokumen kontak darurat.

> Catatan: Pembelajaran yang didokumentasikan adalah aset paling berharga untuk pertumbuhan bisnis.`,
    prompt: 'Buatkan dokumen evaluasi pasca proyek post-mortem untuk perbaikan tim.'
  },

  // ── TUGAS, SPRINT & MANAJEMEN PROYEK (15 Templates) ──
  {
    id: 'sprint_todo_harian',
    label: 'Sprint To-Do List Harian',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Sprint', 'To-Do', 'Produktif'],
    color: 'emerald',
    title: 'Sprint To-Do List & Target Harian',
    content: `# Sprint To-Do List & Target Harian

## 🔴 Prioritas Tinggi (Urgent & Penting)
- [ ] Selesaikan revisi logo klien PT Maju Sejahtera
- [ ] Kirimkan penawaran harga (quotation) ke calon klien baru
- [ ] Export file master kemasan untuk percetakan

## 🟡 Prioritas Sedang (Penting & Terjadwal)
- [ ] Buat 3 draf postingan carousel Instagram pekan depan
- [ ] Review performa landing page dan cek form masuk
- [ ] Rapikan struktur folder file arsip proyek bulan lalu

## 🟢 Tugas Rutin & Maintenance
- [ ] Bersihkan inbox email dan balas pesan tertunda
- [ ] Backup database portofolio ke Google Drive
- [ ] Catat pengeluaran operasional hari ini

## 💡 Catatan & Ide Cepat Hari Ini
- Coba eksplorasi gaya tipografi font Serif modern untuk proyek brand fashion mendatang.
- Riset tools AI terbaru untuk mempercepat pembuatan mockup realistis.

> Catatan: Fokus selesaikan seluruh tugas di bagian Prioritas Tinggi sebelum berpindah ke tugas lainnya.`,
    prompt: 'Buatkan sprint to-do list harian dengan klasifikasi prioritas yang jelas.'
  },
  {
    id: 'weekly_work_planner',
    label: 'Rencana Kerja Mingguan (Weekly)',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Weekly', 'Planner', 'Manajemen Waktu'],
    color: 'sky',
    title: 'Rencana Kerja & Target Mingguan (Weekly Planner)',
    content: `# Rencana Kerja & Target Mingguan (Weekly Planner)

## 🎯 Target Utama Pekan Ini (Big Rocks)
1. Peluncuran website company profile klien A
2. Finalisasi konsep identitas visual klien B
3. Penulisan 2 artikel studi kasus portofolio

## 📅 Jadwal Harian
- **Senin:** Kickoff meeting proyek baru + Riset moodboard & eksplorasi konsep
- **Selasa:** Pengerjaan wireframe & slicing UI komponen
- **Rabu:** Review internal desain + Penyusunan mockup presentasi
- **Kamis:** Sesi presentasi konsep ke klien + Pencatatan feedback revisi
- **Jumat:** Eksekusi revisi final + Pengiriman file master & invoicing

## 📊 Evaluasi Akhir Pekan
- [ ] Seluruh target utama tercapai tepat waktu
- [ ] Jam kerja efektif: 38 Jam
- [ ] Tagihan invoice terkirim: 2 Dokumen

> Catatan: Susun rencana mingguan setiap hari Minggu sore atau Senin pagi sebelum mulai bekerja.`,
    prompt: 'Buatkan lembar rencana kerja mingguan terstruktur Senin sampai Jumat.'
  },
  {
    id: 'qa_checklist_final',
    label: 'QA Checklist & Final Review',
    category: 'tasks',
    folder: 'tasks',
    tags: ['QA', 'Review', 'Quality'],
    color: 'rose',
    title: 'Checklist Quality Assurance (QA) & Final Review',
    content: `# Checklist Quality Assurance (QA) & Final Review

## 1. Pengecekan Desain Visual & Tipografi
- [ ] Bebas dari kesalahan ketik (typo) dan ejaan tata bahasa
- [ ] Kontras warna teks terhadap latar belakang memenuhi standar WCAG (mudah dibaca)
- [ ] Konsistensi jarak margin, padding, dan sistem grid di seluruh halaman
- [ ] Seluruh font teks telah di-convert to outline / expand pada file vektor

## 2. Pengecekan Teknis File & Gambar
- [ ] Format warna sesuai peruntukan (CMYK untuk cetak, RGB untuk digital)
- [ ] Resolusi gambar minimal 300 DPI untuk materi cetak dan 2x untuk layar retina
- [ ] Area bleed minimal 3mm telah ditambahkan pada template cetak
- [ ] File SVG telah di-clean dari metadata yang tidak perlu

## 3. Pengecekan Website & Interaktivitas
- [ ] Seluruh tautan (link) dan tombol berfungsi dengan benar (tidak ada 404)
- [ ] Formulir kontak berhasil mengirimkan notifikasi saat diuji coba
- [ ] Tampilan responsif sempurna di perangkat smartphone (iOS & Android)
- [ ] Kecepatan loading halaman teruji di bawah 2.5 detik

## 4. Persetujuan Akhir
- [ ] Internal Quality Check dinyatakan LOLOS
- [ ] Siap diserahkan kepada klien untuk persetujuan final

> Catatan: Jangan pernah mengirim file ke percetakan sebelum melewati seluruh checklist di atas.`,
    prompt: 'Buatkan checklist quality assurance QA dan review final sebelum penyerahan proyek.'
  },
  {
    id: 'milestone_tracker_timeline',
    label: 'Timeline & Milestone Tracker',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Milestone', 'Timeline', 'Tracker'],
    color: 'purple',
    title: 'Pelacak Milestone & Jadwal Proyek Terpadu',
    content: `# Pelacak Milestone & Jadwal Proyek Terpadu

## Informasi Proyek
- Nama Proyek: [Nama Proyek]
- Total Durasi: 30 Hari Kalender

## Tabel Pelacak Tahapan (Milestones)

| Fase | Deskripsi Tahapan | Tenggat Waktu | PIC | Status |
|---|---|---|---|---|
| M1 | Pengumpulan Brief & Riset Kompetitor | H+3 | Desainer | Selesai |
| M2 | Presentasi 3 Arah Konsep Awal | H+8 | Lead | Selesai |
| M3 | Putaran Revisi & Penyempurnaan | H+14 | Desainer | Dalam Proses |
| M4 | Penyusunan Brand Guidelines & Mockup | H+20 | Desainer | Belum Mulai |
| M5 | Uji Coba Slicing Frontend & Review QA | H+26 | Dev | Belum Mulai |
| M6 | Serah Terima File Master & Pelunasan | H+30 | Admin | Belum Mulai |

## Hambatan & Ketergantungan (Blockers)
- Menunggu konfirmasi foto produk resolusi tinggi dari tim marketing klien (Target: Besok).

> Catatan: Perbarui status tabel milestone setiap hari kerja pukul 17.00.`,
    prompt: 'Buatkan tabel pelacak milestone dan jadwal tahapan proyek desain.'
  },
  {
    id: 'eisenhower_matrix_note',
    label: 'Matriks Prioritas Eisenhower',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Prioritas', 'Eisenhower', 'Produktivitas'],
    color: 'amber',
    title: 'Matriks Prioritas Tugas (Eisenhower Matrix)',
    content: `# Matriks Prioritas Tugas (Eisenhower Matrix)

## 1. Kuadran 1: LAKUKAN SEGERA (Urgent & Penting)
*Krisis, deadline ketat, dan masalah mendesak yang berdampak langsung:*
- [ ] Perbaiki bug formulir kontak website klien yang tidak mengirim pesan
- [ ] Kirimkan revisi final materi cetak sebelum jam tutup percetakan

## 2. Kuadran 2: JADWALKAN (Tidak Urgent tapi Sangat Penting)
*Perencanaan strategis, pembelajaran, dan pengembangan bisnis jangka panjang:*
- [ ] Perbarui studi kasus website portofolio pribadi
- [ ] Pelajari teknik optimasi performa web terbaru
- [ ] Olahraga dan istirahat teratur

## 3. Kuadran 3: DELEGASIKAN (Urgent tapi Kurang Penting)
*Interupsi, meeting rutin, dan tugas administratif:*
- [ ] Pembuatan faktur nota rutin bulanan
- [ ] Pengurutan file gambar raw ke folder arsip

## 4. Kuadran 4: HAPUS / HINDARI (Tidak Urgent & Tidak Penting)
*Aktivitas pembuang waktu:*
- [ ] Scrolling media sosial tanpa tujuan saat jam kerja fokus

> Catatan: Luangkan minimal 60% waktu Anda di Kuadran 2 untuk mencegah krisis di Kuadran 1.`,
    prompt: 'Buatkan lembar pembagian tugas dengan matriks prioritas Eisenhower.'
  },
  {
    id: 'bug_report_tech_log',
    label: 'Log Laporan Bug & Isu Teknis',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Bug Report', 'Teknis', 'QA'],
    color: 'rose',
    title: 'Log Laporan Bug & Masalah Teknis Sistem',
    content: `# Log Laporan Bug & Masalah Teknis Sistem

## 1. Detail Isu
- **ID Bug:** BUG-2026-004
- **Halaman Terdampak:** /checkout / keranjang belanja
- **Perangkat / Browser:** Safari di iPhone 14 iOS 17
- **Tingkat Keparahan:** Kritis (Menghalangi Pembayaran)

## 2. Langkah Mereproduksi Masalah (Steps to Reproduce)
1. Buka halaman katalog dan tambahkan 2 produk ke keranjang.
2. Klik tombol "Lanjut ke Pembayaran".
3. Pilih metode pembayaran Transfer Bank.
4. Tombol "Bayar Sekarang" tidak merespon saat ditekan.

## 3. Perilaku yang Diharapkan vs Aktual
- **Harapan:** Muncul popup instruksi nomor rekening dan nota transaksi.
- **Aktual:** Halaman diam dan muncul pesan error di console: *Uncaught TypeError*.

## 4. Status Perbaikan
- [x] Akar masalah teridentifikasi (Validasi tipe data integer pada nominal harga)
- [x] Patch perbaikan diuji di server staging
- [ ] Deploy hotfix ke server produksi live

> Catatan: Laporkan setiap bug dengan langkah reproduksi yang jelas agar cepat ditangani.`,
    prompt: 'Buatkan template laporan bug dan isu teknis sistem aplikasi web.'
  },
  {
    id: 'daily_standup_notes',
    label: 'Daily Standup Notes',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Standup', 'Daily', 'Agile'],
    color: 'emerald',
    title: 'Catatan Rapat Singkat Harian (Daily Standup)',
    content: `# Catatan Rapat Singkat Harian (Daily Standup)

**Tanggal:** [Hari, Tanggal]  
**Waktu:** 09.00 - 09.15 WIB (15 Menit)  

## 1. Apa yang Berhasil Diselesaikan Kemarin? (Yesterday)
- [x] Menyelesaikan slicing 3 halaman landing page
- [x] Mengirimkan draf penawaran ke calon klien properti
- [x] Menguji performa Core Web Vitals di mobile

## 2. Apa yang Akan Dikerjakan Hari Ini? (Today)
- [ ] Integrasi webhook notifikasi WhatsApp ke form checkout
- [ ] Export aset ikon dan ilustrasi dalam format SVG
- [ ] Sesi review desain internal bersama tim produk

## 3. Apa Hambatan atau Kendala yang Dihadapi? (Blockers)
- *Tidak ada kendala besar; menunggu kredensial API gateway pembayaran dari klien.*

> Catatan: Rapat standup harus ringkas dan fokus pada koordinasi cepat serta pemecahan kendala.`,
    prompt: 'Buatkan lembar catatan rapat harian daily standup tiga pertanyaan agile.'
  },
  {
    id: 'sprint_retro_notes',
    label: 'Retrospektif Sprint (Retro)',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Retrospektif', 'Sprint', 'Improvement'],
    color: 'purple',
    title: 'Catatan Retrospektif Sprint & Perbaikan Tim',
    content: `# Catatan Retrospektif Sprint & Perbaikan Tim

**Periode Sprint:** Sprint 14 (Pekan 1 - 2)  
**Fasilitator:** [Nama Anda]  

## 1. Hal Positif yang Harus Diteruskan (What Went Well)
- Kolaborasi desainer dan developer sangat mulus berkat Figma Auto-Layout.
- Waktu loading halaman berhasil ditekan hingga 1.1 detik.
- Komunikasi klien responsif dan tepat waktu.

## 2. Hal yang Kurang Memuaskan (What Didn't Go Well)
- Perubahan brief mendadak di pertengahan sprint membuat 2 task tertunda.
- Estimasi waktu pembuatan animasi interaktif terlalu optimis.

## 3. Ide Eksplorasi Baru (What Can We Try)
- Buat aturan bahwa revisi besar di tengah sprint wajib melalui form Change Request.
- Sediakan waktu buffer 1 hari khusus untuk perbaikan bug dan polish visual.

## 4. Komitmen Tindakan Nyata (Action Items)
- [ ] Update template kontrak dengan klausul penguncian brief tengah sprint (PIC: Admin)
- [ ] Standarisasi durasi animasi di design system (PIC: Lead Designer)

> Catatan: Retrospektif adalah ruang aman untuk belajar dan berkembang bersama tanpa saling menyalahkan.`,
    prompt: 'Buatkan lembar catatan retrospektif sprint agile tim kerja.'
  },
  {
    id: 'website_launch_checklist',
    label: 'Checklist Rilis & Go-Live Web',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Go-Live', 'Website', 'Peluncuran'],
    color: 'rose',
    title: 'Checklist Rilis & Peluncuran Website (Go-Live)',
    content: `# Checklist Rilis & Peluncuran Website (Go-Live)

## 1. Domain, SSL & Server
- [ ] Sertifikat SSL HTTPS aktif tanpa peringatan keamanan (Mixed Content)
- [ ] Custom domain terhubung dan DNS terpropagasi secara global
- [ ] Pengalihan otomatis HTTP -> HTTPS dan non-WWW -> WWW berfungsi

## 2. Konten, SEO & Meta Tags
- [ ] Tidak ada teks dummy *Lorem Ipsum* atau gambar placeholder yang tertinggal
- [ ] Favicon (16x16, 32x32, Apple Touch Icon) muncul dengan benar di tab browser
- [ ] Meta Title, Description, dan OpenGraph Image teruji saat link dibagikan di WA/Medsos
- [ ] File Sitemap XML (/sitemap.xml) dan Robots.txt (/robots.txt) valid

## 3. Fungsionalitas & Form
- [ ] Seluruh formulir kontak berhasil mengirimkan email notifikasi
- [ ] Halaman Custom 404 (Halaman Tidak Ditemukan) tampil menarik dan memiliki tombol kembali
- [ ] Pemasangan Google Analytics 4 dan Meta Pixel terverifikasi aktif

## 4. Performa & Responsivitas
- [ ] Skor Google PageSpeed minimal 90 di desktop
- [ ] Seluruh menu navigasi dapat diklik lancar di smartphone

> Catatan: Lakukan peluncuran pada hari kerja pagi (bukan Jumat malam) agar tim siap jika ada kendala darurat.`,
    prompt: 'Buatkan checklist lengkap peluncuran website go-live.'
  },
  {
    id: 'pomodoro_time_blocking',
    label: 'Manajemen Waktu Pomodoro',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Pomodoro', 'Time Blocking', 'Fokus'],
    color: 'emerald',
    title: 'Log Fokus Pomodoro & Time Blocking Harian',
    content: `# Log Fokus Pomodoro & Time Blocking Harian

**Aturan Pomodoro:** 25 Menit Fokus Penuh (Tanpa Notifikasi) + 5 Menit Istirahat Singkat  
*Setelah 4 sesi pomodoro, ambil istirahat panjang 15-20 menit.*

## Blok Waktu Hari Ini

### Blok Pagi (Fokus Tinggi - Deep Work)
- [x] **Sesi 1 (08.30 - 08.55):** Eksplorasi sketsa konsep logo klien utama
- [x] **Sesi 2 (09.00 - 09.25):** Vektorisasi konsep 1 di software vektor
- [ ] **Sesi 3 (09.30 - 09.55):** Vektorisasi konsep 2 dan pewarnaan
- [ ] **Sesi 4 (10.00 - 10.25):** Penyusunan mockup visual kemasan

### Blok Siang (Komunikasi & Koordinasi)
- [ ] **Sesi 5 (13.30 - 13.55):** Balas email klien dan kirimkan proposal
- [ ] **Sesi 6 (14.00 - 14.25):** Rapat koordinasi tim mingguan

### Blok Sore (Finishing & Polish)
- [ ] **Sesi 7 (15.30 - 15.55):** Pre-flight check file cetak
- [ ] **Sesi 8 (16.00 - 16.25):** Rapikan folder arsip & catat rencana esok hari

> Catatan: Jauhkan smartphone dari meja kerja saat sesi fokus 25 menit sedang berjalan.`,
    prompt: 'Buatkan lembar kerja manajemen waktu pomodoro dan time blocking harian.'
  },
  {
    id: 'risk_contingency_plan',
    label: 'Mitigasi Risiko Proyek',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Risiko', 'Mitigasi', 'Kontinjensi'],
    color: 'amber',
    title: 'Rencana Mitigasi Risiko & Kontinjensi Proyek',
    content: `# Rencana Mitigasi Risiko & Kontinjensi Proyek

## Matriks Analisis Risiko

| Potensi Risiko | Dampak | Probabilitas | Rencana Pencegahan (Mitigasi) | Rencana Darurat (Kontinjensi) |
|---|---|---|---|---|
| Klien terlambat memberi feedback | Tinggi | Sedang | Tetapkan batas waktu feedback 2 hari kerja di kontrak | Otomatis geser deadline peluncuran sesuai jumlah hari keterlambatan |
| Anggota tim desainer jatuh sakit | Sedang | Rendah | Dokumentasikan file di cloud Figma yang bisa diakses bersama | Alihkan sisa pengerjaan ke desainer cadangan internal |
| Server hosting mengalami down | Tinggi | Rendah | Gunakan provider ternama dengan uptime SLA 99.9% | Siapkan backup static failover di Vercel / Netlify |
| File aset master korup / hilang | Kritis | Rendah | Otomasi backup harian ke Google Drive dan Hard Disk | Pulihkan data dari versi backup 24 jam terakhir |

> Catatan: Mengantisipasi risiko sejak awal menyelamatkan reputasi dan kelancaran bisnis Anda.`,
    prompt: 'Buatkan lembar rencana mitigasi risiko dan rencana kontinjensi proyek.'
  },
  {
    id: 'presentation_prep_checklist',
    label: 'Checklist Persiapan Presentasi',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Presentasi', 'Pitching', 'Checklist'],
    color: 'sky',
    title: 'Checklist Persiapan Presentasi Klien & Pitching',
    content: `# Checklist Persiapan Presentasi Klien & Pitching

## 1. Kesiapan Materi Slide
- [ ] Slide presentasi telah diperiksa bebas typo dan format 16:9 Full HD
- [ ] Seluruh video demo dan link prototipe Figma telah diuji coba berfungsi lancar
- [ ] Siapkan file salinan PDF lokal jika koneksi internet mendadak lambat

## 2. Kesiapan Teknis & Perangkat
- [ ] Mikrofon eksternal dan webcam teruji jernih
- [ ] Koneksi internet stabil (siapkan tethering HP sebagai cadangan)
- [ ] Bersihkan desktop laptop dan tutup seluruh tab browser pribadi yang tidak relevan
- [ ] Matikan seluruh notifikasi WhatsApp / Email (Mode Do Not Disturb)

## 3. Kesiapan Mental & Waktu
- [ ] Masuk ke ruang meeting virtual 5 menit sebelum jadwal
- [ ] Siapkan segelas air minum di meja kerja
- [ ] Latihan perkenalan dan kalimat pembuka yang percaya diri

> Catatan: Tampil percaya diri dan dengarkan masukan klien dengan penuh perhatian.`,
    prompt: 'Buatkan checklist persiapan presentasi online ke hadapan klien.'
  },
  {
    id: 'delegation_monitoring_log',
    label: 'Log Delegasi & Monitoring Tugas',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Delegasi', 'Monitoring', 'Manajemen Tim'],
    color: 'default',
    title: 'Log Delegasi Tugas & Pemantauan Tim Kerja',
    content: `# Log Delegasi Tugas & Pemantauan Tim Kerja

## Daftar Tugas yang Didelegasikan

| Nama Tugas | Penerima Tugas (PIC) | Target Output | Batas Waktu | Status |
|---|---|---|---|---|
| Slicing komponen header & footer | Budi (Frontend) | Komponen React responsif | Rabu, 15.00 | Selesai |
| Pembuatan 6 variasi icon produk | Siti (Ilustrator) | File SVG 24px clean | Kamis, 12.00 | Dalam Proses |
| Penulisan copywriting hero section | Rian (Copywriter) | 3 Opsi headline AIDA | Selasa, 17.00 | Selesai |
| Touch-up foto produk 15 item | Dina (Editor) | File WebP 300 DPI | Jumat, 10.00 | Belum Mulai |

## Prinsip Delegasi Efektif
1. Jelaskan *hasil akhir* yang diharapkan secara spesifik, bukan mendikte setiap langkah kecil.
2. Berikan seluruh aset pendukung di awal pengerjaan.
3. Tetapkan jadwal pengecekan berkala (Check-in Point).

> Catatan: Delegasi yang baik melatih kemandirian tim dan melipatgandakan produktivitas studio.`,
    prompt: 'Buatkan tabel log delegasi tugas dan pemantauan kinerja tim.'
  },
  {
    id: 'file_backup_routine_sop',
    label: 'SOP Rutinitas Backup Data',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Backup', 'SOP', 'Data Security'],
    color: 'emerald',
    title: 'Standar Operasional Prosedur (SOP) Backup Rutin Data',
    content: `# Standar Operasional Prosedur (SOP) Backup Rutin Data

## 1. Aturan Backup 3-2-1
- Simpan minimal **3 salinan data**.
- Pada **2 media penyimpanan yang berbeda** (Lokal SSD & Cloud Storage).
- Dengan **1 salinan berada di lokasi terpisah (Off-site Cloud)**.

## 2. Jadwal Rutinitas Backup
- **Harian (Pukul 18.00):** Sinkronisasi otomatis folder kerja aktif ke Google Drive / OneDrive.
- **Mingguan (Jumat Sore):** Ekspor file database portofolio dan CMS ke format JSON cadangan.
- **Bulanan (Akhir Bulan):** Kloning seluruh arsip proyek ke Hard Disk Eksternal terpisah.

## 3. Checklist Uji Pemulihan (Restore Test)
- [ ] File backup dapat diekstrak dan dibuka tanpa error korup
- [ ] Database dapat diimpor ulang dengan data yang utuh

> Catatan: Backup yang belum pernah diuji pemulihannya sama saja dengan tidak memiliki backup.`,
    prompt: 'Buatkan dokumen SOP rutinitas backup data cadangan proyek.'
  },
  {
    id: 'monthly_performance_review',
    label: 'Review Kinerja & Evaluasi Bulanan',
    category: 'tasks',
    folder: 'tasks',
    tags: ['Evaluasi', 'Kinerja', 'Review Bulanan'],
    color: 'purple',
    title: 'Lembar Evaluasi Kinerja & Pencapaian Bulanan',
    content: `# Lembar Evaluasi Kinerja & Pencapaian Bulanan

**Bulan / Tahun:** [Bulan, Tahun]  

## 1. Metrik Kinerja Kunci
- Total Proyek Selesai: [Jumlah] Proyek
- Tingkat Kepuasan Klien (CSAT): 4.9 / 5.0 ⭐
- Total Omzet Pendapatan: Rp [Jumlah Pendapatan]
- Rata-rata Durasi Pengerjaan: 11 Hari per Proyek (Target: 14 Hari)

## 2. Pencapaian Utama Bulan Ini
- [x] Berhasil mendapatkan 2 klien korporat baru paket retainer tahunan
- [x] Menerapkan sistem template offline yang mempercepat alur kerja 5x lipat
- [x] Merilis website portofolio versi terbaru

## 3. Hambatan yang Terjadi & Solusi
- *Waktu revisi sempat memakan waktu lama karena brief awal kurang terperinci; solusinya kuesioner onboarding telah diperbarui.*

## 4. Target Fokus Bulan Depan
1. Menaikkan kapasitas pengerjaan menjadi 5 proyek paralel
2. Membuat 4 video studi kasus pendek di media sosial
3. Mengikuti pelatihan sertifikasi design sprint

> Catatan: Evaluasi bulanan yang konsisten memastikan arah bisnis selalu berada di jalur pertumbuhan.`,
    prompt: 'Buatkan lembar kerja evaluasi kinerja dan review pencapaian bulanan.'
  },

  // ── PEMASARAN, COPYWRITING & KONTEN (10 Templates) ──
  {
    id: 'kalender_editorial_30hari',
    label: 'Kalender Konten 30 Hari',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Konten', 'Kalender', 'Marketing'],
    color: 'purple',
    title: 'Kalender Konten & Editorial Media Sosial 30 Hari',
    content: `# Kalender Konten & Editorial Media Sosial 30 Hari

## 1. Pilar Konten Utama
- **Edukasi (40%):** Tips desain, tutorial praktis, cara memilih desainer.
- **Portofolio & Studi Kasus (30%):** Hasil karya sebelum/sesudah, proses riset.
- **Kredibilitas & Testimoni (20%):** Ulasan klien, pencapaian proyek.
- **Promosi Langsung (10%):** Penawaran slot proyek baru, diskon terbatas.

## 2. Jadwal Publikasi Mingguan

### Pekan 1: Fondasi & Tips Edukasi
- [ ] **Senin (Carousel):** 5 Kesalahan Fatal Saat Membuat Logo Bisnis
- [ ] **Rabu (Reels/Shorts):** Proses di Balik Layar Pembuatan Desain Kemasan
- [ ] **Jumat (Single Image):** Portofolio Showcase Klien Kafe Kopi Modern

### Pekan 2: Studi Kasus & Proses Kreatif
- [ ] **Senin (Carousel):** Transformasi Rebranding: Sebelum vs Sesudah
- [ ] **Rabu (Story Interaktif):** Kuis Tebak Font & Polling Preferensi Warna
- [ ] **Jumat (Quote/Insight):** Mengapa Desain Bagus Meningkatkan Penjualan

### Pekan 3: Social Proof & Testimoni
- [ ] **Senin (Carousel):** Cara Kami Membantu Klien Meningkatkan Konversi 200%
- [ ] **Rabu (Reels):** Unboxing Hasil Cetak Packaging Produk Klien
- [ ] **Jumat (Testimoni):** Cerita Kepuasan Klien dan Hasil Nyata

### Pekan 4: Promosi & Penawaran Slot
- [ ] **Senin (Carousel):** Checklist Lengkap Sebelum Membuka Toko Online
- [ ] **Rabu (Infografis):** Roadmap Pengerjaan Proyek Desain 14 Hari
- [ ] **Jumat (Promosi):** Pembukaan 3 Slot Proyek Baru Bulan Depan

> Catatan: Siapkan seluruh aset grafis dan copywriting satu pekan sebelum jadwal posting.`,
    prompt: 'Buatkan kalender editorial konten media sosial 30 hari terstruktur.'
  },
  {
    id: 'copywriting_aida_formula',
    label: 'Copywriting Formula AIDA',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Copywriting', 'AIDA', 'Promosi'],
    color: 'amber',
    title: 'Draf Copywriting Penawaran (Formula AIDA)',
    content: `# Draf Copywriting Penawaran (Formula AIDA)

## 1. Attention (Menarik Perhatian)
*Headline Pembuka yang Kuat:*
"Apakah Tampilan Brand Anda Masih Terlihat Amatir dan Kalah Bersaing dari Kompetitor?"

## 2. Interest (Membangkitkan Minat)
*Fakta & Masalah yang Dihadapi Audiens:*
"94% pelanggan pertama kali menilai kredibilitas suatu bisnis hanya dari tampilan visual dan desain websitenya dalam 5 detik pertama. Jika visual bisnis Anda berantakan, Anda sedang membuang calon pelanggan setia setiap harinya."

## 3. Desire (Menciptakan Keinginan & Solusi)
*Manfaat Nyata & Nilai Tambah yang Ditawarkan:*
"Dengan Paket Brand Identity & Website Premium dari kami, bisnis Anda akan mendapatkan:
- Identitas visual yang mewah, berkarakter, dan memikat mata
- Desain website responsif berkecepatan tinggi yang siap menghasilkan penjualan
- Panduan brand lengkap agar tampilan promosi Anda selalu konsisten selamanya"

## 4. Action (Panggilan Bertindak / CTA)
*Langkah Mudah yang Harus Dilakukan:*
"Konsultasikan kebutuhan brand Anda sekarang secara GRATIS. Kami hanya membuka 3 slot proyek baru untuk bulan ini guna menjaga standar kualitas tertinggi.
👉 Klik tombol di bawah untuk terhubung langsung via WhatsApp."

> Catatan: Gunakan teks ini untuk landing page, caption iklan berbayar, atau penawaran email.`,
    prompt: 'Buatkan draf copywriting penawaran jasa formula AIDA yang persuasif.'
  },
  {
    id: 'copywriting_pas_formula',
    label: 'Copywriting Formula PAS',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Copywriting', 'PAS', 'Iklan'],
    color: 'rose',
    title: 'Draf Copywriting Iklan (Formula Problem-Agitate-Solution)',
    content: `# Draf Copywriting Iklan (Formula Problem-Agitate-Solution)

## 1. Problem (Identifikasi Masalah Nyata)
"Sudah keluar banyak uang untuk pasang iklan, tapi penjualan toko online Anda masih sepi pembeli?"

## 2. Agitate (Perjelas Dampak Kerugiannya)
"Bayangkan berapa banyak anggaran iklan yang terbuang sia-sia setiap hari hanya karena pengunjung langsung kabur saat melihat halaman produk yang lambat, berantakan, dan membingungkan di layar HP. Setiap detik website Anda lemot, kompetitor sedang merebut pelanggan Anda."

## 3. Solution (Solusi Pasti & Tawaran Menarik)
"Kami hadir untuk mendesain ulang toko online Anda menjadi mesin penjualan otomatis berkecepatan tinggi:
- Loading instan di bawah 2 detik
- Alur checkout 1-klik yang mudah untuk pembeli awam
- Terintegrasi otomatis dengan WhatsApp dan notifikasi pesanan

🚀 **Klaim Audit Website Gratis Anda Sekarang Sebelum Slot Minggu Ini Penuh!**"

> Catatan: Formula PAS sangat efektif untuk iklan berbayar berorientasi solusi masalah.`,
    prompt: 'Buatkan draf copywriting iklan formula Problem Agitate Solution.'
  },
  {
    id: 'video_script_reels_shorts',
    label: 'Skrip Video Reels & TikTok',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Video Script', 'Reels', 'TikTok'],
    color: 'sky',
    title: 'Naskah Skrip Video Edukasi Pendek (30-45 Detik)',
    content: `# Naskah Skrip Video Edukasi Pendek (30-45 Detik)

## 1. Hook Visual & Teks (00.00 - 00.03)
- **Visual:** Tangan menunjuk ke layar dengan ekspresi kaget.
- **Teks di Layar:** "Jangan Bikin Logo Sebelum Tahu 3 Hal Ini!"
- **Voiceover:** "Tunggu! Jangan pernah bayar desainer logo sebelum kamu cek 3 hal krusial ini."

## 2. Isi Edukasi (00.04 - 00.25)
- **Poin 1 (00.04 - 00.10):** "Pertama, pastikan logomu berupa file vektor, bukan sekadar gambar JPEG yang pecah saat dicetak besar."
- **Poin 2 (00.11 - 00.18):** "Kedua, uji logo dalam warna hitam-putih. Kalau di warna hitam-putih bentuknya gak jelas, berarti logomu terlalu rumit."
- **Poin 3 (00.19 - 00.25):** "Ketiga, minta buku panduan warna resmi CMYK dan RGB biar warna brandingmu konsisten selamanya."

## 3. Call-to-Action / Penutup (00.26 - 00.30)
- **Visual:** Teks animasi Call-to-Action.
- **Voiceover:** "Simpan video ini biar gak lupa, dan follow akun ini untuk tips branding bisnis lainnya!"

> Catatan: Gunakan teks caption otomatis besar di tengah layar agar penonton tanpa audio tetap paham.`,
    prompt: 'Buatkan naskah skrip video pendek edukasi reels dan tiktok berdurasi 30 detik.'
  },
  {
    id: 'newsletter_email_draft',
    label: 'Skrip Email Newsletter Mingguan',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Newsletter', 'Email', 'Edukasi'],
    color: 'purple',
    title: 'Draf Email Newsletter Edukasi Mingguan',
    content: `# Draf Email Newsletter Edukasi Mingguan

**Subjek:** Mengapa desain minimalis justru menghasilkan penjualan lebih banyak?

Halo [Nama Depan],

Pernahkah Anda bertanya-tanya mengapa brand raksasa seperti Apple, Nike, dan Tokopedia selalu menyederhanakan logo dan tampilan produk mereka dari tahun ke tahun?

Jawabannya adalah: **Beban Kognitif (Cognitive Load)**.

Ketika calon pelanggan melihat desain yang penuh dengan 10 warna berbeda, teks yang padat, dan tombol yang berhamburan, otak mereka secara otomatis merasa lelah dan memilih untuk keluar dari website Anda.

Sebaliknya, desain yang bersih dan minimalis:
1. Menuntun mata pelanggan langsung ke produk unggulan Anda.
2. Menciptakan persepsi bahwa bisnis Anda mewah, rapi, dan profesional.
3. Mempercepat keputusan pembelian tanpa rasa ragu.

### Langkah Praktis Minggu Ini:
Coba periksa kembali halaman penawaran Anda: Apakah ada elemen yang tidak perlu dan bisa dihapus?

Salam sukses,  
**[Nama Anda]**`,
    prompt: 'Buatkan draf email newsletter edukasi mingguan yang bernilai tinggi bagi pembaca.'
  },
  {
    id: 'swot_competitor_analysis',
    label: 'Analisis SWOT Kompetitor Bisnis',
    category: 'marketing',
    folder: 'ideas',
    tags: ['SWOT', 'Analisis Pasar', 'Kompetitor'],
    color: 'emerald',
    title: 'Matriks Analisis SWOT Posisi Pasar Bisnis',
    content: `# Matriks Analisis SWOT Posisi Pasar Bisnis

## 1. Strengths (Kekuatan Internal Kita)
- Portofolio desain modern dengan estetika premium kelas dunia.
- Sistem kerja terotomasi yang membuat pengerjaan 2x lebih cepat dari agensi konvensional.
- Layanan purna-jual dan komunikasi yang sangat responsif.

## 2. Weaknesses (Kelemahan Internal Kita)
- Tim produksi masih skala studio kecil sehingga kuota proyek per bulan terbatas.
- Belum memiliki anggaran iklan berbayar sebesar kompetitor korporat.

## 3. Opportunities (Peluang Pasar Luar)
- Banyak UMKM yang mulai sadar pentingnya digitalisasi dan butuh rebranding visual.
- Meningkatnya tren ekosistem e-commerce lokal yang membutuhkan kemasan profesional.

## 4. Threats (Ancaman Eksternal)
- Menjamurnya template instan murah tanpa riset kustom di pasar lepas.
- Perubahan algoritma platform media sosial yang sering menurunkan jangkauan organik.

## Strategi Eksekusi:
*Manfaatkan kekuatan kecepatan dan sentuhan personal untuk menggaet klien premium yang kecewa dengan template murah.*`,
    prompt: 'Buatkan lembar analisis SWOT posisi pasar bisnis dan pemetaan keunggulan.'
  },
  {
    id: 'meta_ads_copy_pack',
    label: 'Paket Copywriting Iklan Meta Ads',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Meta Ads', 'Copywriting', 'Iklan'],
    color: 'amber',
    title: 'Paket 3 Variasi Copywriting Iklan Meta Ads (Instagram & FB)',
    content: `# Paket 3 Variasi Copywriting Iklan Meta Ads (Instagram & FB)

## Variasi 1: Pendekatan Studi Kasus (Social Proof)
- **Primary Text:** "Dari sepi pembeli menjadi omzet ratusan juta! Lihat bagaimana kami mentransformasi identitas visual dan website [Nama Klien] hanya dalam 3 pekan. Desain yang tepat bukan sekadar cantik, tapi terbukti melipatgandakan omzet bisnis Anda."
- **Headline:** Rahasia Transformasi Brand Sukses 🚀
- **CTA Button:** Pelajari Selengkapnya

---

## Variasi 2: Pendekatan Tanya-Jawab Masalah (Pain-Point)
- **Primary Text:** "Masih pakai logo hasil download gratisan yang pasaran? Hati-hati, pelanggan menilai kredibilitas bisnis Anda dari visual pertama. Dapatkan paket identitas visual eksklusif siap pakai dari desainer profesional."
- **Headline:** Konsultasi Desain Brand Gratis Hari Ini
- **CTA Button:** Hubungi Kami

---

## Variasi 3: Penawaran Terbatas (Urgency)
- **Primary Text:** "Khusus bulan ini! Dapatkan bonus Brand Guidelines senilai Rp 1.5 Juta untuk setiap pemesanan Paket Website Company Profile. Slot terbatas hanya untuk 3 klien pertama."
- **Headline:** Ambil Bonus Eksklusif Anda Sekarang!
- **CTA Button:** Dapatkan Penawaran`,
    prompt: 'Buatkan 3 variasi teks copywriting iklan berbayar Meta Ads berkinerja tinggi.'
  },
  {
    id: 'cold_outreach_email_script',
    label: 'Skrip Email Outreach ke Calon Klien',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Cold Outreach', 'Email', 'Lead Gen'],
    color: 'sky',
    title: 'Skrip Cold Email Outreach yang Bernilai Tinggi & Ramah',
    content: `# Skrip Cold Email Outreach yang Bernilai Tinggi & Ramah

**Subjek:** Ide perbaikan visual untuk [Nama Brand Klien]

**Yth. Bapak/Ibu [Nama Pimpinan Klien],**

Saya mengikuti perkembangan produk [Nama Produk Klien] dan sangat mengagumi inovasi yang Anda hadirkan di industri [Nama Industri].

Saat melihat website Anda di smartphone, saya melihat peluang emas untuk meningkatkan konversi checkout Anda. Saya sempat membuat **mockup visual 1 halaman contoh redesain gratis** yang menunjukkan bagaimana alur pemesanan bisa disederhanakan dari 4 klik menjadi 1 klik saja.

Saya lampirkan link preview singkatnya di sini: [Link Preview Figma]

Apakah Anda memiliki waktu 5 menit minggu ini untuk saya jelaskan idenya tanpa komitmen apapun?

Salam sukses,  
**[Nama Anda]**  
*Desainer & Konsultan UI/UX*`,
    prompt: 'Buatkan skrip cold email outreach penawaran jasa yang ramah dan memberi nilai gratis di awal.'
  },
  {
    id: 'press_release_launch_draft',
    label: 'Draf Siaran Pers Peluncuran Produk',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Press Release', 'Media', 'Publikasi'],
    color: 'default',
    title: 'Draf Siaran Pers Resmi Peluncuran Inovasi Baru',
    content: `# Draf Siaran Pers Resmi Peluncuran Inovasi Baru

**UNTUK DISIARKAN SEGERA**  
**Kontak Media:** [Nama Anda], [Email], [Nomor Telepon]  

### [Nama Perusahaan] Resmi Luncurkan [Nama Produk]: Solusi Cerdas Transformasi Bisnis Digital

**[KOTA], [TANGGAL]** — Hari ini, [Nama Perusahaan], penyedia solusi kreatif digital terdepan di Indonesia, secara resmi mengumumkan peluncuran [Nama Produk], sebuah platform revolusioner yang dirancang untuk membantu para pelaku usaha mempercepat pertumbuhan brand mereka secara terukur.

Di tengah ketatnya persaingan pasar modern, [Nama Produk] hadir menjawab kebutuhan para pengusaha akan sistem identitas visual dan website berkecepatan tinggi yang dapat diakses secara instan bahkan tanpa ketergantungan koneksi internet.

*"Visi utama kami adalah memberdayakan bisnis lokal dengan standar desain dan teknologi kelas dunia yang praktis dan terjangkau,"* ujar [Nama Founder], Founder & Managing Director [Nama Perusahaan].

Inovasi ini dilengkapi dengan fitur unggulan seperti template pengerjaan instan, perlindungan data terdesentralisasi, dan optimasi konversi penjualan terpadu.

Layanan ini sudah dapat diakses publik mulai hari ini melalui situs resmi di [URL Website].

### Tentang [Nama Perusahaan]:
[Tuliskan 1 paragraf profil singkat perusahaan, visi, dan pencapaian utama].

**###**`,
    prompt: 'Buatkan draf siaran pers resmi press release standar jurnalistik AP Style.'
  },
  {
    id: 'hashtag_keyword_seo_bank',
    label: 'Bank Kata Kunci & Hashtag SEO',
    category: 'marketing',
    folder: 'ideas',
    tags: ['Hashtag', 'Keywords', 'SEO'],
    color: 'purple',
    title: 'Bank Kata Kunci SEO & Kumpulan Hashtag Medsos',
    content: `# Bank Kata Kunci SEO & Kumpulan Hashtag Medsos

## 1. Kata Kunci Utama SEO Website (High-Intent Keywords)
- Jasa Desain Logo Profesional
- Jasa Pembuatan Website Company Profile
- Desain Kemasan Produk Packaging UMKM
- Jasa Redesain UI UX Aplikasi Mobile
- Konsultan Branding Bisnis Indonesia

## 2. Kumpulan Hashtag Instagram & TikTok
### Kategori 1: Desain & Branding (Jangkauan Luas)
\`#desainlogo #jasadesain #brandingidentitas #jasadesainlogo #desainkemasan #logodesigner #graphicdesignindonesia\`

### Kategori 2: Bisnis & UMKM (Target Pelanggan)
\`#bisnisonline #pengusahamuda #umkmindonesia #tipsbisnis #strategimarketing #suksesbisnis #brandingbisnis\`

### Kategori 3: UI/UX & Website (Teknologi)
\`#webdesign #uiuxindonesia #websitedeveloper #jasapembuatanwebsite #landingpage #figmadesign\`

> Catatan: Gunakan 5-8 hashtag yang paling relevan per postingan agar tidak dianggap spam oleh algoritma.`,
    prompt: 'Buatkan bank kata kunci SEO dan riset hashtag media sosial yang terarah.'
  },

  // ── PERSONAL, KEUANGAN & PENGEMBANGAN DIRI (10 Templates) ──
  {
    id: 'jurnal_ide_kreatif',
    label: 'Jurnal Ide & Refleksi Harian',
    category: 'personal',
    folder: 'ideas',
    tags: ['Jurnal', 'Ide', 'Refleksi'],
    color: 'default',
    title: 'Jurnal Ide Spontan & Refleksi Harian',
    content: `# Jurnal Ide Spontan & Refleksi Harian

## 1. Tangkapan Ide Spontan (Brain Dump)
Tuliskan seluruh ide liar, konsep visual, atau inspirasi yang terlintas hari ini:
- Ide membuat mini-course tentang tips slicing UI Figma ke kode CSS modern.
- Eksplorasi layout landing page dengan gaya bento-grid dan efek glassmorphism tipis.

## 2. Pencapaian & Hal yang Berjalan Baik Hari Ini
- [x] Menyelesaikan revisi tepat waktu sebelum jam makan siang
- [x] Klien memberikan feedback positif atas konsep logo yang diajukan
- [x] Waktu istirahat dan olahraga teratur tercapai

## 3. Evaluasi & Pembelajaran
- Apa yang bisa dilakukan lebih cepat dan efisien besok?
  * Buat template komponen umum agar tidak perlu mendesain dari nol setiap proyek baru.

## 4. Rencana Eksplorasi Besok
- [ ] Coba plugin Figma baru untuk optimasi export WebP
- [ ] Tulis 1 artikel pendek tentang dasar-dasar pemilihan warna untuk desainer pemula

> Catatan: Jurnal yang konsisten melatih ketajaman intuisi kreatif dan mencegah burnout kerja.`,
    prompt: 'Buatkan lembar jurnal refleksi dan tangkapan ide kreatif harian.'
  },
  {
    id: 'rencana_belajar_skill',
    label: 'Roadmap Belajar Skill Baru 30 Hari',
    category: 'personal',
    folder: 'general',
    tags: ['Belajar', 'Skill', 'Pengembangan'],
    color: 'sky',
    title: 'Roadmap Belajar & Upgrade Skill Baru 30 Hari',
    content: `# Roadmap Belajar & Upgrade Skill Baru 30 Hari

## 1. Target Kemampuan yang Ingin Dikuasai
- **Skill Utama:** Pembuatan 3D Illustration & Motion Design (Blender / Spline)
- **Target Waktu:** 4 Pekan (1 Bulan)
- **Output Nyata:** 3 Aset 3D interaktif siap pajang di portofolio pribadi

## 2. Rencana Kurikulum Mingguan

### Pekan 1: Dasar Navigasi & Modeling Sederhana
- [ ] Memahami antarmuka dasar dan shortcut penting
- [ ] Latihan membuat objek geometris dasar (meja, botol, ikon produk)
- [ ] Pengenalan modifier subdivision surface dan bevel

### Pekan 2: Material, Tekstur & Pencahayaan (Lighting)
- [ ] Eksplorasi material kaca, logam, dan plastik matte
- [ ] Pengaturan 3-point lighting setup untuk presentasi produk
- [ ] Eksperimen rendering Cycles dan Eevee

### Pekan 3: Animasi & Motion Sederhana
- [ ] Pengaturan keyframe rotasi dan bouncing effect
- [ ] Animasi hover interaktif untuk aset web
- [ ] Export format glTF / Spline embed code

### Pekan 4: Proyek Portofolio Akhir
- [ ] Merancang 1 set ikon 3D bertema teknologi & bisnis
- [ ] Mengintegrasikan aset 3D ke dalam website portofolio
- [ ] Dokumentasikan proses pembuatan untuk studi kasus

> Catatan: Luangkan waktu 45 menit setiap hari untuk latihan konsisten.`,
    prompt: 'Buatkan roadmap rencana belajar skill baru secara terstruktur selama 1 bulan.'
  },
  {
    id: 'project_cashflow_planner',
    label: 'Perencana Arus Kas Proyek',
    category: 'personal',
    folder: 'general',
    tags: ['Keuangan', 'Cashflow', 'Budget'],
    color: 'emerald',
    title: 'Perencana Arus Kas & Anggaran Operasional Bulanan',
    content: `# Perencana Arus Kas & Anggaran Operasional Bulanan

## 1. Proyeksi Pemasukan (Inflow)
| Sumber Pendapatan | Keterangan | Target Nominal | Status |
|---|---|---|---|
| Klien PT Maju Sejahtera | Pelunasan Project Brand Identity | Rp 4.500.000 | Masuk |
| Klien Kafe Kopi | DP 50% Website Company Profile | Rp 3.000.000 | Masuk |
| Retainer Bulanan | Klien Agensi Digital | Rp 5.000.000 | Menunggu |
| **Total Pemasukan:** | | **Rp 12.500.000** | |

## 2. Estimasi Pengeluaran Operasional (Outflow)
| Pos Pengeluaran | Kategori | Anggaran | Status |
|---|---|---|---|
| Langganan Adobe Creative Cloud | Tools Kerja | Rp 750.000 | Terbayar |
| Server Cloud & Hosting Domain | Infrastruktur | Rp 350.000 | Terbayar |
| Internet Fiber Optic Kantor | Utilitas | Rp 450.000 | Terbayar |
| Alokasi Dana Tabungan / Pajak (20%) | Tabungan | Rp 2.500.000 | Terbayar |
| **Total Pengeluaran:** | | **Rp 4.050.000** | |

## 3. Sisa Saldo Bersih (Net Profit): Rp 8.450.000

> Catatan: Pisahkan selalu rekening operasional bisnis dengan rekening pengeluaran pribadi.`,
    prompt: 'Buatkan lembar kerja perencana arus kas dan anggaran keuangan studio kreatif.'
  },
  {
    id: 'travel_itinerary_planner',
    label: 'Rencana Liburan & Itinerary',
    category: 'personal',
    folder: 'general',
    tags: ['Liburan', 'Travel', 'Itinerary'],
    color: 'amber',
    title: 'Rencana Perjalanan & Itinerary Liburan 4 Hari',
    content: `# Rencana Perjalanan & Itinerary Liburan 4 Hari

## 1. Informasi Perjalanan
- **Destinasi:** Yogyakarta & Sekitarnya
- **Tanggal:** [Tanggal Berangkat] s.d. [Tanggal Pulang]
- **Akomodasi:** Hotel / Villa di Area Prawirotaman

## 2. Jadwal Harian (Daily Itinerary)

### Hari 1: Kedatangan & Wisata Kuliner Sore
- [ ] 09.00 - Tiba di Bandara / Stasiun Tugu & Check-in Hotel
- [ ] 13.00 - Makan siang kuliner khas lokal
- [ ] 16.30 - Menikmati senja di Candi Ratu Boko
- [ ] 19.30 - Jalan santai & kuliner malam di Malioboro

### Hari 2: Eksplorasi Alam & Budaya
- [ ] 04.30 - Sunrise tour di Candi Borobudur / Punthuk Setumbu
- [ ] 10.00 - Jeep Tour Merapi Lava Tour
- [ ] 15.00 - Istirahat kopi di kafe lereng Gunung Merapi
- [ ] 19.00 - Makan malam santai di resto tradisional

### Hari 3: Pantai & Spot Foto Estetik
- [ ] 08.00 - Perjalanan ke Pantai Gunungkidul
- [ ] 14.00 - Belanja oleh-oleh kerajinan tangan lokal

### Hari 4: Persiapan Pulang
- [ ] 09.00 - Packing barang & beli bakpia oleh-oleh
- [ ] 12.00 - Check-out hotel & menuju stasiun/bandara

## 3. Checklist Barang Bawaan & Dokumen
- [ ] KTP, Tiket Kereta/Pesawat, Kartu e-Money
- [ ] Kamera, Charger, Powerbank, Kabel data
- [ ] Obat-obatan pribadi dan pakaian ganti

> Catatan: Atur notifikasi email auto-responder "Out of Office" selama masa liburan.`,
    prompt: 'Buatkan lembar rencana perjalanan itinerary liburan 4 hari lengkap dengan checklist.'
  },
  {
    id: 'monthly_goals_evaluation',
    label: 'Target Bulanan & Evaluasi Pribadi',
    category: 'personal',
    folder: 'general',
    tags: ['Goals', 'Target', 'Evaluasi Diri'],
    color: 'purple',
    title: 'Lembar Target Bulanan & Evaluasi Pencapaian Pribadi',
    content: `# Lembar Target Bulanan & Evaluasi Pencapaian Pribadi

**Bulan / Tahun:** [Bulan, Tahun]  

## 1. Target Karir & Finansial
- [x] Mencapai omzet pendapatan minimal Rp 15.000.000
- [x] Menyelesaikan 3 proyek klien tepat waktu dengan rating bintang 5
- [ ] Menulis 2 studi kasus baru di website portofolio pribadi

## 2. Target Kesehatan & Kebugaran
- [ ] Olahraga kardio / jogging 3x seminggu (Total 12 sesi per bulan)
- [x] Minum air putih minimal 2.5 liter per hari
- [ ] Tidur teratur sebelum pukul 23.30 malam

## 3. Target Pembelajaran & Pengembangan Diri
- [x] Membaca tuntas 1 buku tentang negosiasi bisnis dan psikologi desain
- [ ] Mengikuti 1 webinar internasional tentang AI design workflows

## 4. Evaluasi Akhir Bulan
- **Skor Pencapaian Target:** 80% Tercapai
- **Pelajaran Terbesar:** *Memulai tugas berat di pagi hari membuat sisa hari jauh lebih ringan dan bebas stres.*

> Catatan: Fokus pada kemajuan bertahap (progress), bukan kesempurnaan instan.`,
    prompt: 'Buatkan lembar kerja target bulanan dan evaluasi pencapaian pribadi komprehensif.'
  },
  {
    id: 'habit_tracker_routine',
    label: 'Habit Tracker & Rutinitas Produktif',
    category: 'personal',
    folder: 'general',
    tags: ['Habits', 'Rutinitas', 'Disiplin'],
    color: 'emerald',
    title: 'Pelacak Kebiasaan Positif (Habit Tracker) & Rutinitas Harian',
    content: `# Pelacak Kebiasaan Positif (Habit Tracker) & Rutinitas Harian

## 1. Rutinitas Pagi (Morning Routine - 06.00 - 08.00)
- [ ] Minum 1 gelas air putih hangat saat bangun tidur
- [ ] Peregangan tubuh / stretching ringan 10 menit
- [ ] Membaca buku / artikel edukasi 15 menit
- [ ] Menulis 3 prioritas tugas utama hari ini di Sprint To-Do List

## 2. Rutinitas Kerja (Work Routine - 08.30 - 17.00)
- [ ] 2 Sesi Pomodoro Deep Work tanpa interupsi smartphone
- [ ] Istirahat makan siang tepat waktu & istirahatkan mata dari layar
- [ ] Rapikan file kerja & bersihkan desktop komputer sebelum pulang

## 3. Rutinitas Malam (Evening Routine - 21.30 - 23.00)
- [ ] Matikan layar gadget 30 menit sebelum tidur (Digital Detox)
- [ ] Catat 3 hal yang disyukuri hari ini di jurnal refleksi
- [ ] Tidur tepat waktu

> Catatan: Kebiasaan kecil yang konsisten setiap hari menghasilkan lompatan besar dalam 1 tahun.`,
    prompt: 'Buatkan lembar pelacak kebiasaan harian habit tracker dan rutinitas produktif.'
  },
  {
    id: 'book_summary_learning_notes',
    label: 'Ringkasan Buku & Pembelajaran',
    category: 'personal',
    folder: 'ideas',
    tags: ['Buku', 'Ringkasan', 'Pembelajaran'],
    color: 'sky',
    title: 'Catatan Ringkasan Buku & Wawasan Penting (Book Notes)',
    content: `# Catatan Ringkasan Buku & Wawasan Penting (Book Notes)

## Informasi Buku
- **Judul Buku:** *Show Your Work!*
- **Penulis:** Austin Kleon
- **Kategori:** Kreativitas, Personal Branding, Karir

## 3 Ide Utama Buku (Big Ideas)
1. **Anda tidak perlu jadi jenius:** Tunjukkan proses kerja Anda sehari-hari, bukan hanya hasil akhir yang sudah sempurna. Orang lebih terhubung dengan proses perjuangan.
2. **Dokumentasikan, jangan ciptakan dari nol:** Rekam langkah-langkah kerja Anda, sketsa kasar, dan kesalahan yang diperbaiki sebagai materi konten edukasi.
3. **Bagikan hal-hal kecil setiap hari (Daily Dispatch):** Berbagi 1 tips kecil secara konsisten jauh lebih berdampak daripada diam selama berbulan-bulan.

## Kutipan Berkesan (Memorable Quotes)
> "The best way to get started on the path to sharing your work is to think about what you want to learn, and make a commitment to learning it in front of others."

## Rencana Aksi Nyata (Action Items)
- [ ] Buat 1 postingan di balik layar proses desain setiap hari Rabu di media sosial.
- [ ] Tuliskan studi kasus kegagalan awal dan bagaimana kami memperbaikinya.

> Catatan: Membaca buku tanpa rencana aksi nyata hanyalah hiburan intelektual.`,
    prompt: 'Buatkan lembar catatan ringkasan buku penting beserta rencana aksi nyata.'
  },
  {
    id: 'workspace_hardware_wishlist',
    label: 'Wishlist Alat Kerja & Hardware',
    category: 'personal',
    folder: 'general',
    tags: ['Hardware', 'Wishlist', 'Alat Kerja'],
    color: 'amber',
    title: 'Rencana Investasi & Wishlist Alat Kerja Studio',
    content: `# Rencana Investasi & Wishlist Alat Kerja Studio

## Daftar Kebutuhan Peningkatan Alat Kerja

| Nama Alat / Hardware | Kebutuhan & Manfaat | Estimasi Harga | Prioritas | Status |
|---|---|---|---|---|
| Monitor 27" 4K Color Accurate | Akurasi warna sRGB 100% untuk pre-flight cetak | Rp 5.500.000 | Tinggi | Direncanakan Bulan Depan |
| Kursi Ergonomis Mesh | Menjaga postur punggung saat bekerja lama | Rp 2.200.000 | Tinggi | Terbeli |
| Pen Tablet / Display 13" | Mempercepat proses sketsa dan ilustrasi digital | Rp 3.800.000 | Sedang | Menabung |
| Keyboard Mekanikal Silent | Kenyamanan mengetik copywriting seharian | Rp 1.100.000 | Rendah | Wishlist |

## Aturan Keputusan Pembelian:
1. Hanya beli alat kerja yang secara langsung mempercepat alur kerja atau meningkatkan kesehatan tubuh.
2. Hitung Return on Investment (ROI): Apakah alat ini bisa balik modal dalam 3 bulan?

> Catatan: Investasi pada alat kerja yang tepat adalah investasi pada masa depan bisnis Anda.`,
    prompt: 'Buatkan lembar rencana investasi alat kerja dan hardware studio kreatif.'
  },
  {
    id: 'anti_burnout_wellness_guide',
    label: 'Panduan Anti-Burnout & Rehat',
    category: 'personal',
    folder: 'general',
    tags: ['Wellness', 'Kesehatan', 'Anti-Burnout'],
    color: 'rose',
    title: 'Panduan Menjaga Kebugaran Mental & Pencegahan Burnout',
    content: `# Panduan Menjaga Kebugaran Mental & Pencegahan Burnout

## 1. Tanda-Tanda Awal Burnout
- Merasa lelah secara emosional meski sudah tidur cukup.
- Hilangnya antusiasme dan rasa malas berlebih saat membuka software desain.
- Mudah tersinggung saat menerima revisi dari klien.

## 2. Protokol Batasan Kerja Sehat (Work Boundaries)
- **Jam Kerja Tegas:** Matikan seluruh notifikasi pesan klien setelah pukul 18.00 dan di akhir pekan.
- **Istirahat Mata (Aturan 20-20-20):** Setiap 20 menit menatap layar, pandang objek berjarak 6 meter selama 20 detik.
- **Satu Hari Penuh Bebas Layar (Screen-Free Day):** Luangkan hari Minggu untuk kegiatan di alam terbuka tanpa menyentuh komputer.

## 3. Checklist Pemulihan Energi
- [ ] Jalan kaki santai di taman / lingkungan terbuka 20 menit
- [ ] Nikmati secangkir teh/kopi tanpa memegang smartphone
- [ ] Mengobrol santai dengan keluarga atau sahabat tentang topik di luar pekerjaan

> Catatan: Beristirahat bukanlah tanda kelemahan, melainkan bagian penting dari proses profesional jangka panjang.`,
    prompt: 'Buatkan panduan menjaga kesehatan mental dan pencegahan burnout kerja kreatif.'
  },
  {
    id: 'personal_branding_roadmap',
    label: 'Roadmap Personal Branding',
    category: 'personal',
    folder: 'ideas',
    tags: ['Personal Branding', 'Reputasi', 'Karir'],
    color: 'purple',
    title: 'Roadmap Pembangunan Personal Branding Profesional',
    content: `# Roadmap Pembangunan Personal Branding Profesional

## 1. Pernyataan Posisi Diri (Positioning Statement)
*"Saya membantu pelaku bisnis dan UMKM mentransformasi tampilan brand mereka menjadi mewah dan menghasilkan penjualan lebih tinggi melalui identitas visual dan website berkecepatan tinggi."*

## 2. Pilar Reputasi Profesional
- **Keahlian Teknis:** Pembuktian melalui studi kasus portofolio berkualitas tinggi dan tips praktis.
- **Keandalan & Disiplin:** Selalu menyelesaikan proyek sebelum tenggat waktu dan komunikasi yang ramah.
- **Transparansi & Kejujuran:** Memberikan masukan jujur yang berpihak pada kesuksesan bisnis klien.

## 3. Saluran Publikasi Utama
- **Website Pribadi:** Sebagai markas utama portofolio dan penawaran layanan.
- **LinkedIn:** Untuk membangun jejaring dengan para pendiri startup dan direktur perusahaan.
- **Instagram:** Sebagai galeri visual dan video di balik layar proses kreatif.

## 4. Target Capaian 6 Bulan
- [ ] Mempublikasikan 24 postingan edukasi berkualitas di LinkedIn dan Instagram
- [ ] Menjadi pembicara / narasumber di 1 webinar desain komunitas lokal
- [ ] Meraih 5 klien baru murni dari jalur jangkauan organik media sosial

> Catatan: Personal branding yang kuat membuat klien datang mencari Anda, bukan sebaliknya.`,
    prompt: 'Buatkan roadmap rencana pembangunan personal branding profesional jangka panjang.'
  }
];

// ─────────────────────────────────────────────────────────────
// 3. GENERATOR HELPERS (Instant 0ms Offline Creation)
// ─────────────────────────────────────────────────────────────

/**
 * Generate a complete project object locally from offline template
 */
export const buildOfflineProject = (templateId: string, customPrompt?: string) => {
  const tmpl = OFFLINE_PROJECT_TEMPLATES.find(t => t.id === templateId) || OFFLINE_PROJECT_TEMPLATES[0];
  const now = new Date();
  const deadlineDate = new Date(now.getTime() + (tmpl.estimatedDays || 14) * 24 * 60 * 60 * 1000);
  const deadline = deadlineDate.toISOString().split('T')[0];

  const title = customPrompt && customPrompt.trim().length > 3 ? customPrompt.trim().slice(0, 60) : tmpl.title;
  const description = customPrompt && customPrompt.trim().length > 3 
    ? `${customPrompt.trim()}\n\n${tmpl.description}`
    : tmpl.description;

  const isContent = tmpl.type === 'content' || tmpl.category === 'content';

  return {
    id: `proj_${Date.now()}`,
    parentId: null,
    type: isContent ? 'content' : 'project',
    platform: tmpl.platform || (isContent ? 'instagram' : undefined),
    format: tmpl.format || (isContent ? 'reels' : undefined),
    title,
    description,
    status: 'todo' as const,
    priority: tmpl.priority || 'medium',
    category: tmpl.category || 'design',
    createdAt: now.toISOString(),
    deadline,
    scheduledDate: deadline,
    scheduledTime: '19:00',
    progress: 0,
    tasks: (tmpl.tasks || []).map((t, idx) => ({ id: Date.now() + idx, text: t, done: false })),
    notes: tmpl.notes || '',
    caseStudyHtml: tmpl.caseStudyHtml || '',
    tags: tmpl.tags || (isContent ? ['Konten', 'MediaSosial'] : ['Project']),
    icon: tmpl.icon || (isContent ? 'Sparkles' : 'FolderKanban'),
    coverImage: '',
    team: [{ name: 'Saya', role: 'Project Lead', color: '#10b981' }],
    files: [],
    activity: [
      { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: `Dibuat menggunakan template: ${tmpl.label}` }
    ]
  };
};

/**
 * Generate a complete note item locally from offline template
 */
export const buildOfflineNote = (templateId: string, customPrompt?: string) => {
  const tmpl = OFFLINE_NOTE_TEMPLATES.find(t => t.id === templateId) || OFFLINE_NOTE_TEMPLATES[0];
  const now = new Date().toISOString();
  
  let title = tmpl.title;
  let content = tmpl.content;

  if (customPrompt && customPrompt.trim().length > 3) {
    title = customPrompt.trim().slice(0, 50);
    content = `# ${title}\n\n${tmpl.content.replace(/^#\s+[^\n]+\n+/, '')}`;
  }

  return {
    id: `note_${Date.now()}`,
    title,
    content,
    type: 'doc' as const,
    folderId: tmpl.folder || 'general',
    tags: tmpl.tags || ['Template'],
    isPinned: false,
    isFavorite: false,
    isTrash: false,
    color: tmpl.color || 'default',
    createdAt: now,
    updatedAt: now
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// 3. WEBSITE / LANDING PAGE TEMPLATES (30+ High-Converting Presets)
// ══════════════════════════════════════════════════════════════════════════════

export interface OfflineWebsiteTemplate {
  id: string;
  label: string;
  category: 'portfolio' | 'agency' | 'ecommerce' | 'service' | 'creative';
  title: string;
  description: string;
  tags: string[];
  icon: string;
  themeColor: string;
  data: {
    hero: {
      greeting: string;
      headline: string;
      subheadline: string;
      description: string;
      ctaPrimaryLabel: string;
      ctaPrimaryUrl: string;
      ctaSecondaryLabel: string;
      ctaSecondaryUrl: string;
      cards: { id: string; text: string; icon: string }[];
      badge: { active: boolean; smallText: string; largeText: string };
    };
    profile: {
      bio: string;
      fullBio: string;
      skills: { id: string; name: string; description: string; icon: string }[];
    };
    process: { id: string; title: string; description: string; icon: string }[];
    testimonials: { id: string; quote: string; author: string; role: string; avatar: string }[];
    theme: { accentColor: string; defaultMode: 'light' | 'dark' };
    seo: { metaTitle: string; metaDescription: string };
    localization: {
      portfolioSectionTitle: string;
      portfolioMainTitle: string;
      aboutSectionTitle: string;
      aboutMainTitle: string;
      processSectionTitle: string;
      processMainTitle: string;
      testimonialSectionTitle: string;
      testimonialMainTitle: string;
      customProjectSectionTitle: string;
      customProjectMainTitle: string;
      customProjectSubtitle: string;
      customProjectCta: string;
      footerReadyText: string;
      footerStartProject: string;
    };
  };
  prompt?: string;
}

export const OFFLINE_WEBSITE_TEMPLATES: OfflineWebsiteTemplate[] = [
  {
    id: 'graphic_brand_designer',
    label: 'Desainer Grafis & Branding',
    category: 'portfolio',
    icon: 'PenTool',
    themeColor: '#8b5cf6',
    title: 'Portofolio Desainer Grafis & Identitas Visual',
    description: 'Tata letak berfokus pada showcase logo, identitas merek visual, tipografi, dan packaging profesional.',
    tags: ['Branding', 'Logo', 'Grafis', 'Portofolio'],
    data: {
      hero: {
        greeting: "Halo, Saya",
        headline: "Desainer Grafis & Brand Specialist",
        subheadline: "Membangun Identitas Visual yang Memikat & Berkarakter",
        description: "Membantu brand dan UMKM menciptakan identitas visual yang berdaya saing tinggi melalui desain logo, kemasan, dan panduan merek yang komprehensif.",
        ctaPrimaryLabel: "Eksplorasi Karya",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Konsultasi Brand",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "Sertifikasi Brand Designer", icon: "Award" },
          { id: "c2", text: "50+ Proyek Identitas Visual", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "STATUS PROYEK", largeText: "Terbuka untuk Freelance" }
      },
      profile: {
        bio: "Desainer grafis berdedikasi tinggi dengan fokus pada brand identity, kemasan produk, dan visual storytelling yang efektif.",
        fullBio: "Dengan pengalaman lebih dari 4 tahun mendampingi puluhan bisnis bertumbuh, saya percaya bahwa desain bukan sekadar estetika, melainkan strategi bisnis visual yang memperkuat kepercayaan pelanggan.",
        skills: [
          { id: "sk1", name: "Brand Identity Design", description: "Perancangan sistem logo, palet warna, dan guideline komprehensif.", icon: "PenTool" },
          { id: "sk2", name: "Packaging & Kemasan", description: "Desain kemasan produk ramah cetak dan berdaya tarik rak tinggi.", icon: "Layers" },
          { id: "sk3", name: "Adobe Illustrator & Photoshop", description: "Penguasaan software standar industri tingkat lanjut.", icon: "Palette" },
          { id: "sk4", name: "Tipografi & Tata Letak", description: "Komposisi editorial dan layout visual yang harmonis.", icon: "AlignLeft" }
        ]
      },
      process: [
        { id: "p1", title: "Discovery & Brief", description: "Menggali nilai inti merek, target audiens, dan diferensiasi pasar.", icon: "Search" },
        { id: "p2", title: "Moodboard & Sketsa", description: "Eksplorasi arah visual, palet warna, dan puluhan sketsa awal.", icon: "Lightbulb" },
        { id: "p3", title: "Vektorisasi & Prototipe", description: "Mengeksekusi desain dalam bentuk vektor presisi tinggi dan mockup nyata.", icon: "PenTool" },
        { id: "p4", title: "Brand Guidelines & Handoff", description: "Menyerahkan master file lengkap dengan buku pedoman resmi.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Identitas visual baru buatan desainer ini menaikkan persepsi harga produk kami hingga 2 kali lipat!", author: "Hendra Wijaya", role: "Owner, Kopi Senja Roastery", avatar: "" },
        { id: "t2", quote: "Sangat profesional, responsif, dan mengerti esensi brand kami dengan tepat.", author: "Nadia Utami", role: "Brand Lead, Botanica Care", avatar: "" }
      ],
      theme: { accentColor: "#8b5cf6", defaultMode: "light" },
      seo: {
        metaTitle: "Portofolio Desainer Grafis & Brand Identity Profesional",
        metaDescription: "Spesialis desain logo, identitas visual, dan kemasan produk untuk brand yang ingin tampil menonjol."
      },
      localization: {
        portfolioSectionTitle: "— KARYA TERBAIK",
        portfolioMainTitle: "Koleksi Desain & Identitas Brand",
        aboutSectionTitle: "— TENTANG SAYA",
        aboutMainTitle: "Kreativitas Berpadu Strategi Merek",
        processSectionTitle: "— METODOLOGI",
        processMainTitle: "Alur Perancangan Identitas Visual",
        testimonialSectionTitle: "— ULASAN KLIEN",
        testimonialMainTitle: "Apa Kata Klien Kami",
        customProjectSectionTitle: "— DISKUSI BRAND",
        customProjectMainTitle: "Siap Naikkan Nilai Merek Anda?",
        customProjectSubtitle: "Ceritakan visi bisnis Anda dan mari kita wujudkan identitas visual impian.",
        customProjectCta: "Mulai Diskusi Desain",
        footerReadyText: "Tingkatkan daya tarik bisnis Anda hari ini.",
        footerStartProject: "Mulai Proyek Desain"
      }
    },
    prompt: "Buatkan profil website portofolio desainer grafis dan branding yang elegan dan percaya diri."
  },
  {
    id: 'uiux_product_designer',
    label: 'UI/UX & Product Designer',
    category: 'portfolio',
    icon: 'Layout',
    themeColor: '#0ea5e9',
    title: 'Portofolio UI/UX & Digital Product Designer',
    description: 'Dirancang khusus untuk desainer antarmuka web, SaaS, dan aplikasi mobile dengan pendekatan User-Centric.',
    tags: ['UI/UX', 'Figma', 'Mobile App', 'SaaS'],
    data: {
      hero: {
        greeting: "Hello, I'm",
        headline: "UI/UX & Product Designer",
        subheadline: "Crafting Intuitive, High-Converting Digital Experiences",
        description: "Merancang pengalaman digital antarmuka web dan aplikasi mobile yang mulus, estetis, dan terbukti meningkatkan konversi bisnis pengguna.",
        ctaPrimaryLabel: "Lihat Studi Kasus",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Unduh Resume",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "Figma Certified Pro", icon: "Award" },
          { id: "c2", text: "20+ Web & Mobile Apps", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "KETERSEDIAAN", largeText: "Open for Product Roles" }
      },
      profile: {
        bio: "Product Designer dengan keahlian riset pengguna, wireframing, design system modular, dan usability testing.",
        fullBio: "Fokus saya adalah menjembatani kebutuhan pengguna dengan tujuan bisnis melalui antarmuka yang bersih, intuitif, dan mudah diimplementasikan oleh tim developer.",
        skills: [
          { id: "sk1", name: "Figma & Design Systems", description: "Pembuatan sistem desain tokenized dan komponen dinamis.", icon: "Layout" },
          { id: "sk2", name: "User Flow & Wireframing", description: "Perancangan arsitektur informasi dan kerangka alur pengguna.", icon: "Workflow" },
          { id: "sk3", name: "Interactive Prototyping", description: "Prototipe interaktif untuk validasi pengguna dan pitching.", icon: "Sparkles" },
          { id: "sk4", name: "Handoff & Dev Collaboration", description: "Dokumentasi spesifikasi desain yang siap dieksekusi engineer.", icon: "Code" }
        ]
      },
      process: [
        { id: "p1", title: "User Research & Audit", description: "Wawancara pengguna, analisis kompetitor, dan audit alur aplikasi.", icon: "Search" },
        { id: "p2", title: "Wireframe & IA", description: "Penyusunan arsitektur informasi dan wireframe low-fidelity.", icon: "Layout" },
        { id: "p3", title: "UI Design & Prototyping", description: "Perancangan antarmuka high-fidelity dan interaksi animasi.", icon: "Palette" },
        { id: "p4", title: "Usability Test & Handoff", description: "Pengujian ke pengguna nyata dan serah terima aset ke engineer.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Aplikasi kami mengalami kenaikan retensi 40% setelah redesain UI/UX yang dilakukan!", author: "Reza Pratama", role: "CTO, FinTech Nusantara", avatar: "" },
        { id: "t2", quote: "Desain sistemnya luar biasa rapi, memudahkan developer frontend kami mengeksekusi dengan cepat.", author: "Sarah Amira", role: "Lead Engineer, Edutech Hub", avatar: "" }
      ],
      theme: { accentColor: "#0ea5e9", defaultMode: "light" },
      seo: {
        metaTitle: "UI/UX & Product Designer Portfolio — Modern Web & App Design",
        metaDescription: "Portofolio UI/UX Designer spesialis SaaS, Mobile Apps, dan Design System kelas dunia."
      },
      localization: {
        portfolioSectionTitle: "— STUDI KASUS",
        portfolioMainTitle: "Karya Desain Produk & Aplikasi",
        aboutSectionTitle: "— TENTANG SAYA",
        aboutMainTitle: "Mendesain Pengalaman Digital Bermakna",
        processSectionTitle: "— PROSES DESIGN SPRINT",
        processMainTitle: "Dari Masalah Menjadi Solusi Intuitif",
        testimonialSectionTitle: "— TESTIMONIAL",
        testimonialMainTitle: "Dampak Nyata pada Bisnis Klien",
        customProjectSectionTitle: "— HUBUNGI SAYA",
        customProjectMainTitle: "Punya Proyek Produk Digital?",
        customProjectSubtitle: "Mari jadwalkan sesi konsultasi desain gratis untuk mendiskusikan kebutuhan aplikasi Anda.",
        customProjectCta: "Jadwalkan Konsultasi UI/UX",
        footerReadyText: "Siap membangun produk digital kelas dunia?",
        footerStartProject: "Mulai Kolaborasi"
      }
    },
    prompt: "Buatkan website landing page portofolio UI/UX designer modern ala startup teknologi Silicon Valley."
  },
  {
    id: 'creative_agency',
    label: 'Agensi Kreatif & Branding',
    category: 'agency',
    icon: 'Briefcase',
    themeColor: '#ec4899',
    title: 'Website Resmi Agensi Kreatif & Pemasaran Digital',
    description: 'Template korporat modern untuk studio kreatif multi-disiplin yang melayani branding, konten, dan web.',
    tags: ['Agency', 'Studio', 'Digital Marketing', 'Korporat'],
    data: {
      hero: {
        greeting: "Selamat Datang di",
        headline: "Studio Agensi Kreatif Digital",
        subheadline: "Melipatgandakan Pertumbuhan Bisnis Melalui Desain & Strategi",
        description: "Kami adalah tim pemikir kreatif, desainer, dan strategist yang membantu brand modern memenangkan perhatian pasar digital.",
        ctaPrimaryLabel: "Portofolio Agensi",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Pricelist & Layanan",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "150+ Klien Puas", icon: "Award" },
          { id: "c2", text: "Tim Ahli Multi-Disiplin", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "RETAINER PROYEK", largeText: "Menerima Klien Baru" }
      },
      profile: {
        bio: "Agensi kreatif berorientasi hasil yang memadukan keindahan visual dengan strategi pemasaran data-driven.",
        fullBio: "Kami berkolaborasi dengan startup, UMKM, hingga enterprise untuk membangun identitas merek yang kokoh, konten sosial media yang viral, dan website yang menghasilkan penjualan konsisten.",
        skills: [
          { id: "sk1", name: "Brand Strategy & Identity", description: "Perumusan posisi pasar dan perancangan visual merek terpadu.", icon: "Briefcase" },
          { id: "sk2", name: "Social Media Management", description: "Pembuatan konten visual, copywriting, dan kampanye iklan digital.", icon: "Megaphone" },
          { id: "sk3", name: "Web & Landing Page", description: "Pembuatan website company profile dan toko online berkonversi tinggi.", icon: "Globe" },
          { id: "sk4", name: "Video Production & Motion", description: "Iklan video komersial dan animasi motion graphics berkualitas sinematik.", icon: "Video" }
        ]
      },
      process: [
        { id: "p1", title: "Audit & Formulasi Strategi", description: "Menganalisis performa bisnis saat ini dan merancang blueprint kampanye.", icon: "Search" },
        { id: "p2", title: "Creative Ideation", description: "Mengembangkan konsep kreatif, moodboard, dan copywriting yang memikat.", icon: "Lightbulb" },
        { id: "p3", title: "Produksi Cepat & Presisi", description: "Mengeksekusi seluruh materi kreatif dengan kontrol kualitas ketat.", icon: "PenTool" },
        { id: "p4", title: "Peluncuran & Optimasi", description: "Merilis aset ke publik dan memantau performa hasil konversi secara berkala.", icon: "TrendingUp" }
      ],
      testimonials: [
        { id: "t1", quote: "Kampanye rebranding dari agensi ini berhasil melipatgandakan omset bulanan kami dalam 3 bulan.", author: "Bambang Sudiro", role: "Direktur, Retail Nusantara", avatar: "" },
        { id: "t2", quote: "Eksekusi sangat cepat, komunikasi luar biasa transparan, dan hasil desain selalu di atas ekspektasi.", author: "Melinda Tan", role: "CMO, GlowSkin Clinic", avatar: "" }
      ],
      theme: { accentColor: "#ec4899", defaultMode: "light" },
      seo: {
        metaTitle: "Agensi Kreatif & Branding Digital Terbaik — Solusi Pertumbuhan Bisnis",
        metaDescription: "Layanan lengkap branding, digital marketing, website development, dan konten visual untuk bisnis modern."
      },
      localization: {
        portfolioSectionTitle: "— PROYEK KLIEN",
        portfolioMainTitle: "Hasil Kolaborasi & Transformasi Brand",
        aboutSectionTitle: "— TENTANG AGENSI",
        aboutMainTitle: "Partner Pertumbuhan Kreatif Anda",
        processSectionTitle: "— ALUR KERJA SAMA",
        processMainTitle: "Sistem Kerja Terstruktur & Transparan",
        testimonialSectionTitle: "— KEPUASAN KLIEN",
        testimonialMainTitle: "Cerita Sukses Bersama Kami",
        customProjectSectionTitle: "— KONSULTASI PROYEK",
        customProjectMainTitle: "Mulai Transformasi Bisnis Anda",
        customProjectSubtitle: "Hubungi tim representatif kami untuk mendapatkan penawaran proposal dan estimasi biaya khusus.",
        customProjectCta: "Minta Proposal Kerjasama",
        footerReadyText: "Tingkatkan kehadiran merek Anda sekarang juga.",
        footerStartProject: "Jadwalkan Pitching"
      }
    },
    prompt: "Buatkan website agensi kreatif profesional dengan layanan branding, social media, dan web development."
  },
  {
    id: 'software_web_dev',
    label: 'Software House & Web Dev',
    category: 'agency',
    icon: 'Code',
    themeColor: '#10b981',
    title: 'Website Software House & Developer Web Profesional',
    description: 'Fokus pada jasa pembuatan website kustom, aplikasi web React, integrasi API, dan sistem SaaS.',
    tags: ['Web Dev', 'React', 'Fullstack', 'Software House'],
    data: {
      hero: {
        greeting: "Kami Membangun",
        headline: "Solusi Software & Web Modern",
        subheadline: "Cepat, Aman, dan Siap Berskala Tinggi",
        description: "Mengembangkan website interaktif, aplikasi web kustom, dan sistem automasi bisnis dengan arsitektur teknologi terkini.",
        ctaPrimaryLabel: "Lihat Demo Proyek",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Hitung Estimasi Biaya",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "99.9% Uptime SLA", icon: "Award" },
          { id: "c2", text: "Teknologi React & Cloud", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "KAPASITAS SPRINT", largeText: "Slot Proyek Tersedia" }
      },
      profile: {
        bio: "Tim engineer dan fullstack developer yang berkomitmen menghadirkan software berkinerja kilat dan ramah pengguna.",
        fullBio: "Kami memahami bahwa kecepatan dan keandalan sistem adalah kunci kesuksesan digital. Setiap baris kode kami tulis dengan standar clean code dan keamanan data tingkat tinggi.",
        skills: [
          { id: "sk1", name: "Frontend Development (React/Next)", description: "Antarmuka responsif dengan transisi animasi mulus dan SEO ramah.", icon: "Code" },
          { id: "sk2", name: "Backend & Database", description: "Perancangan RESTful API, Firebase, Supabase, dan arsitektur serverless.", icon: "Layers" },
          { id: "sk3", name: "PWA & Offline-First", description: "Website yang dapat diinstal layaknya aplikasi native dan bekerja tanpa internet.", icon: "Smartphone" },
          { id: "sk4", name: "Integrasi Payment & WhatsApp", description: "Automasi notifikasi order, payment gateway Midtrans/Xendit.", icon: "Zap" }
        ]
      },
      process: [
        { id: "p1", title: "Analisis Arsitektur & SRS", description: "Membedah alur logika bisnis, kebutuhan database, dan skema integrasi.", icon: "Search" },
        { id: "p2", title: "Prototyping & Sprint 1", description: "Membangun fondasi frontend dan sistem otentikasi pengguna.", icon: "Code" },
        { id: "p3", title: "Integrasi API & Testing", description: "Menghubungkan seluruh database dan pengujian performa beban sistem.", icon: "Workflow" },
        { id: "p4", title: "Deployment & Maintenance", description: "Rilis ke server cloud dengan proteksi SSL, CDN, dan garansi bug.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Website kami kini memuat dalam waktu kurang dari 1 detik dan transaksi berjalan tanpa kendala sama sekali.", author: "Fajar Nugraha", role: "CEO, Logistik Express", avatar: "" },
        { id: "t2", quote: "Kemampuan teknis tim ini luar biasa, mampu menyelesaikan fitur automasi yang kompleks tepat waktu.", author: "Dian Sastro", role: "Product Lead, Medika App", avatar: "" }
      ],
      theme: { accentColor: "#10b981", defaultMode: "dark" },
      seo: {
        metaTitle: "Jasa Pembuatan Website & Aplikasi Web Profesional — Software House",
        metaDescription: "Jasa pembuatan website kilat, aplikasi custom, integrasi API, dan sistem cloud scalable untuk bisnis."
      },
      localization: {
        portfolioSectionTitle: "— PROYEK CODING",
        portfolioMainTitle: "Aplikasi Web & Sistem yang Telah Kami Rilis",
        aboutSectionTitle: "— TENTANG KAMI",
        aboutMainTitle: "Rekayasa Perangkat Lunak Berstandar Tinggi",
        processSectionTitle: "— SPRINT DEVELOPMENT",
        processMainTitle: "Metodologi Agile & Clean Code",
        testimonialSectionTitle: "— ULASAN PARTNER",
        testimonialMainTitle: "Kepercayaan dari Para Pemimpin Bisnis",
        customProjectSectionTitle: "— ESTIMASI PROYEK",
        customProjectMainTitle: "Konsultasikan Kebutuhan Sistem Anda",
        customProjectSubtitle: "Dapatkan analisis teknis dan estimasi RAB pengembangan software gratis dari tim lead engineer kami.",
        customProjectCta: "Mulai Konsultasi Teknis",
        footerReadyText: "Modernisasi infrastruktur digital bisnis Anda.",
        footerStartProject: "Buat Sistem Sekarang"
      }
    },
    prompt: "Buatkan website software house developer web modern dengan tampilan teknologi clean dan dark mode."
  },
  {
    id: 'fashion_apparel_store',
    label: 'Brand Fashion & Toko Pakaian',
    category: 'ecommerce',
    icon: 'Store',
    themeColor: '#f59e0b',
    title: 'Website Toko Fashion & Clothing Brand Lokal',
    description: 'Katalog lookbook visual premium dengan alur belanja mudah dan integrasi pemesanan WhatsApp langsung.',
    tags: ['Fashion', 'Toko Online', 'Katalog', 'Clothing'],
    data: {
      hero: {
        greeting: "Koleksi Terbaru 2026",
        headline: "Fashion Urban & Gaya Minimalis",
        subheadline: "Kenyamanan Sehari-hari dengan Material Berkualitas Tinggi",
        description: "Temukan koleksi pakaian dan aksesori berkualitas premium yang dirancang untuk menemani setiap langkah percaya diri Anda.",
        ctaPrimaryLabel: "Lihat Katalog Produk",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Order via WhatsApp",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "100% Katun Premium", icon: "Award" },
          { id: "c2", text: "Garansi Tukar Ukuran", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "PROMO BULAN INI", largeText: "Gratis Ongkir Seluruh Indo" }
      },
      profile: {
        bio: "Brand pakaian lokal independen yang mengusung konsep timeless fashion, kesederhanaan, dan etika produksi berkelanjutan.",
        fullBio: "Setiap artikel pakaian kami dirancang dengan ketelitian pola potong tinggi dan pemilihan material kain terbaik agar nyaman digunakan di iklim tropis sepanjang hari.",
        skills: [
          { id: "sk1", name: "Material Katun Berkualitas", description: "Bahan sejuk, menyerap keringat, dan tidak mudah melar.", icon: "Star" },
          { id: "sk2", name: "Jahitan Standar Ekspor", description: "Pengerjaan garmen rapi dengan standar jahitan rantai kuat.", icon: "Check" },
          { id: "sk3", name: "Pengiriman Cepat & Rapi", description: "Packing box eksklusif dengan proteksi aman ke seluruh Indonesia.", icon: "Zap" },
          { id: "sk4", name: "Layanan Pelanggan Ramah", description: "Dukungan konsultasi ukuran dan layanan tukar size mudah.", icon: "User" }
        ]
      },
      process: [
        { id: "p1", title: "Pilih Koleksi Favorit", description: "Jelajahi ragam artikel pakaian dan panduan ukuran lengkap di katalog.", icon: "Search" },
        { id: "p2", title: "Konfirmasi via WhatsApp", description: "Pesan langsung dengan klik tombol untuk ketersediaan stok instan.", icon: "MessageSquare" },
        { id: "p3", title: "Pembayaran Mudah", description: "Mendukung transfer bank, QRIS, dan dompet digital terpercaya.", icon: "CheckCircle2" },
        { id: "p4", title: "Dikirim ke Rumah Anda", description: "Pesanan diproses dalam 24 jam dengan nomor resi otomatis.", icon: "Truck" }
      ],
      testimonials: [
        { id: "t1", quote: "Bahannya benar-benar adem dan potongannya pas banget di badan. Pasti repeat order!", author: "Rian Hidayat", role: "Pelanggan Jakarta", avatar: "" },
        { id: "t2", quote: "Pengemasan sangat mewah dan pengirimannya cuma 2 hari sampai Surabaya.", author: "Clara Vania", role: "Pelanggan Surabaya", avatar: "" }
      ],
      theme: { accentColor: "#f59e0b", defaultMode: "light" },
      seo: {
        metaTitle: "Toko Fashion Pakaian Pria & Wanita — Koleksi Streetwear & Kasual",
        metaDescription: "Beli pakaian kasual berkualitas tinggi, kaos katun premium, jaket, dan celana dengan garansi tukar size."
      },
      localization: {
        portfolioSectionTitle: "— LOOKBOOK KOLEKSI",
        portfolioMainTitle: "Pilihan Artikel & Koleksi Unggulan",
        aboutSectionTitle: "— FILOSOFI BRAND",
        aboutMainTitle: "Kualitas Nyata Tanpa Kompromi",
        processSectionTitle: "— CARA BELANJA",
        processMainTitle: "Pemesanan Praktis & Aman",
        testimonialSectionTitle: "— TESTIMONI PEMBELI",
        testimonialMainTitle: "Ulasan Jujur Sahabat Brand Kami",
        customProjectSectionTitle: "— PESAN KHUSUS / RESELLER",
        customProjectMainTitle: "Tertarik Menjadi Reseller / Dropshipper?",
        customProjectSubtitle: "Dapatkan harga khusus grosir dan paket kemitraan eksklusif untuk toko Anda.",
        customProjectCta: "Hubungi Admin Kemitraan",
        footerReadyText: "Tingkatkan penampilan kasual Anda hari ini.",
        footerStartProject: "Belanja Sekarang"
      }
    },
    prompt: "Buatkan website katalog toko pakaian brand fashion lokal dengan alur order praktis."
  },
  {
    id: 'artisan_coffee_shop',
    label: 'Coffee Shop & Artisan Roastery',
    category: 'ecommerce',
    icon: 'Coffee',
    themeColor: '#d97706',
    title: 'Website Coffee Shop & Roastery Biji Kopi Nusantara',
    description: 'Visual hangat bernuansa kayu dan kopi, menampilkan menu minuman, biji kopi roasting, dan reservasi meja.',
    tags: ['Coffee', 'Cafe', 'Kuliner', 'Roastery'],
    data: {
      hero: {
        greeting: "Selamat Datang di",
        headline: "Kopi Nusantara & Artisan Roastery",
        subheadline: "Menyeduh Cita Rasa Asli dari Petani Lokal Terpilih",
        description: "Nikmati secangkir kopi pilihan dari dataran tinggi Nusantara yang disangrai dengan presisi untuk kenikmatan aroma tiada tara.",
        ctaPrimaryLabel: "Lihat Buku Menu",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Reservasi Tempat",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "Single Origin 100% Arabika", icon: "Award" },
          { id: "c2", text: "Fresh Roasted Weekly", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "JAM BUKA", largeText: "Buka Setiap Hari 08.00 - 22.00" }
      },
      profile: {
        bio: "Kedai kopi dan roastery mandiri yang mengutamakan kualitas biji kopi lokal dan hubungan adil dengan petani binaan.",
        fullBio: "Kami berdedikasi menghadirkan pengalaman ngopi yang menenangkan di tengah hiruk pikuk kota, didukung barista bersertifikasi dan peralatan seduh berstandar dunia.",
        skills: [
          { id: "sk1", name: "Manual Brew & Espresso", description: "Penyeduhan presisi dengan profil rasa buah dan floral yang kaya.", icon: "Coffee" },
          { id: "sk2", name: "Biji Kopi Fresh Roast", description: "Tersedia kemasan 200g dan 1kg untuk kebutuhan rumah maupun kafe.", icon: "Layers" },
          { id: "sk3", name: "Ruang Kerja Nyaman (Co-working)", description: "Dilengkapi WiFi berkecepatan tinggi dan stopkontak di setiap meja.", icon: "Wifi" },
          { id: "sk4", name: "Menu Makanan & Pastry", description: "Aneka pastry hangat dan menu sarapan pendamping kopi terbaik.", icon: "Utensils" }
        ]
      },
      process: [
        { id: "p1", title: "Kurasi Biji Ceri Kopi", description: "Bekerjasama langsung dengan petani lokal dari Gayo, Toraja, hingga Bali.", icon: "Search" },
        { id: "p2", title: "Roasting Profil Khusus", description: "Penyangraian berkala mingguan untuk memastikan kesegaran optimal.", icon: "Flame" },
        { id: "p3", title: "Penyeduhan Ahli", description: "Diseduh oleh barista berpengalaman sesuai selera seduh Anda.", icon: "Coffee" },
        { id: "p4", title: "Nikmati Cita Rasa", description: "Cicipi kelezatan kopi dalam suasana kafe yang hangat dan ramah.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Tempat paling tenang buat kerja seharian. Manual brew Flores-nya juara!", author: "Dimas Aditya", role: "Remote Worker", avatar: "" },
        { id: "t2", quote: "Biji kopi untuk pesanan kantor selalu segar dan aromanya bertahan berminggu-minggu.", author: "Siska Wardhani", role: "Office Manager", avatar: "" }
      ],
      theme: { accentColor: "#d97706", defaultMode: "light" },
      seo: {
        metaTitle: "Coffee Shop & Roastery Kopi Asli Nusantara — Biji Kopi Fresh Roast",
        metaDescription: "Kedai kopi artisanal dengan pilihan single origin Nusantara, ruang kerja nyaman, dan pemesanan biji kopi online."
      },
      localization: {
        portfolioSectionTitle: "— MENU & PRODUK",
        portfolioMainTitle: "Pilihan Seduhan Kopi & Menu Pilihan",
        aboutSectionTitle: "— CERITA KAMI",
        aboutMainTitle: "Dedikasi untuk Secangkir Kopi Terbaik",
        processSectionTitle: "— DARI KEBUN KE CANGKIR",
        processMainTitle: "Proses Pengolahan Biji Kopi Kami",
        testimonialSectionTitle: "— KATA PENGUNJUNG",
        testimonialMainTitle: "Pengalaman Berkesan Pengunjung Kami",
        customProjectSectionTitle: "— RESERVASI & EVENT",
        customProjectMainTitle: "Booking Tempat untuk Acara Anda",
        customProjectSubtitle: "Tersedia paket reservasi meeting, workshop, atau private gathering lengkap dengan konsumsi kopi & snack.",
        customProjectCta: "Reservasi Meja / Tempat",
        footerReadyText: "Seduh kehangatan bersama kami hari ini.",
        footerStartProject: "Kunjungi Kedai"
      }
    },
    prompt: "Buatkan website kedai kopi dan artisan roastery hangat dengan menu dan formulir reservasi."
  },
  {
    id: 'photo_video_studio',
    label: 'Fotografi & Sinematografi',
    category: 'creative',
    icon: 'Camera',
    themeColor: '#6366f1',
    title: 'Website Studio Fotografi & Produksi Video Sinematik',
    description: 'Showcase visual full-width untuk fotografer komersial, prewedding, produk, dan video dokumenter.',
    tags: ['Fotografi', 'Video', 'Komersial', 'Prewedding'],
    data: {
      hero: {
        greeting: "Visual Storyteller",
        headline: "Studio Fotografi & Video Sinematik",
        subheadline: "Mengabadikan Momen & Nilai Merek dengan Emosi Mendalam",
        description: "Menghadirkan karya foto komersial, dokumentasi pernikahan, dan video profil perusahaan dengan standar visual sinematik kelas atas.",
        ctaPrimaryLabel: "Galeri Foto & Video",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Pricelist Paket Foto",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "Kamera Sinematik 4K/8K", icon: "Award" },
          { id: "c2", text: "100+ Pasangan & Brand Klien", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "JADWAL SHOOTING", largeText: "Menerima Booking Musim Ini" }
      },
      profile: {
        bio: "Fotografer dan sutradara visual dengan pengalaman lebih dari 6 tahun di industri kreatif komersial dan dokumentasi.",
        fullBio: "Bagi kami, setiap foto dan cuplikan video memiliki cerita unik yang layak diabadikan dengan komposisi estetis, pencahayaan dramatis, dan warna sinematik.",
        skills: [
          { id: "sk1", name: "Foto Komersial & Produk", description: "Pencahayaan studio presisi tinggi untuk katalog e-commerce dan iklan.", icon: "Camera" },
          { id: "sk2", name: "Pernikahan & Prewedding", description: "Dokumentasi emosional berkesan dengan estetika editorial majalah.", icon: "Heart" },
          { id: "sk3", name: "Company Profile Video", description: "Produksi video korporat lengkap dengan voiceover dan color grading.", icon: "Video" },
          { id: "sk4", name: "Color Grading & Retouching", description: "Penyempurnaan warna berkarakter filmic dengan standar industri.", icon: "Palette" }
        ]
      },
      process: [
        { id: "p1", title: "Konsultasi Mood & Konsep", description: "Menentukan arah visual, storyboard, lokasi shooting, dan wardrobe.", icon: "Search" },
        { id: "p2", title: "Sesi Pemotretan / Shooting", description: "Eksekusi di lapangan dengan pengarahan pose dan tata cahaya profesional.", icon: "Camera" },
        { id: "p3", title: "Post-Processing & Grading", description: "Proses seleksi foto terbaik, retouching kulit, dan grading warna sinematik.", icon: "Palette" },
        { id: "p4", title: "Serah Terima Galeri Digital", description: "Akses cloud gallery resolusi tinggi siap unduh dan album cetak premium.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Hasil foto katalog produk kami terlihat seperti iklan brand internasional di majalah luar negeri!", author: "Kania Putri", role: "Brand Founder, Jewelry Line", avatar: "" },
        { id: "t2", quote: "Sesi fotonya sangat seru, tidak kaku, dan hasil videonya membuat kami terharu saat menonton kembali.", author: "Arga & Maya", role: "Pasangan Klien Wedding", avatar: "" }
      ],
      theme: { accentColor: "#6366f1", defaultMode: "dark" },
      seo: {
        metaTitle: "Studio Fotografi & Video Sinematik Profesional — Foto Produk & Wedding",
        metaDescription: "Jasa fotografi komersial, foto produk e-commerce, prewedding editorial, dan video profil perusahaan."
      },
      localization: {
        portfolioSectionTitle: "— GALERI KARYA",
        portfolioMainTitle: "Dokumentasi Foto & Karya Sinematik",
        aboutSectionTitle: "— TENTANG KREATOR",
        aboutMainTitle: "Menangkap Cerita Lewat Lensa",
        processSectionTitle: "— ALUR PRODUKSI",
        processMainTitle: "Dari Konsep Hingga Final Cut",
        testimonialSectionTitle: "— TESTIMONIAL",
        testimonialMainTitle: "Momen Bahagia & Kepuasan Klien",
        customProjectSectionTitle: "— BOOKING JADWAL",
        customProjectMainTitle: "Amankan Tanggal Sesi Foto Anda",
        customProjectSubtitle: "Jadwal sesi foto terbatas setiap bulannya. Konsultasikan konsep impian Anda bersama kami sekarang.",
        customProjectCta: "Cek Ketersediaan Tanggal",
        footerReadyText: "Abadikan momen berharga Anda tanpa penyesalan.",
        footerStartProject: "Booking Sesi Foto"
      }
    },
    prompt: "Buatkan website studio fotografi dan videografi sinematik dengan visual gelap modern dan galeri komersial."
  },
  {
    id: 'consultant_business_coach',
    label: 'Konsultan Bisnis & Mentor',
    category: 'service',
    icon: 'Compass',
    themeColor: '#0284c7',
    title: 'Website Konsultan Bisnis, Strategi & Legalitas',
    description: 'Sangat cocok untuk praktisi profesional, konsultan manajemen, advisor startup, dan coach bisnis.',
    tags: ['Konsultan', 'Bisnis', 'Mentoring', 'Advisor'],
    data: {
      hero: {
        greeting: "Selamat Datang di",
        headline: "Konsultan Strategi & Pertumbuhan Bisnis",
        subheadline: "Membantu Pemilik Usaha Menskalakan Operasional & Profitabilitas",
        description: "Menyediakan bimbingan strategis, restrukturisasi operasional, dan konsultasi legalitas untuk membawa bisnis Anda ke level berikutnya.",
        ctaPrimaryLabel: "Program Konsultasi",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Jadwalkan Discovery Call",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "10+ Tahun Pengalaman Industri", icon: "Award" },
          { id: "c2", text: "Pendampingan 100+ UMKM & Startup", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "SLOT BULAN INI", largeText: "Sisa 3 Klien Mentoring" }
      },
      profile: {
        bio: "Konsultan bisnis senior dengan rekam jejak terbukti dalam restrukturisasi manajemen, optimalisasi arus kas, dan scaling bisnis.",
        fullBio: "Pendekatan saya berbasis data nyata dan sistematis, membantu Anda keluar dari jebakan rutinitas teknis agar fokus memimpin ekspansi bisnis secara strategis.",
        skills: [
          { id: "sk1", name: "Audit & Diagnosa Bisnis", description: "Mengidentifikasi kebocoran operasional dan potensi peningkatan margin laba.", icon: "Search" },
          { id: "sk2", name: "Penyusunan SOP & Sistem", description: "Membangun sistem kerja terstandar agar bisnis dapat berjalan mandiri.", icon: "Workflow" },
          { id: "sk3", name: "Strategi Finansial & Cashflow", description: "Perencanaan arus kas, budgeting RAB, dan analisis kelayakan investasi.", icon: "TrendingUp" },
          { id: "sk4", name: "1-on-1 Executive Mentoring", description: "Sesi privat mingguan untuk memecahkan hambatan bisnis krusial.", icon: "User" }
        ]
      },
      process: [
        { id: "p1", title: "Discovery Call 30 Menit", description: "Sesi perkenalan awal untuk memetakan tantangan utama bisnis Anda.", icon: "Phone" },
        { id: "p2", title: "Comprehensive Business Audit", description: "Analisis laporan keuangan, alur kerja tim, dan performa penjualan.", icon: "Search" },
        { id: "p3", title: "Penyusunan Roadmap Aksi", description: "Menyusun target 90 hari ke depan dengan indikator capaian KPI jelas.", icon: "Lightbulb" },
        { id: "p4", title: "Eksekusi & Evaluasi Rutin", description: "Pendampingan implementasi berkala hingga sistem baru berjalan stabil.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Setelah 3 bulan pendampingan, profit bersih kami naik 75% berkat eliminasi biaya operasional yang tidak efektif.", author: "Iwan Setiawan", role: "Owner, Manufaktur Plastik", avatar: "" },
        { id: "t2", quote: "SOP yang dibuat sangat aplikatif, kini tim saya bisa bekerja mandiri tanpa harus selalu saya awasi.", author: "drg. Maya", role: "Founder, Dental Care Clinic", avatar: "" }
      ],
      theme: { accentColor: "#0284c7", defaultMode: "light" },
      seo: {
        metaTitle: "Konsultan Bisnis & Mentor Manajemen Profesional — Strategi Scaling",
        metaDescription: "Jasa konsultasi bisnis, audit manajemen, pembuatan SOP perusahaan, dan pendampingan privat CEO."
      },
      localization: {
        portfolioSectionTitle: "— PROGRAM & LAYANAN",
        portfolioMainTitle: "Paket Pendampingan & Mentoring Bisnis",
        aboutSectionTitle: "— PROFIL KONSULTAN",
        aboutMainTitle: "Pengalaman Nyata Mengakselerasi Usaha",
        processSectionTitle: "— TAHAPAN PENDAMPINGAN",
        processMainTitle: "Metode Teruji untuk Hasil Maksimal",
        testimonialSectionTitle: "— KATA PEMILIK USAHA",
        testimonialMainTitle: "Transformasi Nyata Para Klien Kami",
        customProjectSectionTitle: "— JADWALKAN SESI",
        customProjectMainTitle: "Ambil Langkah Pertama Hari Ini",
        customProjectSubtitle: "Pilih waktu luang Anda untuk berdiskusi langsung mengenai arah masa depan bisnis Anda.",
        customProjectCta: "Daftar Discovery Call Gratis",
        footerReadyText: "Bangun bisnis yang menguntungkan dan terstruktur.",
        footerStartProject: "Konsultasi Sekarang"
      }
    },
    prompt: "Buatkan website konsultan manajemen bisnis dan mentor eksekutif yang berwibawa dan meyakinkan."
  },
  {
    id: 'architecture_interior_studio',
    label: 'Arsitektur & Desain Interior',
    category: 'agency',
    icon: 'Home',
    themeColor: '#64748b',
    title: 'Website Studio Arsitektur & Perencanaan Interior',
    description: 'Estetika minimalis arsitektural yang menonjolkan render 3D, denah ruang, dan portofolio proyek terbangun.',
    tags: ['Arsitektur', 'Interior', 'Konstruksi', '3D Render'],
    data: {
      hero: {
        greeting: "Studio Arsitektur",
        headline: "Desain Ruang yang Harmonis & Fungsional",
        subheadline: "Mewujudkan Hunian & Ruang Komersial Bernilai Estetika Tinggi",
        description: "Kami merancang bangunan residensial, villa, dan interior komersial dengan pendekatan keberlanjutan, pencahayaan alami, dan efisiensi ruang.",
        ctaPrimaryLabel: "Portofolio Proyek",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Konsultasi Denah & RAB",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "Ikatan Arsitek Indonesia (IAI)", icon: "Award" },
          { id: "c2", text: "40+ Proyek Residensial & Villa", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "TAHUN 2026", largeText: "Buka Kuota Desain Baru" }
      },
      profile: {
        bio: "Studio konsultan arsitektur dan desain interior berorientasi kenyamanan pengguna, efisiensi sirkulasi, dan keanggunan bentuk.",
        fullBio: "Setiap karya kami adalah hasil dialog mendalam antara kebutuhan pemilik, karakteristik lahan, dan pemilihan material yang tahan terhadap waktu.",
        skills: [
          { id: "sk1", name: "Desain Arsitektur Rumah & Villa", description: "Perancangan fasad modern, denah tata ruang, dan gambar kerja IMB/PBG.", icon: "Home" },
          { id: "sk2", name: "Desain Interior & Custom Furniture", description: "Penataan ruang interior, pencahayaan estetik, dan detail perabot kustom.", icon: "Layers" },
          { id: "sk3", name: "Visualisasi 3D Rendering Realistis", description: "Render visual fotorealistik untuk melihat gambaran akhir bangunan nyata.", icon: "Image" },
          { id: "sk4", name: "Perhitungan RAB & Pengawasan", description: "Estimasi biaya pembangunan presisi dan supervisi berkala di lapangan.", icon: "FileText" }
        ]
      },
      process: [
        { id: "p1", title: "Survey Lahan & Kebutuhan Klien", description: "Pengukuran lokasi, analisis orientasi matahari, dan penyusunan ruang.", icon: "Search" },
        { id: "p2", title: "Konsep Skematik & 3D Awal", description: "Penyusunan zonasi denah dan presentasi konsep bentuk visual 3D.", icon: "Lightbulb" },
        { id: "p3", title: "Gambar Kerja Detail (DED)", description: "Penyusunan ratusan lembar gambar teknis struktur, arsitektur, dan MEP.", icon: "PenTool" },
        { id: "p4", title: "Supervisi & Serah Terima", description: "Pengawasan berkala proses pembangunan hingga siap dihuni dengan sempurna.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Rumah kami terasa sangat sejuk meski tanpa AC di siang hari berkat ventilasi silang yang dirancang studio ini.", author: "Doni Prasetyo", role: "Pemilik Rumah di BSD", avatar: "" },
        { id: "t2", quote: "Interior cafe kami menjadi daya tarik viral di media sosial dan sangat nyaman bagi pengunjung.", author: "Valerie Ang", role: "Owner, Cafe Artisan", avatar: "" }
      ],
      theme: { accentColor: "#64748b", defaultMode: "light" },
      seo: {
        metaTitle: "Studio Arsitektur & Jasa Desain Interior Rumah Mewah — Desain Bangunan",
        metaDescription: "Jasa arsitek rumah tinggal, villa, interior komersial, gambar kerja DED, dan render 3D fotorealistik."
      },
      localization: {
        portfolioSectionTitle: "— KARYA TERBANGUN",
        portfolioMainTitle: "Koleksi Proyek Arsitektur & Interior",
        aboutSectionTitle: "— PRINSIP DESAIN",
        aboutMainTitle: "Harmoni Alam, Ruang, dan Material",
        processSectionTitle: "— TAHAPAN RANCANG",
        processMainTitle: "Dari Sketsa Gagasan Hingga Bangunan Nyata",
        testimonialSectionTitle: "— KESAKSIAN PEMILIK",
        testimonialMainTitle: "Kepuasan Para Penghuni Karya Kami",
        customProjectSectionTitle: "— DISKUSI LAHAN",
        customProjectMainTitle: "Mulai Rancang Hunian Impian Anda",
        customProjectSubtitle: "Kirimkan ukuran lahan Anda dan mari diskusikan konsep desain terbaik bersama tim arsitek kami.",
        customProjectCta: "Konsultasi Gambar Desain",
        footerReadyText: "Wujudkan ruang hidup terbaik bagi keluarga Anda.",
        footerStartProject: "Rancang Sekarang"
      }
    },
    prompt: "Buatkan website studio arsitektur dan desain interior dengan nuansa minimalis modern dan proyek terbangun."
  },
  {
    id: 'fitness_personal_trainer',
    label: 'Fitness & Personal Trainer',
    category: 'portfolio',
    icon: 'Activity',
    themeColor: '#ef4444',
    title: 'Website Pelatih Kebugaran & Studio Fitness',
    description: 'Tata letak berenergi tinggi untuk pelatih pribadi, gym, dan program transformasi tubuh.',
    tags: ['Fitness', 'Trainer', 'Kesehatan', 'Gym'],
    data: {
      hero: {
        greeting: "Transformasi Tubuh Anda Bersama",
        headline: "Elite Fitness & Personal Coaching",
        subheadline: "Mencapai Target Kebugaran Ideal dengan Program Teruji",
        description: "Program pelatihan kebugaran privat dan nutrisi terarah yang disesuaikan dengan kebutuhan fisik dan tujuan gaya hidup sehat Anda.",
        ctaPrimaryLabel: "Pilih Program Latihan",
        ctaPrimaryUrl: "#pricing",
        ctaSecondaryLabel: "Konsultasi Kebugaran",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "500+ Transformasi Sukses", icon: "Award" },
          { id: "c2", text: "Sertifikasi Internasional", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "SLOT BULAN INI", largeText: "Sisa 5 Slot Privat" }
      },
      profile: {
        bio: "Pelatih kebugaran bersertifikasi dengan 7+ tahun pengalaman melatih atlet dan eksekutif muda.",
        fullBio: "Dedikasi saya adalah membantu Anda membangun kebiasaan hidup sehat yang berkelanjutan tanpa diet ekstrem dan latihan yang membosankan.",
        skills: [
          { id: "sk1", name: "Hypertrophy & Fat Loss", description: "Program pembentukan otot dan pembakaran lemak optimal.", icon: "Activity" },
          { id: "sk2", name: "Custom Nutrition Plan", description: "Panduan asupan nutrisi harian yang fleksibel dan lezat.", icon: "CheckCircle2" },
          { id: "sk3", name: "Mobility & Posture Fix", description: "Koreksi postur tubuh dan pemulihan cedera ringan.", icon: "Sparkles" },
          { id: "sk4", name: "1-on-1 VIP Mentoring", description: "Pemantauan progress mingguan intensif dan evaluasi.", icon: "Users" }
        ]
      },
      process: [
        { id: "p1", title: "Assessment Tubuh", description: "Pengecekan komposisi tubuh, riwayat aktivitas, dan tujuan utama.", icon: "Search" },
        { id: "p2", title: "Penyusunan Program", description: "Perancangan menu makanan dan jadwal latihan personal.", icon: "Layout" },
        { id: "p3", title: "Eksekusi & Pendampingan", description: "Sesi latihan privat dengan koreksi form dan gerakan presisi.", icon: "Activity" },
        { id: "p4", title: "Evaluasi & Progress", description: "Pengukuran berkala untuk memastikan target tercapai maksimal.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Turun 12 kg dalam 3 bulan dengan badan terasa jauh lebih bugar dan berenergi!", author: "Dimas Anggara", role: "Pengusaha", avatar: "" },
        { id: "t2", quote: "Coach sangat detail mengoreksi teknik gerakan, bebas cedera dan hasilnya nyata.", author: "Clara S.", role: "Brand Manager", avatar: "" }
      ],
      theme: { accentColor: "#ef4444", defaultMode: "dark" },
      seo: {
        metaTitle: "Personal Trainer & Konsultan Kebugaran Profesional — Program Fit",
        metaDescription: "Program personal training privat, fat loss, muscle building, dan bimbingan nutrisi sehat terarah."
      },
      localization: {
        portfolioSectionTitle: "— TRANSFORMASI KLIEN",
        portfolioMainTitle: "Kisah Sukses Perubahan Tubuh",
        aboutSectionTitle: "— TENTANG COACH",
        aboutMainTitle: "Komitmen Nyata untuk Kesehatan Anda",
        processSectionTitle: "— METODE LATIHAN",
        processMainTitle: "4 Langkah Menuju Tubuh Ideal",
        testimonialSectionTitle: "— TESTIMONIAL",
        testimonialMainTitle: "Apa Kata Mereka yang Berhasil",
        customProjectSectionTitle: "— MULAI SEKARANG",
        customProjectMainTitle: "Siap Mengubah Hidup Anda?",
        customProjectSubtitle: "Jadwalkan konsultasi awal gratis dan mulai langkah pertama transformasi Anda.",
        customProjectCta: "Daftar Sesi Konsultasi",
        footerReadyText: "Tubuh sehat dan bugar adalah investasi terbaik Anda.",
        footerStartProject: "Mulai Latihan"
      }
    },
    prompt: "Buatkan landing page personal trainer dan studio kebugaran yang energik dan memotivasi."
  },
  {
    id: 'digital_academy_course',
    label: 'Akademi & Kursus Online',
    category: 'agency',
    icon: 'GraduationCap',
    themeColor: '#3b82f6',
    title: 'Website Edukasi Digital & Pelatihan Karir',
    description: 'Format berkonversi tinggi untuk bootcamp, kelas online, webinar, dan sertifikasi keahlian.',
    tags: ['Edukasi', 'Kursus', 'Bootcamp', 'Karir'],
    data: {
      hero: {
        greeting: "Akselerasi Karir Digital Anda",
        headline: "Master In-Demand Tech & Creative Skills",
        subheadline: "Belajar Praktis Bersama Praktisi Industri Terkemuka",
        description: "Kurikulum berbasis proyek nyata yang dirancang untuk membekali Anda dengan keterampilan digital masa depan dan koneksi kerja terpercaya.",
        ctaPrimaryLabel: "Jelajahi Program Kelas",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Unduh Silabus",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "94% Lulusan Bekerja", icon: "Award" },
          { id: "c2", text: "5,000+ Alumni Sukses", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "BATCH TERBARU", largeText: "Pendaftaran Dibuka" }
      },
      profile: {
        bio: "Akademi pelatihan digital modern dengan mentor berpengalaman dari perusahaan unicorn.",
        fullBio: "Kami menjembatani kesenjangan antara teori akademis dengan kebutuhan nyata industri melalui metode pembelajaran intensif berbasis portofolio.",
        skills: [
          { id: "sk1", name: "Project-Based Learning", description: "Tugas mingguan berupa studi kasus dunia nyata.", icon: "PenTool" },
          { id: "sk2", name: "1-on-1 Mentor Review", description: "Ulasan kode dan portofolio langsung dari pakar.", icon: "Users" },
          { id: "sk3", name: "Career Handoff & Job Prep", description: "Simulasi interview, review CV, dan penyaluran kerja.", icon: "Briefcase" },
          { id: "sk4", name: "Lifetime Community Access", description: "Jejaring alumni aktif untuk kolaborasi dan sharing loker.", icon: "Sparkles" }
        ]
      },
      process: [
        { id: "p1", title: "Registrasi & Onboarding", description: "Pilih jalur keahlian dan dapatkan akses materi pendahuluan.", icon: "Search" },
        { id: "p2", title: "Live Class & Praktek", description: "Sesi interaktif daring dengan pengerjaan tugas langsung.", icon: "Layout" },
        { id: "p3", title: "Final Capstone Project", description: "Membangun proyek portofolio komprehensif siap pamer.", icon: "PenTool" },
        { id: "p4", title: "Kelulusan & Hiring", description: "Sertifikasi resmi dan presentasi karya di hadapan mitra industri.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Dari nol ilmu coding berhasil switch career jadi frontend developer dalam 4 bulan!", author: "Rian Hidayat", role: "Software Engineer di Tech Co", avatar: "" },
        { id: "t2", quote: "Mentornya sabar dan feedback portofolionya sangat tajam, sangat worth it!", author: "Amanda Putri", role: "UI Designer di FinTech", avatar: "" }
      ],
      theme: { accentColor: "#3b82f6", defaultMode: "light" },
      seo: {
        metaTitle: "Akademi Pelatihan Keterampilan Digital & Bootcamp Karir Masa Depan",
        metaDescription: "Belajar UI/UX, Web Dev, Digital Marketing, dan Data Science dengan kurikulum standar industri."
      },
      localization: {
        portfolioSectionTitle: "— PROGRAM UNGGULAN",
        portfolioMainTitle: "Pilihan Jalur Belajar Profesional",
        aboutSectionTitle: "— KEUNGGULAN AKADEMI",
        aboutMainTitle: "Kenapa Belajar Bersama Kami?",
        processSectionTitle: "— ALUR PEMBELAJARAN",
        processMainTitle: "Perjalanan Menuju Karir Impian",
        testimonialSectionTitle: "— CERITA ALUMNI",
        testimonialMainTitle: "Kisah Sukses Lulusan Kami",
        customProjectSectionTitle: "— KONSULTASI KARIR",
        customProjectMainTitle: "Bingung Memilih Jalur Karir?",
        customProjectSubtitle: "Dapatkan bimbingan gratis dari konselor karir kami untuk menentukan kelas terbaik bagi Anda.",
        customProjectCta: "Jadwalkan Konseling Karir",
        footerReadyText: "Tingkatkan potensi karir Anda ke level tertinggi.",
        footerStartProject: "Gabung Sekarang"
      }
    },
    prompt: "Buatkan landing page kursus akademi digital dan bootcamp karir yang modern dan terpercaya."
  },
  {
    id: 'wedding_event_planner',
    label: 'Wedding & Event Organizer',
    category: 'agency',
    icon: 'Heart',
    themeColor: '#f43f5e',
    title: 'Website Resmi Wedding Organizer & Event Planner',
    description: 'Sentuhan elegan, hangat, dan romantis untuk penyelenggara pernikahan dan momen spesial.',
    tags: ['Wedding', 'Event', 'Pernikahan', 'Dekorasi'],
    data: {
      hero: {
        greeting: "Mewujudkan Hari Bahagia Anda",
        headline: "Luxury Wedding & Event Planner",
        subheadline: "Menciptakan Momen Pernikahan yang Tak Terlupakan",
        description: "Kami merancang dan mengelola setiap detail hari istimewa Anda dengan keanggunan, ketenangan, dan kesempurnaan.",
        ctaPrimaryLabel: "Lihat Galeri Pernikahan",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Pricelist Paket",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "200+ Pesta Pernikahan Indah", icon: "Award" },
          { id: "c2", text: "Vendor Rekanan Terlengkap", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "RESERVASI 2026", largeText: "Slot Terbatas" }
      },
      profile: {
        bio: "Perencana pernikahan profesional berdedikasi menciptakan perayaan yang personal dan bebas stres.",
        fullBio: "Setiap pasangan memiliki kisah cinta yang unik. Tugas kami adalah menerjemahkan cerita tersebut ke dalam atmosfer pernikahan yang magis dan anggun.",
        skills: [
          { id: "sk1", name: "Concept & Moodboard", description: "Perancangan tema visual dan dekorasi personal.", icon: "Sparkles" },
          { id: "sk2", name: "Vendor Management", description: "Kurasi vendor katering, rias, foto, dan musik terbaik.", icon: "Users" },
          { id: "sk3", name: "Budget Optimization", description: "Alokasi anggaran efisien tanpa mengurangi kemewahan.", icon: "Layers" },
          { id: "sk4", name: "On-the-Day Coordination", description: "Manajemen rundown acara bebas repot di hari H.", icon: "CheckCircle2" }
        ]
      },
      process: [
        { id: "p1", title: "Pertemuan Awal & Visi", description: "Mendengar impian pernikahan dan konsep yang diinginkan.", icon: "Heart" },
        { id: "p2", title: "Kurasi Vendor & Budget", description: "Menyusun opsi venue, dekorasi, dan katering sesuai budget.", icon: "Layout" },
        { id: "p3", title: "Technical Meeting & Rehearsal", description: "Koordinasi matang dengan seluruh pihak keluarga dan vendor.", icon: "Users" },
        { id: "p4", title: "Eksekusi Hari H", description: "Pengawalan acara dari awal hingga akhir dengan sempurna.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Pernikahan kami berjalan super lancar tanpa kendala apapun. Timnya ramah dan sangat cekatan!", author: "Jessica & Kevin", role: "Pengantin", avatar: "" },
        { id: "t2", quote: "Konsep dekorasi dan rundown acaranya dipuji oleh seluruh tamu undangan. Terima kasih banyak!", author: "Anindya & Fikri", role: "Pengantin", avatar: "" }
      ],
      theme: { accentColor: "#f43f5e", defaultMode: "light" },
      seo: {
        metaTitle: "Wedding Organizer & Event Planner Mewah — Paket Pernikahan Eksklusif",
        metaDescription: "Jasa perencanaan pernikahan, dekorasi elegan, katering, dan koordinasi hari H profesional."
      },
      localization: {
        portfolioSectionTitle: "— GALERI MOMEN",
        portfolioMainTitle: "Koleksi Pernikahan Impian",
        aboutSectionTitle: "— TENTANG KAMI",
        aboutMainTitle: "Ketenangan di Hari Bahagia Anda",
        processSectionTitle: "— ALUR KERJA",
        processMainTitle: "Tahapan Rencana Menuju Hari H",
        testimonialSectionTitle: "— KATA PENGANTIN",
        testimonialMainTitle: "Kisah Bahagia Klien Kami",
        customProjectSectionTitle: "— KONSULTASI PERNIKAHAN",
        customProjectMainTitle: "Ceritakan Konsep Impian Anda",
        customProjectSubtitle: "Jadwalkan sesi konsultasi santai dengan wedding planner kami dan dapatkan estimasi anggaran.",
        customProjectCta: "Hubungi Wedding Planner",
        footerReadyText: "Wujudkan perayaan cinta paling berkesan dalam hidup Anda.",
        footerStartProject: "Konsultasi Acara"
      }
    },
    prompt: "Buatkan website wedding organizer dan event planner elegan bernuansa mewah dan romantis."
  },
  {
    id: 'luxury_real_estate',
    label: 'Real Estate & Agen Properti Mewah',
    category: 'agency',
    icon: 'Home',
    themeColor: '#d97706',
    title: 'Website Agensi Properti & Villa Mewah',
    description: 'Desain prestisius dengan fokus pada visual hunian eksklusif, lokasi prima, dan investasi properti.',
    tags: ['Properti', 'Real Estate', 'Villa', 'Investasi'],
    data: {
      hero: {
        greeting: "Investasi Hunian Bergengsi",
        headline: "Exclusive Luxury Living & Real Estate",
        subheadline: "Koleksi Properti Premium di Lokasi Paling Strategis",
        description: "Menemukan hunian impian dan aset investasi properti berkelas tinggi dengan nilai apresiasi maksimal dan legalitas aman.",
        ctaPrimaryLabel: "Lihat Daftar Properti",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Jadwalkan Private Tour",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "Nilai Transaksi 100M+", icon: "Award" },
          { id: "c2", text: "Legalitas Sertifikat 100% Aman", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "PROPERTI PILIHAN", largeText: "Unit Eksklusif Tersedia" }
      },
      profile: {
        bio: "Konsultan properti mewah terkemuka dengan keahlian riset pasar dan negosiasi investasi premium.",
        fullBio: "Kami mendampingi high-net-worth individuals dalam memilih properti residensial dan komersial dengan potensi capital gain dan rental yield terbaik.",
        skills: [
          { id: "sk1", name: "Prime Location Scouting", description: "Pencarian unit hunian di kawasan paling prestisius.", icon: "Search" },
          { id: "sk2", name: "Legal & Due Diligence", description: "Pemeriksaan menyeluruh terhadap sertifikat dan perizinan.", icon: "CheckCircle2" },
          { id: "sk3", name: "ROI & Yield Advisory", description: "Analisis potensi keuntungan sewa dan pertumbuhan nilai aset.", icon: "Layers" },
          { id: "sk4", name: "VIP Private Showings", description: "Kunjungan eksklusif dan privat untuk setiap calon pembeli.", icon: "Users" }
        ]
      },
      process: [
        { id: "p1", title: "Kriteria & Preferensi", description: "Menentukan tipe hunian, lokasi impian, dan budget investasi.", icon: "Search" },
        { id: "p2", title: "Kurasi Unit Terbaik", description: "Menyajikan pilihan unit properti yang telah lolos uji kelayakan.", icon: "Layout" },
        { id: "p3", title: "Private Site Tour", description: "Melihat langsung arsitektur, fasilitas, dan lingkungan hunian.", icon: "Home" },
        { id: "p4", title: "Transaksi & Handover", description: "Pendampingan notaris hingga serah terima kunci properti.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Pelayanan sangat privat dan profesional, villa yang dibeli memiliki okupansi sewa di atas 85%!", author: "Bambang Soediro", role: "Investor Properti", avatar: "" },
        { id: "t2", quote: "Proses pembelian rumah berjalan sangat cepat, transparan, dan tanpa keraguan legalitas.", author: "Grace Tanuwijaya", role: "Private Buyer", avatar: "" }
      ],
      theme: { accentColor: "#d97706", defaultMode: "dark" },
      seo: {
        metaTitle: "Agensi Properti Mewah & Villa Eksklusif — Portofolio Investasi",
        metaDescription: "Temukan rumah mewah, villa modern, penthouse, dan tanah strategis untuk hunian dan investasi."
      },
      localization: {
        portfolioSectionTitle: "— DAFTAR UNIT",
        portfolioMainTitle: "Koleksi Properti Unggulan",
        aboutSectionTitle: "— TENTANG AGENSI",
        aboutMainTitle: "Standar Tertinggi Layanan Properti",
        processSectionTitle: "— PROSES PEMBELIAN",
        processMainTitle: "Langkah Aman Memiliki Hunian Mewah",
        testimonialSectionTitle: "— ULASAN INVESTOR",
        testimonialMainTitle: "Kepercayaan Klien Ternama",
        customProjectSectionTitle: "— PRIVATE INQUIRY",
        customProjectMainTitle: "Cari Properti Spesifik?",
        customProjectSubtitle: "Sampaikan kriteria properti yang Anda cari, tim agen kami akan memberikan daftar listing privat.",
        customProjectCta: "Hubungi Konsultan Properti",
        footerReadyText: "Miliki aset hunian impian dengan nilai investasi terbaik.",
        footerStartProject: "Jelajahi Properti"
      }
    },
    prompt: "Buatkan website agensi properti mewah dan villa prestisius dengan visual megah."
  },
  {
    id: 'beauty_salon_skincare',
    label: 'Klinik Kecantikan & Skincare',
    category: 'agency',
    icon: 'Sparkles',
    themeColor: '#ec4899',
    title: 'Website Klinik Estetika & Salon Kecantikan',
    description: 'Nuansa bersih, mewah, dan higienis untuk klinik kulit, perawatan wajah, dan salon premium.',
    tags: ['Kecantikan', 'Skincare', 'Salon', 'Klinik'],
    data: {
      hero: {
        greeting: "Pesona Kulit Sehat & Bercahaya",
        headline: "Aesthetic Clinic & Luxury Skincare",
        subheadline: "Perawatan Estetika Medis Berteknologi Canggih",
        description: "Dapatkan kulit impian yang sehat dan glowing melalui perawatan dokter spesialis bersertifikasi dengan teknologi mutakhir.",
        ctaPrimaryLabel: "Pilihan Treatment",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Booking Jadwal",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "Dokter Kulit Bersertifikat", icon: "Award" },
          { id: "c2", text: "Teknologi Laser Terkini", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "PROMO BULAN INI", largeText: "Diskon Treatment 25%" }
      },
      profile: {
        bio: "Klinik estetika medis terpercaya yang mengutamakan keselamatan, hasil alami, dan kenyamanan pasien.",
        fullBio: "Kami memadukan sains dermatologi modern dengan seni perawatan kecantikan untuk menghadirkan solusi kulit yang tepat sasaran.",
        skills: [
          { id: "sk1", name: "Laser & Skin Rejuvenation", description: "Peremajaan kulit dan penghilangan flek dengan laser medis.", icon: "Sparkles" },
          { id: "sk2", name: "Acne & Scar Solution", description: "Penanganan jerawat aktif dan perbaikan bopeng bekas jerawat.", icon: "CheckCircle2" },
          { id: "sk3", name: "Anti-Aging & Face Contour", description: "Perawatan pengencangan kulit dan kontur wajah proporsional.", icon: "Layout" },
          { id: "sk4", name: "Medical Grade Skincare", description: "Rangkaian produk dermatologis teruji BPOM dan halal.", icon: "Layers" }
        ]
      },
      process: [
        { id: "p1", title: "Skin Analysis Komputer", description: "Pemeriksaan kondisi lapisan kulit dengan alat diagnostik digital.", icon: "Search" },
        { id: "p2", title: "Konsultasi Dokter", description: "Diskusi mendalam mengenai masalah kulit dan rekomendasi terapi.", icon: "Users" },
        { id: "p3", title: "Tindakan Treatment", description: "Perawatan steril dan nyaman oleh dokter berpengalaman.", icon: "Sparkles" },
        { id: "p4", title: "Follow-up & Homecare", description: "Pemantauan hasil perawatan dan panduan krim perawatan harian.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Kulit jadi jauh lebih cerah dan bekas jerawat menahun memudar hanya dalam 3 sesi treatment!", author: "Nathalie Chandra", role: "Influencer", avatar: "" },
        { id: "t2", quote: "Kliniknya sangat bersih dan dokternya ramah banget, tidak memaksakan treatment berlebihan.", author: "Siti Rahmania", role: "Dokter Gigi", avatar: "" }
      ],
      theme: { accentColor: "#ec4899", defaultMode: "light" },
      seo: {
        metaTitle: "Klinik Estetika & Dokter Kecantikan Kulit — Treatment Glowing",
        metaDescription: "Perawatan kulit berteknologi laser, pencerah wajah, penghilang jerawat, dan anti-aging medis."
      },
      localization: {
        portfolioSectionTitle: "— DAFTAR TREATMENT",
        portfolioMainTitle: "Perawatan Estetika Terpopuler",
        aboutSectionTitle: "— TENTANG KLINIK",
        aboutMainTitle: "Keahlian Medis untuk Kecantikan Alami",
        processSectionTitle: "— TAHAPAN KONSULTASI",
        processMainTitle: "Perjalanan Menuju Kulit Impian",
        testimonialSectionTitle: "— KISAH PASIEN",
        testimonialMainTitle: "Kepuasan dan Hasil Nyata",
        customProjectSectionTitle: "— RESERVASI DOKTER",
        customProjectMainTitle: "Mulai Perawatan Kulit Anda Hari Ini",
        customProjectSubtitle: "Pilih tanggal dan waktu kunjungan yang sesuai, tim kami akan mengonfirmasi janji temu Anda.",
        customProjectCta: "Buat Janji Temu Konsultasi",
        footerReadyText: "Tampil percaya diri dengan kulit sehat dan bercahaya alami.",
        footerStartProject: "Booking Treatment"
      }
    },
    prompt: "Buatkan website klinik estetika kecantikan dan skincare modern bernuansa bersih dan mewah."
  },
  {
    id: 'finance_tax_advisory',
    label: 'Konsultan Keuangan & Pajak',
    category: 'agency',
    icon: 'DollarSign',
    themeColor: '#059669',
    title: 'Website Kantor Akuntan & Konsultan Perpajakan',
    description: 'Kesan berwibawa, kredibel, dan aman untuk konsultan pajak, audit laporan keuangan, dan valuasi bisnis.',
    tags: ['Keuangan', 'Pajak', 'Akuntansi', 'Audit'],
    data: {
      hero: {
        greeting: "Kepatuhan Pajak & Strategi Finansial",
        headline: "Trusted Tax & Financial Advisory",
        subheadline: "Mengoptimalkan Keuangan Bisnis dengan Kepatuhan Hukum Penuh",
        description: "Membantu perusahaan dan individu mengelola pembukuan, kepatuhan pajak, audit keuangan, dan efisiensi biaya secara legal dan transparan.",
        ctaPrimaryLabel: "Layanan Konsultasi",
        ctaPrimaryUrl: "#portfolio",
        ctaSecondaryLabel: "Jadwalkan Diskusi",
        ctaSecondaryUrl: "#contact",
        cards: [
          { id: "c1", text: "Konsultan Pajak Resmi BKP", icon: "Award" },
          { id: "c2", text: "100+ Klien Korporasi", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "STATUS KONSULTASI", largeText: "Menerima Klien Baru" }
      },
      profile: {
        bio: "Akuntan publik dan konsultan pajak terdaftar dengan pengalaman menangani kepatuhan korporat multi-sektor.",
        fullBio: "Kami memastikan bisnis Anda terhindar dari sanksi administrasi perpajakan dan memiliki laporan keuangan yang kredibel untuk keperluan perbankan dan investor.",
        skills: [
          { id: "sk1", name: "Corporate Tax Planning", description: "Perencanaan pajak perusahaan yang efisien dan sesuai regulasi.", icon: "Layers" },
          { id: "sk2", name: "Monthly Bookkeeping & Review", description: "Penyusunan laporan laba rugi, neraca, dan arus kas berkala.", icon: "CheckCircle2" },
          { id: "sk3", name: "SPT Tahunan Badan & Orang Pribadi", description: "Pelaporan pajak tahunan akurat tanpa denda keterlambatan.", icon: "Layout" },
          { id: "sk4", name: "Tax Dispute & Audit Support", description: "Pendampingan resmi saat pemeriksaan pajak oleh otoritas.", icon: "Users" }
        ]
      },
      process: [
        { id: "p1", title: "Financial Health Check", description: "Review menyeluruh pembukuan dan status kepatuhan pajak.", icon: "Search" },
        { id: "p2", title: "Identifikasi Masalah", description: "Menemukan potensi risiko denda atau ketidakefisienan pembukuan.", icon: "Layout" },
        { id: "p3", title: "Penyusunan Solusi & Rekonsiliasi", description: "Perapian jurnal transaksi dan perhitungan pajak akurat.", icon: "Layers" },
        { id: "p4", title: "Pelaporan & Monitoring", description: "Submit laporan resmi dan pemantauan kepatuhan berkesinambungan.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Laporan keuangan perusahaan kami sekarang super rapi dan pengurusan SPT tahunan berjalan tanpa kendala.", author: "Taufik Rahman", role: "Direktur, PT Logistik Nusantara", avatar: "" },
        { id: "t2", quote: "Sangat membantu dalam restrukturisasi pajak usaha sehingga cashflow bisnis kami jauh lebih sehat.", author: "Linda Wibowo", role: "Founder, Retail Chain", avatar: "" }
      ],
      theme: { accentColor: "#059669", defaultMode: "light" },
      seo: {
        metaTitle: "Konsultan Pajak & Jasa Pembukuan Akuntansi Perusahaan — Tax Advisor",
        metaDescription: "Jasa laporan keuangan, SPT tahunan badan, perencanaan pajak legal, dan pendampingan audit."
      },
      localization: {
        portfolioSectionTitle: "— LAYANAN KAMI",
        portfolioMainTitle: "Solusi Finansial & Perpajakan",
        aboutSectionTitle: "— TENTANG KANTOR",
        aboutMainTitle: "Integritas dan Keahlian Finansial",
        processSectionTitle: "— METODE KERJA",
        processMainTitle: "Alur Pendampingan Terstruktur",
        testimonialSectionTitle: "— KATA KLIEN",
        testimonialMainTitle: "Kepercayaan Puluhan Bisnis",
        customProjectSectionTitle: "— DISKUSI AWAL",
        customProjectMainTitle: "Konsultasikan Kebutuhan Keuangan Anda",
        customProjectSubtitle: "Dapatkan telaah awal gratis mengenai status kepatuhan pajak dan laporan pembukuan perusahaan Anda.",
        customProjectCta: "Jadwalkan Konsultasi Pajak",
        footerReadyText: "Pastikan kepatuhan pajak dan kesehatan finansial bisnis Anda aman.",
        footerStartProject: "Mulai Konsultasi"
      }
    },
    prompt: "Buatkan website kantor konsultan pajak dan akuntan terpercaya bernuansa korporat profesional."
  },
  {
    id: 'saas_startup_landing',
    label: 'SaaS & Startup Teknologi',
    category: 'agency',
    icon: 'Cpu',
    themeColor: '#6366f1',
    title: 'Landing Page SaaS & Perangkat Lunak Cloud',
    description: 'Template modern ala Silicon Valley dengan fokus pada fitur produk, integrasi API, dan tabel pricing.',
    tags: ['SaaS', 'Software', 'Tech', 'Cloud'],
    data: {
      hero: {
        greeting: "Otomasi Alur Kerja Bisnis",
        headline: "All-in-One Cloud Management Platform",
        subheadline: "Tingkatkan Efisiensi Tim Anda Hingga 300%",
        description: "Perangkat lunak pintar yang menyatukan manajemen proyek, analitik performa, dan kolaborasi tim dalam satu dashboard terintegrasi.",
        ctaPrimaryLabel: "Coba Gratis 14 Hari",
        ctaPrimaryUrl: "#pricing",
        ctaSecondaryLabel: "Tonton Demo Produk",
        ctaSecondaryUrl: "#features",
        cards: [
          { id: "c1", text: "99.9% Server Uptime", icon: "Award" },
          { id: "c2", text: "10,000+ Tim Aktif", icon: "Trophy" }
        ],
        badge: { active: true, smallText: "VERSI 3.0", largeText: "Fitur AI Otomatis Rilis" }
      },
      profile: {
        bio: "Platform produktivitas generasi baru yang dibangun untuk tim modern, agensi, dan startup berkembang.",
        fullBio: "Kami menghilangkan silo informasi dengan menghadirkan solusi kerja cepat, fleksibel, dan terenkripsi aman standar enterprise.",
        skills: [
          { id: "sk1", name: "Real-Time Sync Engine", description: "Sinkronisasi data lintas perangkat instan tanpa jeda.", icon: "Sparkles" },
          { id: "sk2", name: "Custom API & Webhook", description: "Koneksikan ke ribuan tools yang sudah Anda gunakan.", icon: "Code" },
          { id: "sk3", name: "AI Automation Workflow", description: "Eksekusi tugas repetitif secara otomatis berbasis AI.", icon: "Cpu" },
          { id: "sk4", name: "Bank-Grade Encryption", description: "Keamanan data tingkat tinggi dengan enkripsi AES-256.", icon: "CheckCircle2" }
        ]
      },
      process: [
        { id: "p1", title: "Daftar Akun Instan", description: "Mulai dalam hitungan detik tanpa perlu kartu kredit.", icon: "Search" },
        { id: "p2", title: "Integrasikan Data", description: "Import data tim Anda dengan 1-klik dari berbagai format.", icon: "Layout" },
        { id: "p3", title: "Atur Otomasi", description: "Gunakan template alur kerja siap pakai sesuai kebutuhan.", icon: "Cpu" },
        { id: "p4", title: "Pantau & Berkembang", description: "Analisa peningkatan performa tim melalui laporan real-time.", icon: "CheckCircle2" }
      ],
      testimonials: [
        { id: "t1", quote: "Waktu pengerjaan proyek di tim kami berkurang drastis berkat sistem automasi platform ini!", author: "Farhan Maulana", role: "Head of Operations", avatar: "" },
        { id: "t2", quote: "UI-nya sangat ramah pengguna, tim kami langsung bisa adaptasi tanpa perlu sesi training panjang.", author: "Selvi Widjaja", role: "Product Lead", avatar: "" }
      ],
      theme: { accentColor: "#6366f1", defaultMode: "dark" },
      seo: {
        metaTitle: "SaaS Management Platform — Solusi Otomasi & Produktivitas Bisnis Cloud",
        metaDescription: "Platform cloud all-in-one untuk kolaborasi tim, automasi alur kerja, dan analitik bisnis."
      },
      localization: {
        portfolioSectionTitle: "— FITUR UTAMA",
        portfolioMainTitle: "Dirancang untuk Performa Tinggi",
        aboutSectionTitle: "— INTEGRASI",
        aboutMainTitle: "Terhubung dengan Ekosistem Anda",
        processSectionTitle: "— CARA KERJA",
        processMainTitle: "Kemudahan Implementasi dalam 4 Langkah",
        testimonialSectionTitle: "— REPUTASI PENGGUNA",
        testimonialMainTitle: "Dipercaya Ribuan Tim Global",
        customProjectSectionTitle: "— JADWALKAN DEMO",
        customProjectMainTitle: "Ingin Solusi Khusus Enterprise?",
        customProjectSubtitle: "Hubungi tim product specialist kami untuk presentasi khusus dan penawaran paket enterprise.",
        customProjectCta: "Request Demo Enterprise",
        footerReadyText: "Siap membawa produktivitas tim Anda ke masa depan?",
        footerStartProject: "Mulai Uji Coba Gratis"
      }
    },
    prompt: "Buatkan landing page SaaS teknologi cloud dengan tampilan futuristik dan modern."
  }
];


/**
 * Build a complete website configuration locally from offline template
 */
export const buildOfflineWebsite = (templateId: string, customPrompt?: string): Partial<any> => {
  const tmpl = OFFLINE_WEBSITE_TEMPLATES.find(t => t.id === templateId) || OFFLINE_WEBSITE_TEMPLATES[0];
  if (!tmpl || !tmpl.data) {
    return {};
  }
  const customData = JSON.parse(JSON.stringify(tmpl.data));

  if (customPrompt && customPrompt.trim().length > 3) {
    if (customData.hero) {
      customData.hero.headline = customPrompt.trim().slice(0, 60);
    }
    if (customData.seo) {
      customData.seo.metaTitle = `${customPrompt.trim().slice(0, 60)} — Resmi`;
    }
  }

  return customData;
};

/* ==========================================================================
   OFFLINE BLOG / ARTICLE TEMPLATES (0 Quota / Offline Fast Generation)
   ========================================================================== */

export interface OfflineBlogTemplate {
  id: string;
  category: 'tutorial' | 'technology' | 'business' | 'lifestyle' | 'design' | 'general';
  label: string;
  title: string;
  description: string;
  icon: string;
  prompt?: string;
  data: {
    title: string;
    category: string;
    slug: string;
    excerpt: string;
    content: string;
    tags: string;
    metaTitle: string;
    metaDescription: string;
    readTime: number;
    thumbnail?: string;
  };
}

export const OFFLINE_BLOG_TEMPLATES: OfflineBlogTemplate[] = [
  {
    id: 'tutorial_step_by_step',
    category: 'tutorial',
    label: 'Panduan & Tutorial Langkah Demi Langkah',
    title: 'Panduan Lengkap Membangun Identitas Brand Modern',
    description: 'Format tutorial praktis dengan langkah terstruktur, poin aksi, dan ringkasan checklist.',
    icon: 'BookOpen',
    prompt: 'Tuliskan panduan praktis membangun identitas visual brand untuk pemula.',
    data: {
      title: 'Panduan Lengkap Membangun Identitas Brand Modern dari Nol',
      category: 'Teknologi',
      slug: 'panduan-lengkap-identitas-brand-modern',
      excerpt: 'Pelajari langkah demi langkah merancang identitas visual yang konsisten, berkarakter, dan berdaya saing tinggi di pasar digital.',
      content: `<h2>1. Mengapa Identitas Brand Begitu Krusial?</h2>
<p>Di era digital yang serba cepat, identitas visual bukan sekadar logo yang indah. Identitas visual adalah bahasa pertama yang berbicara kepada audiens sebelum mereka membaca penawaran Anda.</p>
<blockquote>Sebuah brand bukan tentang apa yang kita katakan kepada konsumen, melainkan apa yang konsumen katakan satu sama lain tentang kita.</blockquote>

<h2>2. Tiga Fondasi Utama Brand Visual</h2>
<p>Sebelum membuka software desain, pastikan Anda telah menetapkan tiga pondasi ini:</p>
<ul>
  <li><strong>Core Message & Nilai Inti:</strong> Apa yang membuat brand Anda unik dan berbeda dari kompetitor?</li>
  <li><strong>Psikologi Warna:</strong> Pilih palet warna yang memicu emosi yang tepat pada target pasar.</li>
  <li><strong>Hirarki Tipografi:</strong> Gunakan kombinasi jenis huruf yang memiliki kontras jelas dan keterbacaan tinggi.</li>
</ul>

<h2>3. Alur Eksekusi Desain yang Efektif</h2>
<p>Ikuti 4 fase terbukti berikut untuk hasil terbaik:</p>
<ol>
  <li><strong>Riset & Moodboard:</strong> Kumpulkan referensi visual, tekstur, dan nuansa emosional.</li>
  <li><strong>Sketsa & Konsep:</strong> Buat eksplorasi logo minimal 3 arah visual berbeda.</li>
  <li><strong>Digitalisasi & Guidelines:</strong> Standarisasi penggunaan warna, margin, dan tata letak.</li>
  <li><strong>Penerapan Nyata:</strong> Uji visual pada kemasan, website, dan konten media sosial.</li>
</ol>

<h2>4. Kesimpulan & Langkah Selanjutnya</h2>
<p>Konsistensi adalah kunci utama loyalitas pelanggan. Terapkan pedoman brand Anda di setiap titik kontak pelanggan secara berkesinambungan.</p>`,
      tags: 'Brand, Desain, Tutorial, Panduan',
      metaTitle: 'Panduan Lengkap Membangun Identitas Brand Modern — Blog',
      metaDescription: 'Panduan komprehensif langkah demi langkah membuat identitas brand visual dari nol dengan standar agensi profesional.',
      readTime: 5
    }
  },
  {
    id: 'case_study_impact',
    category: 'business',
    label: 'Studi Kasus Proyek & Dampak Bisnis',
    title: 'Studi Kasus: Redesain Landing Page Meningkatkan Konversi 140%',
    description: 'Format studi kasus dengan tantangan, solusi desain, metodologi, dan metrik keberhasilan bisnis nyata.',
    icon: 'TrendingUp',
    prompt: 'Buat artikel studi kasus redesain website yang berhasil mendongkrak penjualan dan konversi.',
    data: {
      title: 'Studi Kasus: Bagaimana Redesain Landing Page Meningkatkan Konversi Hingga 140%',
      category: 'Bisnis',
      slug: 'studi-kasus-redesain-landing-page-konversi-140',
      excerpt: 'Ulasan mendalam proses evaluasi UX, optimalisasi kecepatan, dan penataan ulang CTA yang berhasil mengubah performa bisnis klien.',
      content: `<h2>Latar Belakang & Tantangan Klien</h2>
<p>Klien kami yang bergerak di sektor SaaS menghadapi masalah penurunan tingkat konversi meskipun jumlah traffic organik mereka terus meningkat. Rasio pentalan (bounce rate) mencapai 68% pada perangkat mobile.</p>

<h2>Analisis Masalah & Temuan Riset</h2>
<p>Melalui pengujian heatmap dan rekaman sesi pengguna, kami mengidentifikasi tiga hambatan utama:</p>
<ul>
  <li>Struktur informasi terlalu padat dan tidak memiliki hirarki visual yang jelas.</li>
  <li>Tombol Call-to-Action (CTA) berada terlalu jauh di bawah lipatan halaman (below the fold).</li>
  <li>Kecepatan muat halaman mobile memakan waktu lebih dari 4.5 detik.</li>
</ul>

<h2>Strategi Solusi yang Diterapkan</h2>
<p>Kami merombak total struktur halaman dengan pendekatan Mobile-First:</p>
<ol>
  <li><strong>Penyederhanaan Value Proposition:</strong> Headline dibuat ringkas, lugas, dan berorientasi manfaat nyata.</li>
  <li><strong>Kompresi Aset & Lazy Loading:</strong> Mengurangi beban halaman sebesar 65% sehingga FCP tercapai dalam 0.8 detik.</li>
  <li><strong>Sticky Action Bar:</strong> Menempatkan tombol navigasi aksi yang mudah dijangkau jempol pengguna pada ponsel.</li>
</ol>

<h2>Hasil & Metrik Dampak Nyata</h2>
<blockquote>Peningkatan konversi pendaftaran sebesar 140% dalam 30 hari pertama setelah peluncuran, dengan penurunan bounce rate hingga 24%.</blockquote>
<p>Desain yang baik bukan hanya tentang estetika, melainkan penyelesaian masalah bisnis secara terukur dan presisi.</p>`,
      tags: 'Case Study, Bisnis, UX Design, Konversi',
      metaTitle: 'Studi Kasus Redesain Landing Page Meningkatkan Konversi 140%',
      metaDescription: 'Pelajari bagaimana metodologi UX research dan optimasi kecepatan dapat meningkatkan omset dan konversi secara terukur.',
      readTime: 4
    }
  },
  {
    id: 'tech_trends_insights',
    category: 'technology',
    label: 'Wawasan Tren Teknologi & Kecerdasan Buatan',
    title: 'Tren AI & Otomasi: Mempersiapkan Workflow Kreatif di Era Baru',
    description: 'Analisis mendalam mengenai perkembangan teknologi mutakhir, pengaruh AI, dan tips adaptasi.',
    icon: 'Cpu',
    prompt: 'Ulas tren terbaru kecerdasan buatan dalam membantu industri kreatif dan agensi.',
    data: {
      title: 'Tren AI & Otomasi: Bagaimana Workflow Kreatif Berevolusi di Era Modern',
      category: 'Teknologi',
      slug: 'tren-ai-otomasi-workflow-kreatif-era-modern',
      excerpt: 'Eksplorasi peran AI generatif bukan sebagai pengganti desainer, melainkan pengganda produktivitas dan kreativitas tanpa batas.',
      content: `<h2>Pergeseran Paradigma dalam Industri Kreatif</h2>
<p>Kecerdasan buatan (AI) telah mengubah lanskap produksi digital secara fundamental. Dari pembuatan draf konsep hingga optimasi kode, proses yang sebelumnya memakan waktu berhari-hari kini dapat diselesaikan dalam hitungan menit.</p>

<h2>Tiga Bidang yang Mengalami Transformasi Terbesar</h2>
<ul>
  <li><strong>Eksplorasi Ide Cepat (Rapid Prototyping):</strong> Menghasilkan moodboard dan variasi mockup secara instan.</li>
  <li><strong>Personalisasi Konten Massal:</strong> Menyesuaikan pesan pemasaran berdasarkan preferensi spesifik tiap segmen pengguna.</li>
  <li><strong>Otomasi Tugas Repetitif:</strong> Ekspor aset, penamaan file, dan pengujian tata letak responsif secara otomatis.</li>
</ul>

<blockquote>Kreativitas manusia, empati rasa, dan penilaian estetika tetap menjadi kompas utama yang tidak dapat digantikan oleh algoritma apapun.</blockquote>

<h2>Cara Mempersiapkan Diri</h2>
<p>Kunci keberhasilan di era ini adalah menjadi <em>AI-Augmented Creator</em>: memahami cara merumuskan instruksi terarah (prompt engineering) serta tetap memegang kendali atas kualitas akhir karya.</p>`,
      tags: 'Teknologi, AI, Produktivitas, Tren',
      metaTitle: 'Tren AI & Otomasi Kreatif — Wawasan Teknologi Terkini',
      metaDescription: 'Analisis mendalam mengenai integrasi kecerdasan buatan dalam meningkatkan efisiensi dan inovasi industri kreatif.',
      readTime: 4
    }
  },
  {
    id: 'productivity_tips_tricks',
    category: 'lifestyle',
    label: 'Tips & Trik Produktivitas / Manajemen Waktu',
    title: '5 Kebiasaan Sederhana untuk Menjaga Fokus dan Kreativitas Bebas Burnout',
    description: 'Artikel gaya hidup dan tips manajemen waktu harian bagi profesional, freelancer, dan kreator.',
    icon: 'Zap',
    prompt: 'Tuliskan tips menjaga produktivitas dan kesehatan mental bagi kreator digital.',
    data: {
      title: '5 Kebiasaan Harian untuk Menjaga Fokus Tinggi dan Bebas Burnout',
      category: 'Gaya Hidup',
      slug: '5-kebiasaan-harian-fokus-bebas-burnout',
      excerpt: 'Strategi praktis mengatur ritme kerja, membatasi distraksi digital, dan merawat energi kreatif agar tetap konsisten berkarya.',
      content: `<h2>Tantangan Distraksi di Era Layar Ganda</h2>
<p>Banyak profesional mengira bahwa produktivitas adalah tentang bekerja lebih banyak jam. Padahal, produktivitas sejati adalah tentang mengelola energi dan kedalaman fokus (deep work).</p>

<h2>5 Pilar Kebiasaan yang Terbukti Efektif</h2>
<ol>
  <li><strong>Teknik Time-Boxing:</strong> Alokasikan blok waktu khusus tanpa notifikasi untuk tugas dengan tingkat konsentrasi tinggi.</li>
  <li><strong>Aturan 2 Menit:</strong> Jika suatu tugas kecil dapat diselesaikan kurang dari dua menit, selesaikan segera.</li>
  <li><strong>Digital Sunset:</strong> Hentikan paparan layar gadget minimal 45 menit sebelum beristirahat di malam hari.</li>
  <li><strong>Prioritas Harian Rule of 3:</strong> Tentukan hanya 3 pencapaian terpenting setiap pagi.</li>
  <li><strong>Istirahat Aktif:</strong> Berjalan santai dan hidrasi teratur untuk menyegarkan kembali sirkulasi pikiran.</li>
</ol>

<blockquote>Kualitas karya Anda mencerminkan kualitas ketenangan pikiran saat Anda mengerjakannya.</blockquote>`,
      tags: 'Produktivitas, Gaya Hidup, Mental Health, Fokus',
      metaTitle: '5 Kebiasaan Menjaga Fokus dan Bebas Burnout — Blog',
      metaDescription: 'Tips praktis menjaga produktivitas harian dan merawat energi kreatif bagi kreator dan profesional digital.',
      readTime: 3
    }
  },
  {
    id: 'product_review_deepdive',
    category: 'technology',
    label: 'Ulasan & Review Software / Tool Digital',
    title: 'Review Mendalam: Tool Terbaik untuk Desain & Kolaborasi Tim',
    description: 'Format ulasan produk komparatif dengan kelebihan, kekurangan, penilaian fitur, dan rekomendasi penggunaan.',
    icon: 'Award',
    prompt: 'Tuliskan ulasan mendalam komparasi alat desain digital modern.',
    data: {
      title: 'Review Komparatif: Memilih Tool Desain Terbaik untuk Efisiensi Tim',
      category: 'Teknologi',
      slug: 'review-komparatif-tool-desain-efisiensi-tim',
      excerpt: 'Perbandingan fitur, performa real-time collaboration, dan skalabilitas desain sistem untuk membantu tim Anda memilih software terbaik.',
      content: `<h2>Kebutuhan Kolaborasi Real-Time Masa Kini</h2>
<p>Bekerja secara remote dan hybrid menuntut ekosistem perangkat lunak yang andal, responsif, dan mudah diakses oleh seluruh anggota tim lintas disiplin.</p>

<h2>Aspek Utama yang Dinilai</h2>
<ul>
  <li><strong>Kemudahan Penggunaan & Kurva Belajar:</strong> Seberapa cepat anggota baru dapat beradaptasi.</li>
  <li><strong>Manajemen Design System:</strong> Kemampuan sinkronisasi komponen global dan token warna.</li>
  <li><strong>Fitur Hand-off ke Developer:</strong> Kejelasan inspeksi kode CSS dan ekspor aset otomatis.</li>
</ul>

<h2>Kelebihan & Kekurangan</h2>
<p>Setiap tool memiliki keunggulan tersendiri tergantung skala proyek dan struktur tim Anda. Pastikan memilih opsi yang memiliki komunitas aktif dan integrasi plugin yang luas.</p>`,
      tags: 'Review, Software, Desain, Kolaborasi',
      metaTitle: 'Review Tool Desain & Kolaborasi Terbaik — Ulasan Lengkap',
      metaDescription: 'Ulasan komparatif perangkat lunak desain terbaik untuk memaksimalkan produktivitas dan koordinasi tim.',
      readTime: 4
    }
  },
  {
    id: 'freelance_business_guide',
    category: 'business',
    label: 'Panduan Karier Freelance & Bisnis Agensi',
    title: 'Strategi Menentukan Tarif Jasa Desain & Menutup Klien Berkualitas',
    description: 'Panduan bisnis praktis mengenai negosiasi harga, pembuatan proposal penawaran, dan membangun kepercayaan klien.',
    icon: 'Briefcase',
    prompt: 'Panduan menentukan harga jasa kreatif dan cara bernegosiasi dengan klien premium.',
    data: {
      title: 'Strategi Menentukan Tarif Jasa Kreatif dan Menutup Klien Berkualitas',
      category: 'Bisnis',
      slug: 'strategi-menentukan-tarif-jasa-kreatif-klien-berkualitas',
      excerpt: 'Tinggalkan sistem tarif per jam dan beralihlah ke value-based pricing untuk meningkatkan profitabilitas layanan profesional Anda.',
      content: `<h2>Kelemahan Menjual Waktu (Hourly Rate)</h2>
<p>Ketika Anda menetapkan tarif per jam, semakin cepat dan berpengalaman Anda bekerja, semakin sedikit penghasilan yang Anda dapatkan. Solusinya adalah beralih ke penetapan harga berbasis nilai (Value-Based Pricing).</p>

<h2>Tiga Langkah Menghitung Nilai Proyek</h2>
<ol>
  <li><strong>Pahami Dampak Finansial Klien:</strong> Berapa potensi omset yang akan dihasilkan klien dari hasil karya Anda?</li>
  <li><strong>Tawarkan Paket Bertingkat (Tiered Options):</strong> Berikan 3 pilihan paket dengan cakupan deliverables yang jelas.</li>
  <li><strong>Lindungi Ruang Lingkup Kerja:</strong> Buat batasan revisi dan jadwal pengerjaan yang disepakati secara tertulis.</li>
</ol>

<blockquote>Klien profesional tidak mencari opsi termurah, mereka mencari mitra yang paling dapat diandalkan untuk menyelesaikan masalah mereka.</blockquote>`,
      tags: 'Freelance, Bisnis, Pricing, Negosiasi',
      metaTitle: 'Strategi Menentukan Tarif Jasa Kreatif & Klien Premium — Blog',
      metaDescription: 'Panduan lengkap menetapkan harga jasa berbasis nilai untuk desainer, freelancer, dan pemilik agensi.',
      readTime: 4
    }
  }
];

/**
 * Build a complete blog post locally from offline template
 */
export const buildOfflineBlogPost = (templateId: string, customPrompt?: string): Partial<OfflineBlogTemplate['data']> => {
  const tmpl = OFFLINE_BLOG_TEMPLATES.find(t => t.id === templateId) || OFFLINE_BLOG_TEMPLATES[0];
  if (!tmpl || !tmpl.data) {
    return {
      title: 'Artikel Baru',
      category: 'Umum',
      slug: 'artikel-baru',
      excerpt: 'Ringkasan artikel.',
      content: '<p>Tulis konten artikel Anda di sini...</p>',
      tags: 'Umum',
      metaTitle: 'Artikel Baru',
      metaDescription: 'Deskripsi artikel baru.',
      readTime: 3
    };
  }

  const customData = JSON.parse(JSON.stringify(tmpl.data));

  if (customPrompt && customPrompt.trim().length > 3) {
    customData.title = customPrompt.trim().slice(0, 80);
    customData.slug = customPrompt.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    customData.metaTitle = `${customData.title} — Blog`;
  }

  return customData;
};

// ─────────────────────────────────────────────────────────────
// 4. OFFLINE PAGE HERO HEADER TEMPLATES (Multi-Style Presets)
// ─────────────────────────────────────────────────────────────
export interface OfflinePageHeaderPreset {
  id: string;
  pageKey: 'blog' | 'portfolio' | 'catalog' | 'about' | 'links' | 'landing';
  label: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
}

export const OFFLINE_PAGE_HEADER_TEMPLATES: OfflinePageHeaderPreset[] = [
  // ── BLOG PAGE PRESETS ──
  {
    id: 'blog_explorative',
    pageKey: 'blog',
    label: 'Eksploratif & Wawasan (Default)',
    badge: 'Jurnal & Publikasi Artikel',
    title: 'Ide, Wawasan & Catatan Eksplorasi',
    highlight: 'Catatan Eksplorasi',
    description: 'Koleksi tulisan mendalam seputar teknologi, panduan praktis, inovasi digital, serta gagasan kreatif terbaru.'
  },
  {
    id: 'blog_minimalist',
    pageKey: 'blog',
    label: 'Minimalis & Modern',
    badge: 'Wawasan & Pemikiran',
    title: 'Gagasan Kreatif & Refleksi Desain',
    highlight: 'Refleksi Desain',
    description: 'Catatan harian, cerita proses, dan perspektif seputar dunia kreatif dan industri desain modern.'
  },
  {
    id: 'blog_tech',
    pageKey: 'blog',
    label: 'Teknologi & Tutorial',
    badge: 'Pusat Belajar & Riset',
    title: 'Panduan Praktis & Inovasi Teknologi',
    highlight: 'Inovasi Teknologi',
    description: 'Kumpulan studi kasus, tips pemecahan masalah, dan tutorial terstruktur untuk meningkatkan kemampuan Anda.'
  },
  {
    id: 'blog_luxury',
    pageKey: 'blog',
    label: 'Edisi Mewah & Eksklusif',
    badge: 'Editorial & Opini Eksklusif',
    title: 'Arsip Pemikiran & Tren Industri Masa Depan',
    highlight: 'Masa Depan',
    description: 'Analisis mendalam mengenai pergerakan pasar kreatif, standar estetika global, dan inovasi bisnis.'
  },
  {
    id: 'blog_creative_notes',
    pageKey: 'blog',
    label: 'Catatan Kreator Digital',
    badge: 'Jurnal Kreatif & Cerita',
    title: 'Dibalik Layar Eksplorasi Seni & Karya',
    highlight: 'Seni & Karya',
    description: 'Catatan proses eksperimen visual, tips alur kerja produktif, dan inspirasi harian untuk kreator.'
  },

  // ── PORTFOLIO PAGE PRESETS ──
  {
    id: 'portfolio_creative',
    pageKey: 'portfolio',
    label: 'Karya Pilihan & Studi Kasus (Default)',
    badge: 'Koleksi Proyek & Desain',
    title: 'Karya Pilihan & Studi Kasus',
    highlight: 'Studi Kasus',
    description: 'Eksplorasi karya desain grafis, antarmuka visual, branding identitas, serta portofolio proyek unggulan.'
  },
  {
    id: 'portfolio_agency',
    pageKey: 'portfolio',
    label: 'Gaya Agensi & Solutif',
    badge: 'Eksibisi Karya Kreatif',
    title: 'Karya Visual Berdampak Nyata',
    highlight: 'Berdampak Nyata',
    description: 'Menampilkan dedikasi desain berkualitas tinggi yang dirancang untuk memecahkan tantangan bisnis dan brand.'
  },
  {
    id: 'portfolio_minimal',
    pageKey: 'portfolio',
    label: 'Minimalis Elegan',
    badge: 'Galeri Terpilih',
    title: 'Arsip Proyek & Eksplorasi Estetik',
    highlight: 'Eksplorasi Estetik',
    description: 'Rangkaian kreasi visual dan eksplorasi identitas merek yang dikurasi secara teliti.'
  },
  {
    id: 'portfolio_showcase_pro',
    pageKey: 'portfolio',
    label: 'Showcase Prestisius',
    badge: 'Portofolio Terverifikasi',
    title: 'Masterpiece & Transformasi Brand Global',
    highlight: 'Brand Global',
    description: 'Koleksi proyek pilihan dengan standar visual tertinggi dan dampak konversi nyata bagi klien.'
  },
  {
    id: 'portfolio_tech_craft',
    pageKey: 'portfolio',
    label: 'Digital Product & Interface',
    badge: 'UI/UX & Product Design',
    title: 'Perancangan Antarmuka Digital Masa Kini',
    highlight: 'Masa Kini',
    description: 'Solusi antarmuka aplikasi web, mobile, dan sistem desain yang intuitif dan berpusat pada pengguna.'
  },

  // ── KATALOG PAGE PRESETS ──
  {
    id: 'catalog_digital',
    pageKey: 'catalog',
    label: 'Solusi Kreatif & Layanan (Default)',
    badge: 'Katalog Produk & Layanan',
    title: 'Solusi Kreatif & Layanan Digital',
    highlight: 'Layanan Digital',
    description: 'Jelajahi berbagai paket layanan desain, produk digital, dan template siap pakai dengan harga terjangkau.'
  },
  {
    id: 'catalog_store',
    pageKey: 'catalog',
    label: 'Toko Digital & Asset',
    badge: 'Marketplace Produk Digital',
    title: 'Koleksi Aset & Template Desain',
    highlight: 'Template Desain',
    description: 'Dapatkan berbagai aset visual, template website, dan perlengkapan kreatif premium untuk kebutuhan proyek Anda.'
  },
  {
    id: 'catalog_services',
    pageKey: 'catalog',
    label: 'Jasa Profesional',
    badge: 'Paket & Jasa Desain',
    title: 'Layanan Desain Terstruktur & Cepat',
    highlight: 'Terstruktur & Cepat',
    description: 'Pilihan layanan desain profesional mulai dari branding, UI/UX, hingga packaging dengan alur kerja transparan.'
  },
  {
    id: 'catalog_enterprise_pkg',
    pageKey: 'catalog',
    label: 'Paket Korporat & Enterprise',
    badge: 'Pricelist & Paket Khusus',
    title: 'Solusi Desain Komprehensif Skala Bisnis',
    highlight: 'Skala Bisnis',
    description: 'Paket layanan intensif dengan prioritas pengerjaan, revisi fleksibel, dan pendampingan dedikasi.'
  },
  {
    id: 'catalog_starter_bundle',
    pageKey: 'catalog',
    label: 'Starter Pack UMKM',
    badge: 'Paket Usaha & Brand Baru',
    title: 'Kebutuhan Awal Identitas Bisnis Siap Pakai',
    highlight: 'Siap Pakai',
    description: 'Paket hemat berkualitas tinggi untuk UMKM yang ingin segera meluncurkan brand dengan visual memikat.'
  },

  // ── ABOUT PAGE PRESETS ──
  {
    id: 'about_career',
    pageKey: 'about',
    label: 'Perjalanan Karier & Visi (Default)',
    badge: 'Profil & Tentang Saya',
    title: 'Kreativitas, Visi & Perjalanan Karier',
    highlight: 'Perjalanan Karier',
    description: 'Kenali lebih dekat latar belakang profesional, keterampilan teknis, pencapaian, dan filosofi kerja saya.'
  },
  {
    id: 'about_story',
    pageKey: 'about',
    label: 'Personal & Kisah Dedikasi',
    badge: 'Di Balik Layar',
    title: 'Dedikasi, Passion & Filosofi Visual',
    highlight: 'Filosofi Visual',
    description: 'Cerita tentang bagaimana kecintaan pada detail dan seni visual membentuk setiap karya yang saya hasilkan.'
  },
  {
    id: 'about_studio_ethos',
    pageKey: 'about',
    label: 'Filosofi Studio & Nilai Kerja',
    badge: 'Etos & Komitmen Kualitas',
    title: 'Membangun Karya Bermakna & Berkelanjutan',
    highlight: 'Berkelanjutan',
    description: 'Prinsip desain, metodologi kerja, dan komitmen profesional yang mendasari setiap kolaborasi bersama klien.'
  },
  {
    id: 'about_executive_bio',
    pageKey: 'about',
    label: 'Biografi Eksekutif & Praktisi',
    badge: 'Pengalaman & Keahlian',
    title: 'Rekam Jejak Profesional & Kepemimpinan Desain',
    highlight: 'Kepemimpinan Desain',
    description: 'Ringkasan pengalaman memimpin proyek kreatif, pencapaian sertifikasi, dan kontribusi di industri digital.'
  },

  // ── LINKS PAGE PRESETS ──
  {
    id: 'links_hub',
    pageKey: 'links',
    label: 'Hub Tautan & Media (Default)',
    badge: 'Tautan & Kontak Resmi',
    title: 'Pusat Hubungan & Media Sosial',
    highlight: 'Media Sosial',
    description: 'Temukan saluran komunikasi resmi, portofolio eksternal, dan tautan sosial media untuk kolaborasi.'
  },
  {
    id: 'links_social_bio',
    pageKey: 'links',
    label: 'Link in Bio Minimalis',
    badge: 'Akses Cepat & Saluran Resmi',
    title: 'Terhubung Langsung di Seluruh Platform',
    highlight: 'Seluruh Platform',
    description: 'Satu halaman praktis untuk mengakses karya terbaru, kontak WhatsApp, toko online, dan media sosial.'
  },
  {
    id: 'links_vip_contact',
    pageKey: 'links',
    label: 'VIP Concierge & Kolaborasi',
    badge: 'Saluran Komunikasi Khusus',
    title: 'Kemitraan Bisnis, Media & Penawaran Proyek',
    highlight: 'Penawaran Proyek',
    description: 'Hubungi tim representasi kami untuk jadwal pertemuan, wawancara media, atau penawaran kerja sama strategis.'
  }
];


export const buildOfflinePageHeader = (pageKey: string, presetId?: string): OfflinePageHeaderPreset => {
  const matches = OFFLINE_PAGE_HEADER_TEMPLATES.filter(p => p.pageKey === pageKey);
  if (presetId) {
    const found = matches.find(p => p.id === presetId);
    if (found) return found;
  }
  return matches[0] || {
    id: `header_${pageKey}`,
    pageKey: pageKey as any,
    label: 'Standar',
    badge: 'Publikasi & Konten',
    title: 'Halaman Resmi & Informasi',
    highlight: 'Informasi',
    description: 'Informasi terlengkap seputar layanan, portofolio, dan aktivitas terbaru.'
  };
};


