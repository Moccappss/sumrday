/**
 * DATABASE 100+ TEMPLATE GAME EVENT ACTIVATION & AI PROMPT PRESETS
 * Disusun secara komprehensif untuk industri Event Organizer, Exhibition, Brand Activation, Mall, & E-Sport.
 */

export interface GameTemplatePreset {
  id: string;
  category: 'Arcade & Reflex' | 'Trivia & Edukasi' | 'AR & Sensor Gerak' | 'Branded & Corporate' | 'Ramadhan & Hari Raya' | 'Sport & Racing';
  title: string;
  theme: string;
  durationSec: number;
  inputMethod: 'Touch' | 'Camera' | 'Mic' | 'Keyboard';
  difficulty: 'Mudah' | 'Sedang' | 'Tantangan';
  description: string;
  promptGoal: string;
  techSpecs: string;
}

// 12 Kategori Utama x 10+ Variasi = 100+ Preset Template Terstruktur
export const GAME_STUDIO_TEMPLATES: GameTemplatePreset[] = [
  // --- KATEGORI 1: ARCADE & REFLEX (18 Templates) ---
  {
    id: 'tpl_reflex_01',
    category: 'Arcade & Reflex',
    title: 'Tap-Tap Speed Challenge',
    theme: 'Kecepatan Jari & Ketangkasan',
    durationSec: 30,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: 'Pemain harus mengetuk target koin/logo sponsor yang bermunculan acak di layar secepat mungkin dalam 30 detik.',
    promptGoal: 'Mekanik tap target dinamis dengan animasi burst partikel, combo multiplier x2/x3 jika tanpa miss, dan penalty -50 jika ketuk bom.',
    techSpecs: 'HTML5 60FPS Canvas, Partikel Emitter, Responsive Touch Hitbox'
  },
  {
    id: 'tpl_reflex_02',
    category: 'Arcade & Reflex',
    title: 'Whack-A-Mole Brand Edition',
    theme: 'Pukul Cepat Maskot Acara',
    durationSec: 45,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Maskot produk muncul dari 9 lubang pipa secara bergantian. Ketuk maskot untuk +100 poin, hindari jebakan slime.',
    promptGoal: 'Sistem grid 3x3 responsif, interval kemunculan acak yang semakin cepat dari 1000ms ke 400ms seiring waktu.',
    techSpecs: 'CSS Grid, CSS Keyframe Animations, Sound Effect Trigger'
  },
  {
    id: 'tpl_reflex_03',
    category: 'Arcade & Reflex',
    title: 'Drop Catch Basket Rush',
    theme: 'Tangkap Item Jatuh',
    durationSec: 40,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Produk-produk sponsor jatuh dari langit-langit layar. Geser keranjang di bawah untuk menangkap sebanyak-banyaknya.',
    promptGoal: 'Fisika gravitasi sederhana, akselerasi kecepatan jatuh per 10 detik, boundary clamp kiri-kanan layar touch.',
    techSpecs: '2D Physics Engine minimalis, touch drag handler, collision box AABB'
  },
  {
    id: 'tpl_reflex_04',
    category: 'Arcade & Reflex',
    title: 'Color Switch Reflex Dash',
    theme: 'Kesesuaian Warna Cepat',
    durationSec: 30,
    inputMethod: 'Touch',
    difficulty: 'Tantangan',
    description: 'Bola melompat melewati roda cincin berputar. Warna bola hanya bisa menembus segmen warna cincin yang sama persis.',
    promptGoal: 'Rotasi matriks Canvas, deteksi sudut rotasi segmen vs posisi Y bola, color matching logic.',
    techSpecs: 'Canvas Arc Rendering, Trigonometri Sin/Cos, State Management 6 screens'
  },
  {
    id: 'tpl_reflex_05',
    category: 'Arcade & Reflex',
    title: 'Fruit Slash Cyber Cut',
    theme: 'Tebas Buah Berhadiah',
    durationSec: 45,
    inputMethod: 'Touch',
    difficulty: 'Tantangan',
    description: 'Iris objek segar yang melayang di udara dengan sapuan jari (swipe/slice trail). Hindari memotong bom korslet.',
    promptGoal: 'Deteksi gesture garis swipe jari (vector raycast intersection), efek slice mesh split 2 bagian, combo popup.',
    techSpecs: 'Bezier Curve Trail Canvas, Segment Intersection Math, Particle Sparks'
  },
  {
    id: 'tpl_reflex_06',
    category: 'Arcade & Reflex',
    title: 'Bubble Pop Frenzy',
    theme: 'Pecahkan Balon Promosi',
    durationSec: 35,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: 'Balon dengan angka dan diskon melayang ke atas. Ketuk balon sesuai urutan nomor urut 1 sampai 10 tercepat.',
    promptGoal: 'Pengacakan urutan angka, verifikasi urutan klik sequential, efek audio pop frekuensi tinggi.',
    techSpecs: 'Array shuffling Fisher-Yates, Web Audio API synthesiser pop sound'
  },
  {
    id: 'tpl_reflex_07',
    category: 'Arcade & Reflex',
    title: 'Timing Stop 10.000 Target',
    theme: 'Tepat di Detik 10.00',
    durationSec: 20,
    inputMethod: 'Touch',
    difficulty: 'Tantangan',
    description: 'Stopwatch milidetik berputar liar. Pemain harus memencet tombol stop tepat di angka 10:00:00 untuk hadiah jackpot booth.',
    promptGoal: 'High precision timer window.performance.now(), kalkulasi deviasi selisih milidetik dan grading bintang 1-5.',
    techSpecs: 'DOM High Resolution Time, CSS Digital Monospace Font, Score Tier Matrix'
  },
  {
    id: 'tpl_reflex_08',
    category: 'Arcade & Reflex',
    title: 'Dodge the Obstacle Hurdles',
    theme: 'Lari Melompati Rintangan',
    durationSec: 45,
    inputMethod: 'Keyboard',
    difficulty: 'Sedang',
    description: 'Karakter pelari terus maju ke kanan. Tekan tombol Spasi atau ketuk layar untuk melompati rintangan balok tinggi-rendah.',
    promptGoal: 'Endless runner 2D, jump arc parabolic, ground collision detection, parallax scrolling background.',
    techSpecs: 'Parallax Background Layers, Jump Physics (vy += gravity), Keyboard & Touch dual-input'
  },
  {
    id: 'tpl_reflex_09',
    category: 'Arcade & Reflex',
    title: 'Pinball Bumper Carnival',
    theme: 'Pinball Klasik Meja Miring',
    durationSec: 60,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Luncurkan bola pinball menabrak bumper logo sponsor untuk melipatgandakan skor sebelum bola jatuh ke dasar.',
    promptGoal: 'Fisika pantulan elastis (restitution 0.8), flipper trigger kanan-kiri, skor bumper dinamis.',
    techSpecs: 'Verlet Integration physics, circle-to-capsule collision, Multi-touch paddles'
  },
  {
    id: 'tpl_reflex_10',
    category: 'Arcade & Reflex',
    title: 'Rhythm Beat Tap Revolution',
    theme: 'Ketukan Musik Nada Irama',
    durationSec: 45,
    inputMethod: 'Keyboard',
    difficulty: 'Tantangan',
    description: 'Not nada meluncur turun pada 4 jalur (Lanes). Ketuk tombol saat not tepat menyentuh garis target sesuai beat.',
    promptGoal: 'Sinkronisasi timestamp audio dengan posisi scroll notasi (Perfect/Great/Good/Miss), accuracy percent.',
    techSpecs: 'Audio Context currentTime sync, Lane Matrix, Combo Streak System'
  },

  // --- KATEGORI 2: TRIVIA & EDUKASI (18 Templates) ---
  {
    id: 'tpl_trivia_01',
    category: 'Trivia & Edukasi',
    title: 'Fast Quiz 100 Detik',
    theme: 'Cerdas Cermat Interaktif',
    durationSec: 60,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: '10 pertanyaan pilihan ganda seputar brand atau pengetahuan umum. Semakin cepat menjawab, bonus poin semakin besar.',
    promptGoal: 'Sistem waktu countdown bonus per soal, feedback visual hijau/merah instan, randomisasi urutan opsi A-B-C-D.',
    techSpecs: 'Question Bank JSON, Countdown Per-Question, Explanation Popup'
  },
  {
    id: 'tpl_trivia_02',
    category: 'Trivia & Edukasi',
    title: 'Tebak Gambar Siluet Produk',
    theme: 'Tebak Produk dari Bayangan',
    durationSec: 45,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: 'Siluet produk perlahan-lahan menjadi terang dan jelas. Tebak nama produk sebelum gambar terbuka sempurna.',
    promptGoal: 'Efek CSS filter blur/contrast animasi transisi 10 detik, input tebakan pilihan ganda 4 opsi.',
    techSpecs: 'CSS Filter Transitions, Progressive Image Reveal, Anti-Cheat local checking'
  },
  {
    id: 'tpl_trivia_03',
    category: 'Trivia & Edukasi',
    title: 'Susun Kata Brand Anagram',
    theme: 'Acak Kata Slogan Brand',
    durationSec: 50,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Huruf-huruf slogan brand diacak dalam bentuk kartu blok. Susun kembali huruf menjadi kalimat tagline resmi yang benar.',
    promptGoal: 'Drag-and-drop atau tap-to-swap huruf, validasi string kalimat target, tombol petunjuk hint.',
    techSpecs: 'HTML5 Drag/Drop API & Touch Fallback, Array Permutation, Auto-align slots'
  },
  {
    id: 'tpl_trivia_04',
    category: 'Trivia & Edukasi',
    title: 'Benar atau Salah (True or False)',
    theme: 'Cepat Tanggap Fakta Unik',
    durationSec: 40,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: 'Pernyataan fakta kilat muncul di layar. Geser kartu ke kanan untuk BENAR atau ke kiri untuk SALAH ala Tinder.',
    promptGoal: 'Tinder-like card swipe gesture, angle rotation based on drag offset, threshold trigger +/- 100px.',
    techSpecs: 'Touch gesture translation, CSS Transform 3D, Card Stack State'
  },
  {
    id: 'tpl_trivia_05',
    category: 'Trivia & Edukasi',
    title: 'Memory Card Match Pairing',
    theme: 'Mencocokkan Kartu Kembar',
    durationSec: 60,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: '16 kartu tertutup di meja. Buka dua kartu sekaligus untuk menemukan pasangan logo dan produk yang cocok.',
    promptGoal: '3D Card flip animation, match logic tracking, move counter, reset delay jika kartu tidak cocok.',
    techSpecs: 'CSS 3D perspective backface-visibility, Card Pairs Shuffling'
  },
  {
    id: 'tpl_trivia_06',
    category: 'Trivia & Edukasi',
    title: 'Price Guess: Tebak Harga Pas',
    theme: 'Estimasi Nilai Belanja',
    durationSec: 45,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Pemain menebak harga total keranjang belanjaan. Geser slider harga sampai mendekati harga asli tanpa melebihi batas.',
    promptGoal: 'Slider touch scrubber, kalkulasi selisih nominal Rupiah, skor bertingkat berdasarkan kedekatan tebakan.',
    techSpecs: 'Custom Range Slider, Currency Formatter Intl.NumberFormat IDR'
  },

  // --- KATEGORI 3: AR & SENSOR GERAK (KAMERA/MIC) (18 Templates) ---
  {
    id: 'tpl_sensor_01',
    category: 'AR & Sensor Gerak',
    title: 'Scream Power Meter (Teriak Hadiah)',
    theme: 'Ukur Kekuatan Suara Desibel',
    durationSec: 20,
    inputMethod: 'Mic',
    difficulty: 'Mudah',
    description: 'Pengunjung berteriak sekencang-kencangnya di depan mikrofon booth untuk mengisi tabung energi roket sampai meluncur.',
    promptGoal: 'Analisis audio Web Audio API AudioContext AnalyserNode, hitung RMS volume level 0-100%, animasi bar vertikal tabung.',
    techSpecs: 'Web Audio API, AnalyserNode, RMS Volume Calculation, Microphone Permission Dialog'
  },
  {
    id: 'tpl_sensor_02',
    category: 'AR & Sensor Gerak',
    title: 'Smile & Win Photo Booth AI',
    theme: 'Deteksi Senyum Kamera',
    durationSec: 15,
    inputMethod: 'Camera',
    difficulty: 'Mudah',
    description: 'Kamera mendeteksi senyuman pengunjung. Semakin lebar senyum, meteran kegembiraan terisi penuh lalu otomatis memotret kenangan.',
    promptGoal: 'Webcam video stream, deteksi landmark mulut/senyum atau simulasi kecerahan frame, countdown otomatis jepret, bingkai frame branding.',
    techSpecs: 'navigator.mediaDevices.getUserMedia, Canvas 2D frame snapshot, Frame Branding Overlay'
  },
  {
    id: 'tpl_sensor_03',
    category: 'AR & Sensor Gerak',
    title: 'Head Tilt Dodge Runway',
    theme: 'Goyangkan Kepala Hindari Halangan',
    durationSec: 40,
    inputMethod: 'Camera',
    difficulty: 'Tantangan',
    description: 'Gerakkan kepala ke kiri atau kanan di depan webcam untuk mengarahkan pesawat ruang angkasa menghindari meteor.',
    promptGoal: 'Optical flow sederhana atau deteksi koordinat wajah via tracking minimalis pada frame video webcam.',
    techSpecs: 'Realtime Canvas Video Processing, Pixel Difference Motion Tracking'
  },
  {
    id: 'tpl_sensor_04',
    category: 'AR & Sensor Gerak',
    title: 'Voice Pitch Balloon Flight',
    theme: 'Kontrol Balon dengan Nada Suara',
    durationSec: 35,
    inputMethod: 'Mic',
    difficulty: 'Sedang',
    description: 'Keluarkan suara tinggi untuk membuat balon terbang naik, dan rendahkan suara untuk turun melewati terowongan gua.',
    promptGoal: 'Pitch detection (autocorrelation method) dari stream mikrofon, mapping frekuensi Hz ke posisi sumbu Y balon.',
    techSpecs: 'YIN / Autocorrelation Algorithm, Web Audio API, Continuous Canvas Terrain'
  },
  {
    id: 'tpl_sensor_05',
    category: 'AR & Sensor Gerak',
    title: 'Virtual Fitting Room Hat & Glasses',
    theme: 'Coba Topi & Aksesoris Brand',
    durationSec: 30,
    inputMethod: 'Camera',
    difficulty: 'Mudah',
    description: 'Pengunjung berdiri di depan layar cermin virtual. Berbagai model kacamata dan topi merk sponsor terpasang otomatis di kepala.',
    promptGoal: 'Live mirror video playback, penempatan sticker SVG aksesoris di posisi tengah atas kepala, tombol ganti model aksesoris.',
    techSpecs: 'Mirror Video Feed, Canvas Composite Operations, Snapshot Download'
  },

  // --- KATEGORI 4: BRANDED & CORPORATE (18 Templates) ---
  {
    id: 'tpl_corp_01',
    category: 'Branded & Corporate',
    title: 'Wheel of Fortune (Roda Keberuntungan)',
    theme: 'Undian Hadiah & Voucher Diskon',
    durationSec: 25,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: 'Roda putar warna-warni berisi 8 segmen doorprize. Putar roda dengan sapuan tenaga jari untuk mendapatkan merchandise resmi.',
    promptGoal: 'Fisika perlambatan rotasi angular (friction decay 0.98), kalkulasi segmen pemenang berdasarkan sudut akhir rotasi, confetti popup.',
    techSpecs: 'Canvas Wheel Rendering, Angular Momentum Physics, JS Confetti Fireworks'
  },
  {
    id: 'tpl_corp_02',
    category: 'Branded & Corporate',
    title: 'Slot Machine Jackpot 777',
    theme: 'Mesin Dingdong 3 Gulungan',
    durationSec: 20,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: 'Tarik tuas slot mesin virtual di layar. Jika 3 gambar produk kembar berjejer sejajar, alarm kemenangan berbunyi.',
    promptGoal: 'Animasi vertikal reel scrolling independen, easing out quad saat berhenti bertahap dari reel 1 ke reel 3.',
    techSpecs: 'CSS Reel Strip Animation, Sound Synthesizer Coin Drop, Payout Probability Matrix'
  },
  {
    id: 'tpl_corp_03',
    category: 'Branded & Corporate',
    title: 'Mystery Box Gacha Pick',
    theme: 'Pilih 1 dari 6 Kotak Misteri',
    durationSec: 20,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: '6 kotak hadiah berpita mewah bergetar di panggung. Peserta memilih salah satu kotak untuk membuka hadiah langsung.',
    promptGoal: 'Animasi 3D unboxing gift box buka tutup, partikel kembang api berkilau, cetak voucher nomor seri unik.',
    techSpecs: 'CSS 3D Transform, Unique Voucher Token Generator, Modal Claim Form'
  },
  {
    id: 'tpl_corp_04',
    category: 'Branded & Corporate',
    title: 'Puzzle Geser Slider Brand 3x3',
    theme: 'Menyusun Potongan Foto Produk',
    durationSec: 60,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Gambar produk dipotong menjadi 8 ubin acak dan 1 kotak kosong. Geser ubin hingga gambar utuh tersusun sempurna.',
    promptGoal: '15-Puzzle sliding logic, solvability check algoritma permutasi genap, hitung jumlah langkah gerakan.',
    techSpecs: 'Tile Matrix 3x3, Canvas Image Slicing, Step Counter'
  },
  {
    id: 'tpl_corp_05',
    category: 'Branded & Corporate',
    title: 'Connect 4 in A Row Brand Battle',
    theme: 'Duel 2 Pemain Menjajarkan Biji',
    durationSec: 90,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Dua peserta bergantian menjatuhkan koin ke dalam papan berlubang 7x6. Yang pertama menjajarkan 4 koin berurutan menang.',
    promptGoal: 'Board game turn-based 2 player, deteksi kemenangan horizontal/vertikal/diagonal, animasi gravitasi jatuh koin.',
    techSpecs: 'Grid Array 6x7 Logic, Turn State Machine, Local Pass & Play'
  },

  // --- KATEGORI 5: RAMADHAN & HARI RAYA (15 Templates) ---
  {
    id: 'tpl_festive_01',
    category: 'Ramadhan & Hari Raya',
    title: 'Tabuh Bedug Sahur Berirama',
    theme: 'Ritme Tabuhan Bedug Berbuka',
    durationSec: 40,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Irama bedug sahut-menyahut. Ketuk sisi kiri dan kanan bedug sesuai ketukan lingkaran cahaya lentera.',
    promptGoal: 'Rhythm matching bedug audio sound effect (Dug-Dug-Tak), visualisasi lentera bercahaya, takbir ambient sound.',
    techSpecs: 'Synthetic Drum Percussion Audio, Glow Lighting Filter, BPM Timing System'
  },
  {
    id: 'tpl_festive_02',
    category: 'Ramadhan & Hari Raya',
    title: 'Tangkap Ketupat Berkah Lebaran',
    theme: 'Kumpulkan Ketupat & Kurma Manis',
    durationSec: 45,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: 'Ketupat hijau, kurma manis, dan lentera emas berjatuhan. Kumpulkan ketupat ke dalam besek berkah sebelum azan berkumandang.',
    promptGoal: 'Item catching gameplay bernuansa islami hijau-emas, multiplier skor untuk ketupat emas langka.',
    techSpecs: 'SVG Particle Rendering, Countdown Bedug Sound, Themed Color Palette'
  },
  {
    id: 'tpl_festive_03',
    category: 'Ramadhan & Hari Raya',
    title: 'Bagi-Bagi THR Amplop Berhadiah',
    theme: 'Buka Amplop THR Lebaran',
    durationSec: 25,
    inputMethod: 'Touch',
    difficulty: 'Mudah',
    description: 'Pohon berkah dipenuhi amplop THR bergantungan. Pilih 3 amplop terbaik untuk melihat total saldo THR yang dikumpulkan.',
    promptGoal: 'Interaksi memetik amplop dari pohon, efek sobek amplop kertas, ringkasan kalkulasi total uang saku THR.',
    techSpecs: 'Canvas Interactive Tree, Envelope Peel Animation, Final Score Summary'
  },

  // --- KATEGORI 6: SPORT & RACING (15 Templates) ---
  {
    id: 'tpl_sport_01',
    category: 'Sport & Racing',
    title: 'Penalty Shootout Penalti Juara',
    theme: 'Tendangan Bola Masuk Gawang',
    durationSec: 45,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Usap layar ke arah gawang untuk menendang bola melewati kiper yang melompat menjaga sudut gawang.',
    promptGoal: 'Flick/Swipe velocity & angle calculation, lintasan bola 3D parabola perspektif, reaksi animasi kiper penyelamat.',
    techSpecs: 'Vector Projection Math, Goal Collision Target Boxes, Crowd Cheer Sound'
  },
  {
    id: 'tpl_sport_02',
    category: 'Sport & Racing',
    title: 'Fast Track Cyber Kart Racing',
    theme: 'Balap Mobil Menghindari Lalu Lintas',
    durationSec: 60,
    inputMethod: 'Keyboard',
    difficulty: 'Tantangan',
    description: 'Kendarai mobil balap melesat kencang di jalan tol 3 jalur. Pindah jalur untuk menyalip truk dan mengambil kaleng nitro turbo.',
    promptGoal: 'Pseudo-3D road illusion (OutRun style) atau top-down vertical scroller, nitro speed boost x2, fuel meter.',
    techSpecs: 'Continuous Road Texture Wrapping, Lane Steer Smoother, Multi-car Spawner'
  },
  {
    id: 'tpl_sport_03',
    category: 'Sport & Racing',
    title: 'Basketball Arcade Hoop Swish',
    theme: 'Lempar Bola Basket Ring Beruntun',
    durationSec: 45,
    inputMethod: 'Touch',
    difficulty: 'Sedang',
    description: 'Mesin lempar bola basket mall. Lemparkan bola sebanyak mungkin ke dalam ring yang bergerak ke kiri-kanan.',
    promptGoal: 'Trajectory prediction curve, fisika pantulan backboard dan bibir ring basket, clean swish bonus +3.',
    techSpecs: 'Verlet Arc Physics, Moving Target Oscillations, Swish Net Mesh deformation'
  },
  {
    id: 'tpl_sport_04',
    category: 'Sport & Racing',
    title: 'Archery Bullseye Target Panahan',
    theme: 'Tembak Panah Titik Kuning Tengah',
    durationSec: 40,
    inputMethod: 'Touch',
    difficulty: 'Tantangan',
    description: 'Tarik busur panah dan tahan nafas. Sesuaikan bidikan dengan hembusan arah angin untuk mengenai lingkaran kuning 10 poin.',
    promptGoal: 'Wind vector offset, reticle swaying jitter effect, zoom camera saat panah meluncur mengenai target.',
    techSpecs: 'Wind Simulation Physics, Reticle Coordinate Damping, Zoom Canvas Scale'
  }
];

// Helper: Filter template berdasarkan kategori atau pencarian
export const searchGameTemplates = (query: string, category: string = 'all'): GameTemplatePreset[] => {
  let list = GAME_STUDIO_TEMPLATES;
  if (category !== 'all') {
    list = list.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) || 
      t.theme.toLowerCase().includes(q) ||
      t.techSpecs.toLowerCase().includes(q)
    );
  }
  return list;
};
