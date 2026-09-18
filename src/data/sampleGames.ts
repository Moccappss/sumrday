import { GameInstance } from '../types/gameLicense';

export const SAMPLE_GAMES: Partial<GameInstance>[] = [
  {
    id: 'game_spin_wheel_01',
    title: 'Spin Wheel Berhadiah Event',
    slug: 'spin-wheel-berhadiah',
    description: 'Game roda putar interaktif untuk pameran, mal, & booth aktivasi. Menghadirkan animasi ketegangan putaran realistik, suara jarum klik 60 FPS, dan hasil kupon hadiah kustom untuk pengunjung.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    previewVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-animation-of-futuristic-circuits-32789-large.mp4',
    engineType: 'HTML5 Single File (Event Activation)',
    category: 'Exhibition',
    tags: ['Interactive', 'Doorprise', 'Corporate', 'Mall Activation'],
    pricingTier: 'basic',
    eventSpecs: {
      estimatedDuration: '15 - 30 Detik / Pemain',
      leaderboardCapacity: 'Top 20 Pemenang Hadiah',
      deviceSupport: 'Touchscreen Kiosk Tablet (iPad/Android) & Layar Vertikal'
    },
    defaultConfig: {
      themeColor: '#7c3aed',
      title: 'Spin Wheel Berhadiah'
    },
    isActive: true
  },
  {
    id: 'game_catch_coin_02',
    title: 'Catch The Coin (Tangkap Koin Brand)',
    slug: 'catch-the-coin',
    description: 'Game arkade adiktif refleks sentuh 30 detik! Pemain mengendalikan maskot brand untuk menangkap koin emas dan produk brand yang jatuh sambil menghindari bom rintangan.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    previewVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-digital-grid-loop-32943-large.mp4',
    engineType: 'HTML5 Single File (Event Activation)',
    category: 'E-Sport',
    tags: ['E-Sport', 'Arcade', 'Refleks', 'High Traffic'],
    pricingTier: 'plus',
    eventSpecs: {
      estimatedDuration: '45 Detik / Sesi Game',
      leaderboardCapacity: 'Top 50 Skor Harian',
      deviceSupport: 'Kiosk Sentuh Besar 32-55 Inch & Smartphone'
    },
    defaultConfig: {
      themeColor: '#eab308',
      title: 'Catch The Coin'
    },
    isActive: true
  },
  {
    id: 'game_tangkas_kuis_03',
    title: 'Tangkas Kuis Cepat Interaktif',
    slug: 'tangkas-kuis-interaktif',
    description: 'Kuis trivia edukasi brand dengan timer hitung mundur 10 detik per soal. Pertanyaan seputar produk klien, pengetahuan umum, dan promo event untuk menguji ketangkasan pengunjung.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80',
    previewVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-31913-large.mp4',
    engineType: 'HTML5 Single File (Event Activation)',
    category: 'Corporate',
    tags: ['Corporate', 'Trivia', 'Edukasi Brand', 'Seminar'],
    pricingTier: 'basic',
    eventSpecs: {
      estimatedDuration: '60 Detik (5 Soal Kilat)',
      leaderboardCapacity: 'Top 100 Skor Peserta',
      deviceSupport: 'Tablet Kiosk, Laptop Booth & QR Mobile'
    },
    defaultConfig: {
      themeColor: '#3b82f6',
      title: 'Tangkas Kuis Interaktif'
    },
    isActive: true
  },
  {
    id: 'game_photo_booth_04',
    title: 'Virtual Photobooth Frame & AR Stamp',
    slug: 'virtual-photobooth-frame',
    description: 'Aplikasi web booth foto otomatis langsung dari kamera kiosk/tablet! Pasang frame eksklusif sponsor acara, stempel AR stiker lucu, dan generate QR Code instan untuk download foto ke HP pengunjung.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    previewVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-lens-of-a-camera-with-reflections-34538-large.mp4',
    engineType: 'HTML5 Single File (Event Activation)',
    category: 'Festival',
    tags: ['Festival', 'Photobooth', 'Social Share', 'Viral Event'],
    pricingTier: 'premium',
    eventSpecs: {
      estimatedDuration: '30 Detik / Foto & QR Download',
      leaderboardCapacity: 'Galeri Foto Cloud Unlimited',
      deviceSupport: 'Tablet Berkamera Depan, Webcam Kiosk & Monitor TV'
    },
    defaultConfig: {
      themeColor: '#ec4899',
      title: 'Virtual Photobooth Frame'
    },
    isActive: true
  },
  {
    id: 'game_ramadhan_ketupat_05',
    title: 'Ramadhan Ketupat Runner',
    slug: 'ramadhan-ketupat-runner',
    description: 'Game bertema spesial festival hari raya Ramadhan & Idul Fitri. Pemain mengumpulkan bedug dan ketupat berkah sambil melompati rintangan lentera dalam suasana malam takbiran.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&auto=format&fit=crop&q=80',
    previewVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-glowing-digital-stars-in-the-night-sky-34579-large.mp4',
    engineType: 'HTML5 Single File (Event Activation)',
    category: 'Seasonal',
    tags: ['Ramadhan', 'Seasonal', 'Endless Runner', 'Family Fun'],
    pricingTier: 'plus',
    eventSpecs: {
      estimatedDuration: '30 - 60 Detik / Pemain',
      leaderboardCapacity: 'Top 30 Skor Takbiran',
      deviceSupport: 'Semua Layar Sentuh & Smartphone'
    },
    defaultConfig: {
      themeColor: '#10b981',
      title: 'Ramadhan Ketupat Runner'
    },
    isActive: true
  },
  {
    id: 'app_calculator_simulator_06',
    title: 'Kalkulator & Simulator ROI Interaktif',
    slug: 'simulator-roi-interaktif',
    appType: 'calculator',
    description: 'Aplikasi web interaktif utilitas bisnis & activation booth. Pengunjung dapat menggeser kalkulator parameter investasi/budget, melihat kalkulasi keuntungan live, dan langsung diarahkan ke tombol CTA klien.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    previewVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-charts-31913-large.mp4',
    engineType: 'Interactive Web Application (Calculator & Lead-Gen)',
    category: 'Web App / Utilitas',
    tags: ['Web App', 'Calculator', 'Lead Gen', 'B2B Sales', 'Interactive'],
    pricingTier: 'premium',
    eventSpecs: {
      estimatedDuration: '1 - 2 Menit / Pengunjung',
      leaderboardCapacity: 'Database Lead / Email Klien',
      deviceSupport: 'Tablet Kiosk, Layar Sentuh Booth, & QR Mobile'
    },
    defaultConfig: {
      themeColor: '#0284c7',
      title: 'Simulator ROI & Kalkulator Bisnis',
      brandName: 'Brand Enterprise',
      ctaText: 'Konsultasi Gratis Sekarang',
      ctaUrl: 'https://wa.me/'
    },
    isActive: true
  }
];
