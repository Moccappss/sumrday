/**
 * Indonesian National Holidays, Joint Leaves (Cuti Bersama), & Commemorative Content Days Engine
 * 
 * Mendukung perhitungan hari libur tanggal merah dan hari-hari penting (Hari Ibu, Hari Anak, Hari Kartini, dll.)
 * dengan generator ide konten kreatif otomatis untuk perencanaan media sosial & artikel.
 */

export interface HolidayItem {
  date: string; // YYYY-MM-DD
  name: string;
  isRedDate: boolean; // Tanggal merah / Libur Nasional
  isJointLeave?: boolean; // Cuti Bersama
  category: 'national' | 'religious' | 'special_day' | 'content_day';
  contentIdeaPrompt?: string; // Prompt ide konten siap pakai
  suggestedTags?: string[];
}

// Hari-hari penting & peringatan tanggal tetap (Bulan 1-indexed: 1 = Jan, 12 = Des)
const FIXED_SPECIAL_DAYS: Array<{ month: number; day: number; name: string; isRedDate: boolean; category: 'national' | 'religious' | 'special_day' | 'content_day'; prompt: string; tags: string[] }> = [
  // Januari
  { month: 1, day: 1, name: 'Tahun Baru Masehi', isRedDate: true, category: 'national', prompt: 'Resolusi baru, tren desain/bisnis tahun ini, promo awal tahun.', tags: ['NewYear', 'Resolusi', 'SemangatBaru'] },
  { month: 1, day: 3, name: 'Hari Departemen Agama', isRedDate: false, category: 'special_day', prompt: 'Edukasi toleransi & kerukunan.', tags: ['Kemenag'] },
  { month: 1, day: 10, name: 'Hari Gerakan Satu Juta Pohon', isRedDate: false, category: 'special_day', prompt: 'Konten kepedulian lingkungan & green design.', tags: ['SatuJutaPohon', 'GoGreen'] },
  { month: 1, day: 25, name: 'Hari Gizi Nasional', isRedDate: false, category: 'special_day', prompt: 'Tips hidup sehat, nutrisi untuk produktivitas kerja/kreatif.', tags: ['HariGiziNasional', 'HidupSehat'] },

  // Februari
  { month: 2, day: 9, name: 'Hari Pers Nasional', isRedDate: false, category: 'special_day', prompt: 'Pentingnya informasi akurat & transparansi komunikasi brand.', tags: ['HariPersNasional', 'Media'] },
  { month: 2, day: 14, name: 'Hari Kasih Sayang (Valentine)', isRedDate: false, category: 'content_day', prompt: 'Apresiasi untuk klien/audiens setia, promo paket bundling cinta desain.', tags: ['ValentineDay', 'LoveYourBrand'] },
  { month: 2, day: 21, name: 'Hari Peduli Sampah Nasional', isRedDate: false, category: 'special_day', prompt: 'Sustainable branding & digital eco-friendly workflow.', tags: ['PeduliSampah'] },

  // Maret
  { month: 3, day: 8, name: 'Hari Perempuan Internasional (IWD)', isRedDate: false, category: 'content_day', prompt: 'Sorotan karya kreator perempuan, apresiasi wanita hebat di industri kreatif.', tags: ['IWD', 'WomenInDesign'] },
  { month: 3, day: 9, name: 'Hari Musik Nasional', isRedDate: false, category: 'content_day', prompt: 'Playlist fokus kerja desainer, soundtrack proses kreatif studio.', tags: ['HariMusikNasional', 'CreativeVibes'] },
  { month: 3, day: 30, name: 'Hari Film Nasional', isRedDate: false, category: 'content_day', prompt: 'Visual storytelling, sinematografi dalam video promosi brand.', tags: ['HariFilmNasional', 'Storytelling'] },

  // April
  { month: 4, day: 1, name: 'April Fools Day', isRedDate: false, category: 'content_day', prompt: 'Konten interaktif humor cerdas seputar lika-liku revisi desain.', tags: ['AprilFools', 'DesignHumor'] },
  { month: 4, day: 7, name: 'Hari Kesehatan Sedunia', isRedDate: false, category: 'special_day', prompt: 'Work-life balance untuk kreator & freelancer digital.', tags: ['WorldHealthDay', 'Ergonomic'] },
  { month: 4, day: 21, name: 'Hari Kartini', isRedDate: false, category: 'content_day', prompt: 'Emansipasi, kepemimpinan wanita, kisah inspiratif founder.', tags: ['HariKartini', 'HabisGelapTerbitlahTerang'] },
  { month: 4, day: 22, name: 'Hari Bumi (Earth Day)', isRedDate: false, category: 'content_day', prompt: 'Konsep sustainable design, kampanye hemat energi digital.', tags: ['EarthDay', 'HariBumi'] },
  { month: 4, day: 28, name: 'Hari Puisi Nasional', isRedDate: false, category: 'special_day', prompt: 'Copywriting puitis, tipografi artistik berkarakter.', tags: ['HariPuisi'] },

  // Mei
  { month: 5, day: 1, name: 'Hari Buruh Internasional (May Day)', isRedDate: true, category: 'national', prompt: 'Apresiasi kerja keras tim, tips produktivitas & hak kreator.', tags: ['MayDay', 'HariBuruh'] },
  { month: 5, day: 2, name: 'Hari Pendidikan Nasional (Hardiknas)', isRedDate: false, category: 'content_day', prompt: 'Tutorial gratis, edukasi proses desain, tips belajar skill baru.', tags: ['Hardiknas', 'EdukasiKreatif'] },
  { month: 5, day: 20, name: 'Hari Kebangkitan Nasional (Harkitnas)', isRedDate: false, category: 'special_day', prompt: 'Semangat kolaborasi brand lokal & kemajuan UMKM Indonesia.', tags: ['Harkitnas', 'BanggaBuatanIndonesia'] },

  // Juni
  { month: 6, day: 1, name: 'Hari Lahir Pancasila', isRedDate: true, category: 'national', prompt: 'Persatuan dalam keberagaman visual & budaya Nusantara.', tags: ['HariLahirPancasila', 'Pancasila'] },
  { month: 6, day: 5, name: 'Hari Lingkungan Hidup Sedunia', isRedDate: false, category: 'special_day', prompt: 'Desain ramah lingkungan, pengurangan jejak karbon digital.', tags: ['WorldEnvironmentDay'] },
  { month: 6, day: 21, name: 'Hari Krida Pertanian / Musik Sedunia', isRedDate: false, category: 'special_day', prompt: 'Kreativitas tanpa batas.', tags: ['MakeMusicDay'] },

  // Juli
  { month: 7, day: 17, name: 'Hari Emoji Sedunia', isRedDate: false, category: 'content_day', prompt: 'Games tebak brand via emoji, konten fun interaktif di medsos.', tags: ['WorldEmojiDay', 'EmojiQuiz'] },
  { month: 7, day: 23, name: 'Hari Anak Nasional', isRedDate: false, category: 'content_day', prompt: 'Desain ramah anak, edukasi visual generasi masa depan.', tags: ['HariAnakNasional', 'AnakIndonesia'] },

  // Agustus
  { month: 8, day: 10, name: 'Hari Veteran Nasional / Hari Kebangkitan Teknologi', isRedDate: false, category: 'special_day', prompt: 'Evolusi teknologi desain, software modern vs era manual.', tags: ['Harteknas', 'Teknologi'] },
  { month: 8, day: 17, name: 'Hari Kemerdekaan RI (HUT RI)', isRedDate: true, category: 'national', prompt: 'Promo Kemerdekaan, parade portofolio karya lokal, semangat 45.', tags: ['HUTRI', '17Agustus', 'Merdeka'] },
  { month: 8, day: 19, name: 'Hari Fotografi Sedunia', isRedDate: false, category: 'content_day', prompt: 'Behind the scene foto produk, showcase visual aset berkualitas.', tags: ['WorldPhotographyDay', 'VisualAsset'] },

  // September
  { month: 9, day: 4, name: 'Hari Pelanggan Nasional (Harpelnas)', isRedDate: false, category: 'content_day', prompt: 'Ucapan terima kasih spesial ke seluruh klien, promo loyalitas.', tags: ['HariPelangganNasional', 'CustomerFirst'] },
  { month: 9, day: 9, name: 'Hari Olahraga Nasional', isRedDate: false, category: 'special_day', prompt: 'Semangat sportivitas, mental tangguh menyelesaikan deadline.', tags: ['Haornas'] },
  { month: 9, day: 27, name: 'Hari Pos & Telekomunikasi / Pariwisata Sedunia', isRedDate: false, category: 'special_day', prompt: 'Kemudahan koneksi online studio tanpa batas lokasi.', tags: ['WorldTourismDay'] },

  // Oktober
  { month: 10, day: 1, name: 'Hari Kesaktian Pancasila', isRedDate: false, category: 'special_day', prompt: 'Menjaga integritas & nilai luhur dalam berkarya.', tags: ['KesaktianPancasila'] },
  { month: 10, day: 2, name: 'Hari Batik Nasional', isRedDate: false, category: 'content_day', prompt: 'Eksplorasi motif batik dalam grafis modern & branding lokal.', tags: ['HariBatikNasional', 'BatikIndonesia'] },
  { month: 10, day: 24, name: 'Hari Dokter Indonesia / PBB', isRedDate: false, category: 'special_day', prompt: 'Apresiasi tenaga kesehatan.', tags: ['HariDokter'] },
  { month: 10, day: 28, name: 'Hari Sumpah Pemuda', isRedDate: false, category: 'content_day', prompt: 'Karya anak muda, inovasi kreatif generasi penerus bangsa.', tags: ['SumpahPemuda', 'KreatorMuda'] },
  { month: 10, day: 31, name: 'Halloween Day', isRedDate: false, category: 'content_day', prompt: 'Tema visual gelap/spooky, konten cerita horor revisi desain.', tags: ['Halloween', 'SpookySeason'] },

  // November
  { month: 11, day: 10, name: 'Hari Pahlawan', isRedDate: false, category: 'content_day', prompt: 'Siapa pahlawan di balik kesuksesan brand Anda? Tribute penuh makna.', tags: ['HariPahlawan', 'PejuangKreatif'] },
  { month: 11, day: 12, name: 'Hari Ayah Nasional', isRedDate: false, category: 'content_day', prompt: 'Peran ayah sebagai inspirasi, konten apresiasi keluarga.', tags: ['HariAyahNasional', 'PahlawanKeluarga'] },
  { month: 11, day: 25, name: 'Hari Guru Nasional', isRedDate: false, category: 'content_day', prompt: 'Mentor terbaik dalam karir Anda, terima kasih guru & pendidik.', tags: ['HariGuruNasional', 'TerimaKasihGuru'] },

  // Desember
  { month: 12, day: 12, name: 'Hari Belanja Online Nasional (Harbolnas 12.12)', isRedDate: false, category: 'content_day', prompt: 'Flash sale akhir tahun, diskon jasa desain & template eksklusif.', tags: ['Harbolnas1212', 'MegaSale'] },
  { month: 12, day: 22, name: 'Hari Ibu Nasional', isRedDate: false, category: 'content_day', prompt: 'Kasih ibu sepanjang masa, konten emosional penuh kehangatan.', tags: ['HariIbu', 'MotherDay', 'TerimaKasihIbu'] },
  { month: 12, day: 25, name: 'Hari Raya Natal', isRedDate: true, category: 'religious', prompt: 'Ucapan damai Natal, tema visual festive musim liburan.', tags: ['MerryChristmas', 'Natal', 'HolidaySeason'] },
  { month: 12, day: 31, name: 'Malam Tahun Baru (New Year Eve)', isRedDate: false, category: 'content_day', prompt: 'Kilap balik pencapaian setahun (Year in Review), countdown 2027.', tags: ['NewYearsEve', 'YearInReview'] }
];

// Tabel Libur Nasional & Keagamaan Bergerak per Tahun (2024 - 2030)
const DYNAMIC_HOLIDAYS_TABLE: Record<number, Array<{ date: string; name: string; isRedDate: boolean; isJointLeave?: boolean; category: 'national' | 'religious'; prompt: string; tags: string[] }>> = {
  2024: [
    { date: '2024-02-08', name: 'Isra Mikraj Nabi Muhammad SAW', isRedDate: true, category: 'religious', prompt: 'Refleksi spiritual & kedamaian.', tags: ['IsraMikraj'] },
    { date: '2024-02-10', name: 'Tahun Baru Imlek 2575 Kongzili', isRedDate: true, category: 'national', prompt: 'Gong Xi Fa Cai, visual tema naga emas & hoki bisnis.', tags: ['Imlek2024', 'LunarNewYear'] },
    { date: '2024-03-11', name: 'Hari Suci Nyepi Tahun Baru Saka 1946', isRedDate: true, category: 'religious', prompt: 'Keheningan, introspeksi diri & jeda sejenak dari kesibukan.', tags: ['Nyepi'] },
    { date: '2024-03-29', name: 'Wafat Yesus Kristus (Jumat Agung)', isRedDate: true, category: 'religious', prompt: 'Kedamaian & refleksi Jumat Agung.', tags: ['JumatAgung'] },
    { date: '2024-04-10', name: 'Hari Raya Idul Fitri 1445 H (Hari ke-1)', isRedDate: true, category: 'religious', prompt: 'Selamat Idul Fitri, mohon maaf lahir dan batin.', tags: ['IdulFitri', 'Lebaran'] },
    { date: '2024-04-11', name: 'Hari Raya Idul Fitri 1445 H (Hari ke-2)', isRedDate: true, category: 'religious', prompt: 'Momen silaturahmi keluarga & kebersamaan.', tags: ['Lebaran2024'] },
    { date: '2024-05-09', name: 'Kenaikan Yesus Kristus', isRedDate: true, category: 'religious', prompt: 'Damai sejahtera bagi sesama.', tags: ['KenaikanYesusKristus'] },
    { date: '2024-05-23', name: 'Hari Raya Waisak 2568 BE', isRedDate: true, category: 'religious', prompt: 'Pesan cinta kasih & kedamaian universal.', tags: ['Waisak'] },
    { date: '2024-06-17', name: 'Hari Raya Idul Adha 1445 H', isRedDate: true, category: 'religious', prompt: 'Semangat berbagi & pengorbanan.', tags: ['IdulAdha', 'Kurban'] },
    { date: '2024-07-07', name: 'Tahun Baru Islam 1446 H', isRedDate: true, category: 'religious', prompt: 'Hijrah menuju perbaikan diri & karya lebih bermakna.', tags: ['TahunBaruIslam', '1Muharram'] },
    { date: '2024-09-16', name: 'Maulid Nabi Muhammad SAW', isRedDate: true, category: 'religious', prompt: 'Meneladani akhlak mulia dalam profesionalisme.', tags: ['MaulidNabi'] }
  ],
  2025: [
    { date: '2025-01-27', name: 'Isra Mikraj Nabi Muhammad SAW', isRedDate: true, category: 'religious', prompt: 'Refleksi spiritual perjalanan mulia.', tags: ['IsraMikraj'] },
    { date: '2025-01-29', name: 'Tahun Baru Imlek 2576 Kongzili', isRedDate: true, category: 'national', prompt: 'Keberuntungan, kemakmuran & energi baru.', tags: ['Imlek2025', 'LunarNewYear'] },
    { date: '2025-03-29', name: 'Hari Suci Nyepi Saka 1947', isRedDate: true, category: 'religious', prompt: 'Menenangkan pikiran untuk kreativitas lebih jernih.', tags: ['Nyepi'] },
    { date: '2025-03-31', name: 'Hari Raya Idul Fitri 1446 H (Hari ke-1)', isRedDate: true, category: 'religious', prompt: 'Taqabbalallahu minna wa minkum, salam hangat studio.', tags: ['IdulFitri2025', 'Lebaran'] },
    { date: '2025-04-01', name: 'Hari Raya Idul Fitri 1446 H (Hari ke-2)', isRedDate: true, category: 'religious', prompt: 'Momen kebersamaan & maaf-memaafkan.', tags: ['IdulFitri'] },
    { date: '2025-04-18', name: 'Wafat Yesus Kristus (Jumat Agung)', isRedDate: true, category: 'religious', prompt: 'Kedamaian Jumat Agung.', tags: ['JumatAgung'] },
    { date: '2025-05-12', name: 'Hari Raya Waisak 2569 BE', isRedDate: true, category: 'religious', prompt: 'Semoga semua makhluk berbahagia.', tags: ['Waisak2025'] },
    { date: '2025-05-29', name: 'Kenaikan Yesus Kristus', isRedDate: true, category: 'religious', prompt: 'Kasih dan kedamaian.', tags: ['KenaikanYesusKristus'] },
    { date: '2025-06-06', name: 'Hari Raya Idul Adha 1446 H', isRedDate: true, category: 'religious', prompt: 'Nilai keikhlasan & kepedulian sosial.', tags: ['IdulAdha'] },
    { date: '2025-06-27', name: 'Tahun Baru Islam 1447 H', isRedDate: true, category: 'religious', prompt: 'Langkah baru dengan tujuan lebih berkah.', tags: ['TahunBaruIslam'] },
    { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', isRedDate: true, category: 'religious', prompt: 'Kebaikan dan keteladanan.', tags: ['MaulidNabi'] }
  ],
  2026: [
    { date: '2026-01-16', name: 'Isra Mikraj Nabi Muhammad SAW', isRedDate: true, category: 'religious', prompt: 'Refleksi perjalanan spiritual.', tags: ['IsraMikraj'] },
    { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili (Tahun Kuda)', isRedDate: true, category: 'national', prompt: 'Semangat lincah & keberanian tahun kuda, strategi bisnis baru.', tags: ['Imlek2026', 'YearOfHorse'] },
    { date: '2026-03-19', name: 'Hari Suci Nyepi Saka 1948', isRedDate: true, category: 'religious', prompt: 'Penyucian diri & harmoni alam semesta.', tags: ['Nyepi2026'] },
    { date: '2026-03-20', name: 'Hari Raya Idul Fitri 1447 H (Hari ke-1)', isRedDate: true, category: 'religious', prompt: 'Kemenangan suci Idul Fitri, promo paket hampers & desain.', tags: ['IdulFitri2026', 'Lebaran'] },
    { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 H (Hari ke-2)', isRedDate: true, category: 'religious', prompt: 'Saling memaafkan & mempererat silaturahmi.', tags: ['Lebaran2026'] },
    { date: '2026-04-03', name: 'Wafat Yesus Kristus (Jumat Agung)', isRedDate: true, category: 'religious', prompt: 'Kasih dan pengorbanan.', tags: ['JumatAgung'] },
    { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', isRedDate: true, category: 'religious', prompt: 'Harapan dan terang.', tags: ['KenaikanYesusKristus'] },
    { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', isRedDate: true, category: 'religious', prompt: 'Kebijaksanaan & kedamaian batin.', tags: ['Waisak2026'] },
    { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 H', isRedDate: true, category: 'religious', prompt: 'Kebersamaan dalam kurban & berbagi.', tags: ['IdulAdha2026'] },
    { date: '2026-06-16', name: 'Tahun Baru Islam 1448 H', isRedDate: true, category: 'religious', prompt: 'Awal yang baik untuk resolusi islami.', tags: ['TahunBaruIslam'] },
    { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', isRedDate: true, category: 'religious', prompt: 'Cahaya kebaikan dan teladan agung.', tags: ['MaulidNabi'] }
  ],
  2027: [
    { date: '2027-02-06', name: 'Tahun Baru Imlek 2578 Kongzili', isRedDate: true, category: 'national', prompt: 'Keberuntungan dan kemakmuran.', tags: ['Imlek2027'] },
    { date: '2027-03-10', name: 'Hari Raya Idul Fitri 1448 H', isRedDate: true, category: 'religious', prompt: 'Sucikan hati di hari raya fitri.', tags: ['IdulFitri2027'] },
    { date: '2027-03-26', name: 'Wafat Yesus Kristus', isRedDate: true, category: 'religious', prompt: 'Jumat Agung penuh damai.', tags: ['JumatAgung'] },
    { date: '2027-05-17', name: 'Hari Raya Idul Adha 1448 H', isRedDate: true, category: 'religious', prompt: 'Indahnya berbagi.', tags: ['IdulAdha2027'] }
  ]
};

// Cache memory runtime untuk dynamic holidays
const customHolidaysCache: Record<number, HolidayItem[]> = {};

/**
 * Load cached holidays from storage
 */
export const loadCachedHolidays = (year: number) => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(`porto_cached_holidays_${year}`) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        customHolidaysCache[year] = parsed;
      }
    }
  } catch (e) {}
};

/**
 * Sync holidays live from online government/community public API with CORS fallbacks
 */
export const syncOnlineHolidays = async (year: number): Promise<{ success: boolean; count: number; message: string }> => {
  const tryEndpoints = [
    // 1. Nager Date API (CORS-friendly public API for Indonesian holidays)
    async () => {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Empty');
      return data.map((item: any) => ({
        date: item.date,
        name: item.localName || item.name || 'Hari Libur Nasional',
        isRedDate: true,
        isJointLeave: false,
        category: 'national' as const,
        contentIdeaPrompt: `Konten seputar momen ${item.localName || item.name}`,
        suggestedTags: ['LiburNasional', 'HariLibur']
      }));
    },
    // 2. api-harilibur
    async () => {
      const res = await fetch(`https://api-harilibur.vercel.app/api?year=${year}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Empty');
      return data.map((item: any) => {
        const isJoint = item.is_cuti_bersama || (item.keterangan && item.keterangan.toLowerCase().includes('cuti bersama'));
        return {
          date: item.holiday_date || item.date || item.tanggal,
          name: item.holiday_name || item.keterangan || item.name || 'Hari Libur Nasional',
          isRedDate: !isJoint,
          isJointLeave: isJoint,
          category: (isJoint ? 'special_day' : 'national') as any,
          contentIdeaPrompt: `Konten seputar momen ${item.holiday_name || item.keterangan}`,
          suggestedTags: ['LiburNasional', 'HariLibur']
        };
      });
    },
    // 3. CORS proxy for dayoffapi
    async () => {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://dayoffapi.vercel.app/api?year=${year}`)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Empty');
      return data.map((item: any) => {
        const isJoint = item.is_joint_leave || item.is_cuti_bersama || (item.keterangan && item.keterangan.toLowerCase().includes('cuti bersama'));
        return {
          date: item.tanggal || item.date,
          name: item.keterangan || item.name || 'Hari Libur Nasional',
          isRedDate: !isJoint,
          isJointLeave: isJoint,
          category: (isJoint ? 'special_day' : 'national') as any,
          contentIdeaPrompt: `Konten seputar momen ${item.keterangan || 'hari libur'}`,
          suggestedTags: ['LiburNasional', 'HariLibur']
        };
      });
    }
  ];

  let mapped: HolidayItem[] = [];

  for (const fn of tryEndpoints) {
    try {
      mapped = await fn();
      if (mapped.length > 0) break;
    } catch {
      // Continue to next endpoint quietly without breaking
    }
  }

  // If online sources failed or blocked by CORS, use built-in official dynamic table
  if (mapped.length === 0) {
    const localDynamic = DYNAMIC_HOLIDAYS_TABLE[year] || [];
    if (localDynamic.length > 0) {
      mapped = localDynamic.map(dh => ({
        date: dh.date,
        name: dh.name,
        isRedDate: dh.isRedDate,
        isJointLeave: dh.isJointLeave,
        category: dh.category,
        contentIdeaPrompt: dh.prompt,
        suggestedTags: dh.tags
      }));
    }
  }

  if (mapped.length > 0) {
    customHolidaysCache[year] = mapped;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`porto_cached_holidays_${year}`, JSON.stringify(mapped));
        localStorage.setItem(`porto_cached_holidays_ts_${year}`, Date.now().toString());
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('porto_holidays_updated', { detail: { year, count: mapped.length } }));
    }
    return { success: true, count: mapped.length, message: `Kalender hari libur nasional tahun ${year} aktif (${mapped.length} hari libur).` };
  }

  return { success: false, count: 0, message: 'Data hari libur tidak tersedia.' };
};

/**
 * Auto-sync holidays in background if cache is older than 24 hours (or not yet synced)
 */
export const autoSyncHolidaysIfNeeded = async (year: number) => {
  if (typeof window === 'undefined') return;
  try {
    const lastSync = localStorage.getItem(`porto_cached_holidays_ts_${year}`);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (!lastSync || (now - parseInt(lastSync, 10)) > oneDay) {
      await syncOnlineHolidays(year);
    }
  } catch (e) {}
};

/**
 * Mengambil daftar seluruh hari libur dan hari penting untuk tahun dan bulan tertentu (0-indexed month: 0 = Jan, 11 = Des)
 */
export const getHolidaysForMonth = (year: number, monthIndex: number): HolidayItem[] => {
  loadCachedHolidays(year);
  const monthNum = monthIndex + 1; // 1-12
  const results: HolidayItem[] = [];
  const seenDates = new Set<string>();

  // 1. Ambil dari Fixed Special Days
  FIXED_SPECIAL_DAYS.forEach(fd => {
    if (fd.month === monthNum) {
      const dateStr = `${year}-${String(fd.month).padStart(2, '0')}-${String(fd.day).padStart(2, '0')}`;
      results.push({
        date: dateStr,
        name: fd.name,
        isRedDate: fd.isRedDate,
        category: fd.category,
        contentIdeaPrompt: fd.prompt,
        suggestedTags: fd.tags
      });
      seenDates.add(dateStr);
    }
  });

  // 2. Ambil dari Online Cache jika ada
  const cachedList = customHolidaysCache[year] || [];
  if (cachedList.length > 0) {
    cachedList.forEach(ch => {
      const parts = ch.date.split('-');
      const hMonth = parseInt(parts[1], 10);
      if (hMonth === monthNum) {
        results.push(ch);
      }
    });
  } else {
    // 3. Fallback ke Dynamic Holidays Table lokal untuk tahun tersebut
    const dynamicList = DYNAMIC_HOLIDAYS_TABLE[year] || [];
    dynamicList.forEach(dh => {
      const parts = dh.date.split('-');
      const hMonth = parseInt(parts[1], 10);
      if (hMonth === monthNum) {
        results.push({
          date: dh.date,
          name: dh.name,
          isRedDate: dh.isRedDate,
          isJointLeave: dh.isJointLeave,
          category: dh.category,
          contentIdeaPrompt: dh.prompt,
          suggestedTags: dh.tags
        });
      }
    });
  }

  // Urutkan berdasarkan tanggal
  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
};

/**
 * Cek apakah tanggal tertentu adalah hari libur / hari penting
 */
export const getHolidaysForDate = (dateStr: string): HolidayItem[] => {
  if (!dateStr) return [];
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthHolidays = getHolidaysForMonth(year, monthIndex);
  return monthHolidays.filter(h => h.date === dateStr);
};
