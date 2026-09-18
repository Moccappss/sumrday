import type { FormSchema } from './formTypes';

export interface FormTemplateItem {
  id: string;
  category: 'business' | 'survey' | 'hr' | 'education' | 'creative' | 'order';
  categoryLabel: string;
  title: string;
  description: string;
  themeColor: string;
  questionCount: number;
  schema: Omit<FormSchema, 'id' | 'createdAt' | 'updatedAt'>;
}

export const FORM_CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'business', label: 'Bisnis & Klien' },
  { id: 'survey', label: 'Survei & Riset' },
  { id: 'hr', label: 'HR & Tim' },
  { id: 'education', label: 'Edukasi & Event' },
  { id: 'creative', label: 'Kreatif & Media' },
  { id: 'order', label: 'Order & Transaksi' }
] as const;

export const OFFLINE_FORM_TEMPLATES: FormTemplateItem[] = [
  // ── BISNIS & KLIEN ──
  {
    id: 'tmpl_client_brief',
    category: 'business',
    categoryLabel: 'Bisnis & Klien',
    title: 'Pendaftaran Klien & Brief Proyek',
    description: 'Kuesioner lengkap untuk calon klien baru: kontak, rincian proyek, anggaran, dan target penyelesaian.',
    themeColor: '#673ab7',
    questionCount: 6,
    schema: {
      title: 'Pendaftaran Klien & Brief Proyek',
      description: 'Silakan lengkapi formulir di bawah ini agar tim kami dapat memahami kebutuhan proyek dan jadwal Anda.',
      themeColor: '#673ab7',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Lengkap / PIC Proyek',
          required: true,
          options: [],
          page: 1
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Nama Perusahaan / Brand',
          required: false,
          options: [],
          page: 1
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Jenis Layanan yang Dibutuhkan',
          required: true,
          options: [
            { id: 'o1', text: 'Desain Identitas Brand & Logo' },
            { id: 'o2', text: 'Pembuatan Website / Landing Page' },
            { id: 'o3', text: 'Pengembangan Aplikasi Web' },
            { id: 'o4', text: 'Manajemen Konten Media Sosial' }
          ],
          page: 1
        },
        {
          id: 'q4',
          type: 'dropdown',
          title: 'Estimasi Anggaran Proyek',
          required: true,
          options: [
            { id: 'o1', text: 'Di bawah Rp 5.000.000' },
            { id: 'o2', text: 'Rp 5.000.000 - Rp 15.000.000' },
            { id: 'o3', text: 'Rp 15.000.000 - Rp 30.000.000' },
            { id: 'o4', text: 'Lebih dari Rp 30.000.000' }
          ],
          page: 2
        },
        {
          id: 'q5',
          type: 'paragraph',
          title: 'Jelaskan Secara Singkat Kebutuhan dan Tujuan Proyek',
          required: true,
          options: [],
          page: 2
        },
        {
          id: 'q6',
          type: 'date',
          title: 'Target Tanggal Peluncuran / Deadline',
          required: false,
          options: [],
          page: 2
        }
      ]
    }
  },
  {
    id: 'tmpl_rfp_quote',
    category: 'business',
    categoryLabel: 'Bisnis & Klien',
    title: 'Permintaan Penawaran Harga (RFP)',
    description: 'Formulir permohonan proposal teknis dan biaya bagi mitra kerja dan klien enterprise.',
    themeColor: '#0284c7',
    questionCount: 5,
    schema: {
      title: 'Permintaan Penawaran Harga (RFP)',
      description: 'Formulir resmi permohonan penawaran harga dan spesifikasi teknis pengerjaan proyek.',
      themeColor: '#0284c7',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Perusahaan Pemohon',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Email Bisnis & Nomor WhatsApp Resmi',
          required: true,
          options: []
        },
        {
          id: 'q3',
          type: 'checkboxes',
          title: 'Ruang Lingkup Pekerjaan (Scope of Work)',
          required: true,
          options: [
            { id: 'o1', text: 'UI/UX Research & Prototype' },
            { id: 'o2', text: 'Frontend & Backend Development' },
            { id: 'o3', text: 'Integrasi Payment Gateway' },
            { id: 'o4', text: 'Maintenance & Dukungan Server Bulanan' }
          ]
        },
        {
          id: 'q4',
          type: 'dropdown',
          title: 'Jangka Waktu Penyelesaian',
          required: true,
          options: [
            { id: 'o1', text: '1 - 2 Minggu (Express)' },
            { id: 'o2', text: '1 Bulan' },
            { id: 'o3', text: '2 - 3 Bulan' },
            { id: 'o4', text: 'Lebih dari 3 Bulan' }
          ]
        },
        {
          id: 'q5',
          type: 'paragraph',
          title: 'Kebutuhan Spesifikasi Khusus / Keterangan Tambahan',
          required: false,
          options: []
        }
      ]
    }
  },
  {
    id: 'tmpl_client_onboarding',
    category: 'business',
    categoryLabel: 'Bisnis & Klien',
    title: 'Onboarding Klien Baru Studio',
    description: 'Pengumpulan aset logo, akses akun hosting, pedoman warna, dan kontak tim inti klien.',
    themeColor: '#059669',
    questionCount: 5,
    schema: {
      title: 'Formulir Onboarding Klien Baru',
      description: 'Selamat bergabung! Formulir ini memandu tim kami mengumpulkan materi dan kredensial yang dibutuhkan untuk memulai pengerjaan.',
      themeColor: '#059669',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Brand / Domain Website',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Tautan Google Drive / Dropbox Aset Logo & Foto',
          required: true,
          options: []
        },
        {
          id: 'q3',
          type: 'paragraph',
          title: 'Akses Kredensial Hosting / Domain / Server (Jika Ada)',
          required: false,
          options: []
        },
        {
          id: 'q4',
          type: 'multiple_choice',
          title: 'Kanal Komunikasi Utama yang Dipilih',
          required: true,
          options: [
            { id: 'o1', text: 'Grup WhatsApp Resmi Proyek' },
            { id: 'o2', text: 'Slack / Discord Workspace' },
            { id: 'o3', text: 'Email Korespondensi Resmi' },
            { id: 'o4', text: 'Trello / Notion Board' }
          ]
        },
        {
          id: 'q5',
          type: 'date',
          title: 'Jadwal Rapat Perdana (Kick-off Meeting)',
          required: true,
          options: []
        }
      ]
    }
  },
  {
    id: 'tmpl_warranty_claim',
    category: 'business',
    categoryLabel: 'Bisnis & Klien',
    title: 'Klaim Garansi & Keluhan Layanan',
    description: 'Pencatatan kendala teknis, bug sistem, atau revisi garansi pasca serah terima proyek.',
    themeColor: '#e11d48',
    questionCount: 4,
    schema: {
      title: 'Formulir Klaim Garansi & Keluhan Teknis',
      description: 'Tim dukungan kami siap membantu menyelesaikan kendala sistem Anda dalam masa garansi aktif.',
      themeColor: '#e11d48',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nomor Invoice / Kode Kontrak Proyek',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'dropdown',
          title: 'Tingkat Urgensi Masalah',
          required: true,
          options: [
            { id: 'o1', text: 'Kritis (Website / Sistem Down Total)' },
            { id: 'o2', text: 'Sedang (Fitur tertentu tidak bekerja)' },
            { id: 'o3', text: 'Rendah (Tampilan minor / Typo teks)' }
          ]
        },
        {
          id: 'q3',
          type: 'paragraph',
          title: 'Deskripsi Kendala yang Terjadi Beserta Langkah Reproduksinya',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'short_text',
          title: 'Tautan Screenshot Error / Bukti Rekaman',
          required: false,
          options: []
        }
      ]
    }
  },

  // ── SURVEI & RISET ──
  {
    id: 'tmpl_csat_feedback',
    category: 'survey',
    categoryLabel: 'Survei & Riset',
    title: 'Survei Kepuasan Klien (CSAT & NPS)',
    description: 'Kuesioner evaluasi kepuasan pasca penyelesaian proyek dengan rating bintang dan skala linier.',
    themeColor: '#10b981',
    questionCount: 5,
    schema: {
      title: 'Survei Kepuasan Klien (CSAT & Feedback)',
      description: 'Kami terus berupaya meningkatkan kualitas layanan studio. Berikan pendapat jujur Anda atas pengalaman bekerja sama bersama kami.',
      themeColor: '#10b981',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'rating',
          title: 'Seberapa puas Anda terhadap kualitas hasil akhir pekerjaan kami?',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'linear_scale',
          title: 'Seberapa besar kemungkinan Anda merekomendasikan kami kepada kolega bisnis Anda?',
          required: true,
          options: [],
          scaleMin: 1,
          scaleMax: 10,
          scaleMinLabel: 'Sangat Mustahil',
          scaleMaxLabel: 'Pasti Merekomendasikan'
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Bagaimana penilaian Anda terhadap ketepatan waktu pengiriman proyek?',
          required: true,
          options: [
            { id: 'o1', text: 'Lebih cepat dari perkiraan' },
            { id: 'o2', text: 'Tepat sesuai jadwal' },
            { id: 'o3', text: 'Sedikit terlambat tapi terkomunikasikan' },
            { id: 'o4', text: 'Terlambat tanpa kabar' }
          ]
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Apa hal yang paling Anda sukai dari proses kerja sama ini?',
          required: false,
          options: []
        },
        {
          id: 'q5',
          type: 'paragraph',
          title: 'Apa saran perbaikan agar layanan kami menjadi lebih baik di masa depan?',
          required: false,
          options: []
        }
      ]
    }
  },
  {
    id: 'tmpl_market_research',
    category: 'survey',
    categoryLabel: 'Survei & Riset',
    title: 'Riset Pasar & Kebutuhan Fitur Produk',
    description: 'Survei mendalam untuk memvalidasi ide produk digital, kebiasaan target audiens, dan willingness to pay.',
    themeColor: '#8b5cf6',
    questionCount: 5,
    schema: {
      title: 'Survei Riset Pasar & Kebutuhan Produk',
      description: 'Bantu kami merancang solusi yang paling sesuai dengan kebutuhan harian Anda.',
      themeColor: '#8b5cf6',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          title: 'Rentang Usia Responden',
          required: true,
          options: [
            { id: 'o1', text: 'Di bawah 20 tahun' },
            { id: 'o2', text: '21 - 30 tahun' },
            { id: 'o3', text: '31 - 40 tahun' },
            { id: 'o4', text: 'Di atas 40 tahun' }
          ]
        },
        {
          id: 'q2',
          type: 'checkboxes',
          title: 'Alat / Aplikasi yang Sering Anda Gunakan Sehari-hari',
          required: true,
          options: [
            { id: 'o1', text: 'Notion / Obsidian' },
            { id: 'o2', text: 'Google Workspace / Docs' },
            { id: 'o3', text: 'Figma / Canva' },
            { id: 'o4', text: 'WhatsApp Business' }
          ]
        },
        {
          id: 'q3',
          type: 'paragraph',
          title: 'Apa kendala terbesar (pain point) yang Anda alami saat mengelola pekerjaan saat ini?',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'dropdown',
          title: 'Berapa biaya langganan bulanan yang masuk akal bagi Anda untuk fitur otomatisasi ini?',
          required: true,
          options: [
            { id: 'o1', text: 'Rp 49.000 / bulan' },
            { id: 'o2', text: 'Rp 99.000 / bulan' },
            { id: 'o3', text: 'Rp 199.000 / bulan' },
            { id: 'o4', text: 'Lebih dari Rp 300.000 / bulan' }
          ]
        },
        {
          id: 'q5',
          type: 'linear_scale',
          title: 'Seberapa mendesak Anda membutuhkan solusi ini sekarang?',
          required: true,
          options: [],
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: 'Bisa Ditunda',
          scaleMaxLabel: 'Sangat Mendesak'
        }
      ]
    }
  },
  {
    id: 'tmpl_ux_usability',
    category: 'survey',
    categoryLabel: 'Survei & Riset',
    title: 'Survei Usability & UX Feedback Aplikasi',
    description: 'Evaluasi kemudahan navigasi, kejelasan ikon, dan kecepatan akses aplikasi oleh pengguna akhir.',
    themeColor: '#0ea5e9',
    questionCount: 4,
    schema: {
      title: 'Kuesioner Uji Keterpakaian Aplikasi (Usability Feedback)',
      description: 'Pendapat Anda sangat berharga dalam penyempurnaan alur kerja dan antarmuka aplikasi kami.',
      themeColor: '#0ea5e9',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'linear_scale',
          title: 'Apakah alur kerja aplikasi ini terasa intuitif dan mudah dipahami tanpa instruksi?',
          required: true,
          options: [],
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: 'Membingungkan',
          scaleMaxLabel: 'Sangat Mudah'
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Apakah Anda menemui halaman yang lambat atau tombol yang tidak merespons?',
          required: true,
          options: [
            { id: 'o1', text: 'Tidak pernah, semua cepat' },
            { id: 'o2', text: 'Hanya sekali atau dua kali' },
            { id: 'o3', text: 'Sering mengalami lag / loading lama' }
          ]
        },
        {
          id: 'q3',
          type: 'rating',
          title: 'Penilaian desain visual (estetika, warna, font dan keterbacaan):',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Fitur apa yang menurut Anda paling perlu ditambahkan pada pembaruan berikutnya?',
          required: false,
          options: []
        }
      ]
    }
  },

  // ── HR, TIM & REKRUTMEN ──
  {
    id: 'tmpl_job_application',
    category: 'hr',
    categoryLabel: 'HR & Tim',
    title: 'Formulir Lamaran Pekerjaan (Job Application)',
    description: 'Format rekrutmen lengkap: data diri, posisi yang dilamar, tautan portofolio, dan ekspektasi gaji.',
    themeColor: '#d97706',
    questionCount: 6,
    schema: {
      title: 'Formulir Pendaftaran Calon Anggota Tim',
      description: 'Bergabunglah bersama keluarga studio kreatif kami. Isi data diri dan lampirkan karya terbaik Anda.',
      themeColor: '#d97706',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Lengkap',
          required: true,
          options: [],
          page: 1
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Email Aktif & Kontak WhatsApp',
          required: true,
          options: [],
          page: 1
        },
        {
          id: 'q3',
          type: 'dropdown',
          title: 'Posisi yang Dilamar',
          required: true,
          options: [
            { id: 'o1', text: 'Senior UI/UX Designer' },
            { id: 'o2', text: 'Fullstack Web Developer' },
            { id: 'o3', text: 'Motion Graphic & Video Editor' },
            { id: 'o4', text: 'Content Creator & Social Media Specialist' }
          ],
          page: 1
        },
        {
          id: 'q4',
          type: 'short_text',
          title: 'Tautan Portofolio Online (Behance / Dribbble / GitHub / Website)',
          required: true,
          options: [],
          page: 2
        },
        {
          id: 'q5',
          type: 'short_text',
          title: 'Ekspektasi Gaji Bulanan (Rp)',
          required: true,
          options: [],
          page: 2
        },
        {
          id: 'q6',
          type: 'multiple_choice',
          title: 'Kesiapan Mulai Bekerja',
          required: true,
          options: [
            { id: 'o1', text: 'Dapat langsung bergabung (Immediately)' },
            { id: 'o2', text: 'Pemberitahuan 2 minggu (Two weeks notice)' },
            { id: 'o3', text: 'Pemberitahuan 1 bulan (One month notice)' }
          ],
          page: 2
        }
      ]
    }
  },
  {
    id: 'tmpl_peer_review',
    category: 'hr',
    categoryLabel: 'HR & Tim',
    title: 'Evaluasi Kinerja & Peer Review 360°',
    description: 'Kuesioner evaluasi kerja berkala antar anggota tim untuk menilai komunikasi, kedisiplinan, dan output.',
    themeColor: '#4f46e5',
    questionCount: 5,
    schema: {
      title: 'Evaluasi Kinerja Tim & Peer Review',
      description: 'Penilaian ini bertujuan untuk membangun iklim kerja kolaboratif dan saling mendukung secara konstruktif.',
      themeColor: '#4f46e5',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Rekan Kerja yang Dinilai',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'linear_scale',
          title: 'Tingkat komunikasi dan kemudahan koordinasi saat bekerja dalam proyek tim:',
          required: true,
          options: [],
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: 'Sulit Dihubungi',
          scaleMaxLabel: 'Sangat Responsif'
        },
        {
          id: 'q3',
          type: 'rating',
          title: 'Kualitas dan ketelitian output pekerjaan yang diserahkan:',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Kekuatan terbesar rekan kerja ini yang sangat membantu tim:',
          required: true,
          options: []
        },
        {
          id: 'q5',
          type: 'paragraph',
          title: 'Aspek yang dapat ditingkatkan demi efisiensi kerja bersama:',
          required: false,
          options: []
        }
      ]
    }
  },
  {
    id: 'tmpl_leave_request',
    category: 'hr',
    categoryLabel: 'HR & Tim',
    title: 'Pengajuan Cuti & Izin Kerja',
    description: 'Formulir resmi permohonan cuti tahunan, izin sakit, atau hari libur mendesak.',
    themeColor: '#ca8a04',
    questionCount: 5,
    schema: {
      title: 'Formulir Pengajuan Cuti & Izin Kerja',
      description: 'Pengajuan izin kerja resmi untuk pencatatan absensi HR dan pendelegasian tugas selama ketidakhadiran.',
      themeColor: '#ca8a04',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Karyawan & Divisi',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'dropdown',
          title: 'Jenis Pengajuan',
          required: true,
          options: [
            { id: 'o1', text: 'Cuti Tahunan Berbayar' },
            { id: 'o2', text: 'Izin Sakit (Disertai Surat Dokter)' },
            { id: 'o3', text: 'Cuti Khusus (Menikah/Duka/Melahirkan)' },
            { id: 'o4', text: 'Izin Setengah Hari / Keperluan Mendesak' }
          ]
        },
        {
          id: 'q3',
          type: 'date',
          title: 'Tanggal Mulai Cuti',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'date',
          title: 'Tanggal Selesai Cuti',
          required: true,
          options: []
        },
        {
          id: 'q5',
          type: 'short_text',
          title: 'Nama Rekan Kerja Pengganti / PIC Delegasi Tugas',
          required: true,
          options: []
        }
      ]
    }
  },

  // ── EDUKASI & EVENT ──
  {
    id: 'tmpl_workshop_registration',
    category: 'education',
    categoryLabel: 'Edukasi & Event',
    title: 'Registrasi Workshop & Webinar Online',
    description: 'Pendaftaran peserta workshop: biodata, pemilihan sesi, bukti transfer tiket, dan harapan materi.',
    themeColor: '#7c3aed',
    questionCount: 6,
    schema: {
      title: 'Pendaftaran Workshop Desain & AI Mastery',
      description: 'Tingkatkan keterampilan Anda dalam sesi intensif 2 hari bersama praktisi industri terkemuka.',
      themeColor: '#7c3aed',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Lengkap Beserta Gelar (Untuk Sertifikat)',
          required: true,
          options: [],
          page: 1
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Alamat Email Pengiriman Link Zoom',
          required: true,
          options: [],
          page: 1
        },
        {
          id: 'q3',
          type: 'short_text',
          title: 'Nomor WhatsApp untuk Grup Peserta',
          required: true,
          options: [],
          page: 1
        },
        {
          id: 'q4',
          type: 'multiple_choice',
          title: 'Kategori Tiket yang Dipilih',
          required: true,
          options: [
            { id: 'o1', text: 'Tiket Reguler (Akses Webinar + Rekaman Video)' },
            { id: 'o2', text: 'Tiket VIP (Termasuk 1-on-1 Portfolio Review & Template Aset Eksklusif)' }
          ],
          page: 2
        },
        {
          id: 'q5',
          type: 'paragraph',
          title: 'Topik Spesifik Apa yang Paling Ingin Anda Pelajari?',
          required: false,
          options: [],
          page: 2
        },
        {
          id: 'q6',
          type: 'multiple_choice',
          title: 'Dari Mana Anda Mengetahui Informasi Acara Ini?',
          required: false,
          options: [
            { id: 'o1', text: 'Instagram Studio' },
            { id: 'o2', text: 'LinkedIn' },
            { id: 'o3', text: 'Rekomendasi Teman / Komunitas' },
            { id: 'o4', text: 'Grup WhatsApp / Telegram' }
          ],
          page: 2
        }
      ]
    }
  },
  {
    id: 'tmpl_quiz_assessment',
    category: 'education',
    categoryLabel: 'Edukasi & Event',
    title: 'Kuis Evaluasi Pemahaman Materi',
    description: 'Format tes evaluasi materi dengan pilihan ganda berbobot nilai dan pertanyaan refleksi.',
    themeColor: '#2563eb',
    questionCount: 4,
    schema: {
      title: 'Kuis Evaluasi Pemahaman Materi Dasar Desain UI/UX',
      description: 'Jawablah pertanyaan di bawah ini secara mandiri untuk mengukur pemahaman konsep dasar modul 1.',
      themeColor: '#2563eb',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nomor Induk Mahasiswa / ID Peserta',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Apa tujuan utama dari proses Wireframing dalam desain antarmuka?',
          required: true,
          options: [
            { id: 'o1', text: 'Menentukan palet warna akhir dan efek shadow' },
            { id: 'o2', text: 'Menyusun struktur hirarki informasi dan tata letak konten' },
            { id: 'o3', text: 'Membuat animasi transisi dan micro-interaction' },
            { id: 'o4', text: 'Menulis kode frontend HTML dan CSS' }
          ]
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Prinsip Gestalt manakah yang menyatakan bahwa elemen yang berdekatan dianggap satu kesatuan grup?',
          required: true,
          options: [
            { id: 'o1', text: 'Law of Proximity (Kedekatan)' },
            { id: 'o2', text: 'Law of Similarity (Kesamaan)' },
            { id: 'o3', text: 'Law of Closure (Ketertutupan)' },
            { id: 'o4', text: 'Law of Continuity (Kelanjutan)' }
          ]
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Jelaskan perbedaan mendasar antara Desain Responsif dan Desain Adaptif:',
          required: true,
          options: []
        }
      ]
    }
  },
  {
    id: 'tmpl_event_attendance',
    category: 'education',
    categoryLabel: 'Edukasi & Event',
    title: 'Presensi & Absensi Kehadiran Acara',
    description: 'Formulir check-in cepat untuk mencatat daftar hadir kegiatan luring atau pelatihan tatap muka.',
    themeColor: '#0891b2',
    questionCount: 4,
    schema: {
      title: 'Presensi Kehadiran Kegiatan Sesi Pelatihan',
      description: 'Harap mengisi formulir presensi ini saat memasuki ruangan seminar.',
      themeColor: '#0891b2',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Lengkap Peserta',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'short_text',
          title: 'Instansi / Perusahaan',
          required: true,
          options: []
        },
        {
          id: 'q3',
          type: 'time',
          title: 'Waktu Check-In Masuk',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'multiple_choice',
          title: 'Status Kehadiran',
          required: true,
          options: [
            { id: 'o1', text: 'Hadir Tepat Waktu' },
            { id: 'o2', text: 'Hadir dengan Keterlambatan Izin' }
          ]
        }
      ]
    }
  },

  // ── KREATIF & MEDIA ──
  {
    id: 'tmpl_brand_identity_brief',
    category: 'creative',
    categoryLabel: 'Kreatif & Media',
    title: 'Brief Desain Identitas Brand & Logo',
    description: 'Kuesioner mendalam tentang nilai brand, target pasar, preferensi gaya visual, dan warna terlarang.',
    themeColor: '#db2777',
    questionCount: 5,
    schema: {
      title: 'Brief Desain Identitas Brand & Logo Baru',
      description: 'Formulir ini membantu desainer kami menangkap jiwa dan kepribadian brand Anda ke dalam wujud visual yang berkarakter.',
      themeColor: '#db2777',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Brand yang Tepat Beserta Tagline (Jika Ada)',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'checkboxes',
          title: 'Karakter & Mood Visual yang Ingin Ditonjolkan',
          required: true,
          options: [
            { id: 'o1', text: 'Elegan, Mewah & Premium' },
            { id: 'o2', text: 'Modern, Minimalis & Bersih' },
            { id: 'o3', text: 'Berani, Enerjik & Sporty' },
            { id: 'o4', text: 'Hangat, Ramah & Fun' }
          ]
        },
        {
          id: 'q3',
          type: 'dropdown',
          title: 'Gaya Logo yang Lebih Disukai',
          required: true,
          options: [
            { id: 'o1', text: 'Wordmark / Typography Saja' },
            { id: 'o2', text: 'Icon Abstrak + Teks' },
            { id: 'o3', text: 'Maskot Karakter' },
            { id: 'o4', text: 'Emblem / Badge Klasik' }
          ]
        },
        {
          id: 'q4',
          type: 'short_text',
          title: 'Warna yang Wajib Digunakan atau Warna yang Dilarang',
          required: false,
          options: []
        },
        {
          id: 'q5',
          type: 'short_text',
          title: 'Sebutkan 3 Akun Kompetitor atau Referensi yang Anda Sukai',
          required: true,
          options: []
        }
      ]
    }
  },
  {
    id: 'tmpl_photo_booking',
    category: 'creative',
    categoryLabel: 'Kreatif & Media',
    title: 'Booking Sesi Foto & Video Studio',
    description: 'Pemesanan jadwal pemotretan produk, prewedding, atau video komersial lengkap dengan opsi paket.',
    themeColor: '#9333ea',
    questionCount: 5,
    schema: {
      title: 'Reservasi Jadwal Pemotretan & Dokumentasi',
      description: 'Amankan jadwal sesi foto studio atau pemotretan outdoor bersama tim fotografer profesional kami.',
      themeColor: '#9333ea',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Pemesan & Kontak Darurat',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Paket Pemotretan',
          required: true,
          options: [
            { id: 'o1', text: 'Paket Katalog Produk (2 Jam Sesi Studio + 15 Retouched Photos)' },
            { id: 'o2', text: 'Paket Portrait / Wisuda (1 Jam Sesi Studio)' },
            { id: 'o3', text: 'Paket Liputan Event Seharian Penuh' }
          ]
        },
        {
          id: 'q3',
          type: 'date',
          title: 'Tanggal Pelaksanaan yang Diinginkan',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'time',
          title: 'Jam Mulai yang Diinginkan',
          required: true,
          options: []
        },
        {
          id: 'q5',
          type: 'paragraph',
          title: 'Permintaan Khusus / Konsep Properti Tambahan',
          required: false,
          options: []
        }
      ]
    }
  },

  // ── ORDER & TRANSAKSI ──
  {
    id: 'tmpl_preorder_merch',
    category: 'order',
    categoryLabel: 'Order & Transaksi',
    title: 'Pre-Order Merchandise & Kaos Custom',
    description: 'Pemesanan barang dagang: pemilihan ukuran baju, varian warna, jumlah, dan alamat pengiriman.',
    themeColor: '#16a34a',
    questionCount: 5,
    schema: {
      title: 'Formulir Pre-Order Merchandise Resmi Studio',
      description: 'Dapatkan merchandise edisi terbatas kami. Harap teliti memeriksa ukuran dan alamat pengiriman Anda.',
      themeColor: '#16a34a',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Penerima Paket',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'dropdown',
          title: 'Ukuran Kaos (Asian Size)',
          required: true,
          options: [
            { id: 'o1', text: 'S (Lebar 48 cm, Panjang 68 cm)' },
            { id: 'o2', text: 'M (Lebar 50 cm, Panjang 70 cm)' },
            { id: 'o3', text: 'L (Lebar 52 cm, Panjang 72 cm)' },
            { id: 'o4', text: 'XL (Lebar 54 cm, Panjang 74 cm)' },
            { id: 'o5', text: 'XXL (Lebar 58 cm, Panjang 78 cm)' }
          ]
        },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Varian Warna Pilihan',
          required: true,
          options: [
            { id: 'o1', text: 'Jet Black (Hitam Pekat)' },
            { id: 'o2', text: 'Off-White (Krem Lembut)' },
            { id: 'o3', text: 'Deep Navy (Biru Dongker)' }
          ]
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Alamat Lengkap Pengiriman Beserta Kode Pos',
          required: true,
          options: []
        },
        {
          id: 'q5',
          type: 'multiple_choice',
          title: 'Metode Pembayaran Pilihan',
          required: true,
          options: [
            { id: 'o1', text: 'Transfer Bank BCA' },
            { id: 'o2', text: 'Transfer Bank Mandiri' },
            { id: 'o3', text: 'QRIS (Gopay/OVO/ShopeePay)' }
          ]
        }
      ]
    }
  },
  {
    id: 'tmpl_order_catering',
    category: 'order',
    categoryLabel: 'Order & Transaksi',
    title: 'Pemesanan Katering & Konsumsi Event',
    description: 'Order paket makanan box atau prasmanan: jumlah porsi, menu lauk, tanggal dan jam pengantaran.',
    themeColor: '#ea580c',
    questionCount: 5,
    schema: {
      title: 'Formulir Pemesanan Katering Acara',
      description: 'Pesan konsumsi lezat dan higienis untuk rapat kantor, syukuran, atau perayaan keluarga Anda.',
      themeColor: '#ea580c',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nama Pemesan / Nama Kantor',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'dropdown',
          title: 'Pilihan Paket Menu Nasi Box',
          required: true,
          options: [
            { id: 'o1', text: 'Paket Ayam Bakar Madu + Sambal Terasi (Rp 28.000 / box)' },
            { id: 'o2', text: 'Paket Rendang Sapi Padang Asli (Rp 35.000 / box)' },
            { id: 'o3', text: 'Paket Ikan Nila Goreng Sambal Matah (Rp 30.000 / box)' }
          ]
        },
        {
          id: 'q3',
          type: 'short_text',
          title: 'Jumlah Porsi Pesanan (Minimal 20 Porsi)',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'date',
          title: 'Tanggal Pengiriman Makanan',
          required: true,
          options: []
        },
        {
          id: 'q5',
          type: 'time',
          title: 'Jam Makanan Wajib Tiba di Lokasi',
          required: true,
          options: []
        }
      ]
    }
  },
  {
    id: 'tmpl_refund_return',
    category: 'order',
    categoryLabel: 'Order & Transaksi',
    title: 'Pengajuan Retur Barang & Pengembalian Dana',
    description: 'Prosedur komplain transaksi: nomor pesanan, alasan retur, nomor rekening refund, dan bukti foto.',
    themeColor: '#b91c1c',
    questionCount: 4,
    schema: {
      title: 'Formulir Pengajuan Retur & Refund',
      description: 'Kepuasan Anda adalah komitmen kami. Isi data di bawah ini untuk klaim garansi pengembalian dana 100%.',
      themeColor: '#b91c1c',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'short_text',
          title: 'Nomor Order / Kode Resi Pengiriman',
          required: true,
          options: []
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Alasan Utama Pengajuan Retur',
          required: true,
          options: [
            { id: 'o1', text: 'Barang rusak / cacat produksi saat diterima' },
            { id: 'o2', text: 'Salah kirim varian ukuran atau warna' },
            { id: 'o3', text: 'Jumlah produk tidak lengkap' }
          ]
        },
        {
          id: 'q3',
          type: 'short_text',
          title: 'Nama Bank & Nomor Rekening Tujuan Refund',
          required: true,
          options: []
        },
        {
          id: 'q4',
          type: 'paragraph',
          title: 'Keterangan Tambahan Mengenai Kerusakan Produk',
          required: false,
          options: []
        }
      ]
    }
  },

  // ── TEMPLATE TAMBAHAN LENGKAP & BERAGAM (18 TEMPLATE BARU) ──
  {
    id: 'tmpl_partnership_proposal',
    category: 'business',
    categoryLabel: 'Bisnis & Klien',
    title: 'Pengajuan Kemitraan & Kerjasama Brand',
    description: 'Format pengajuan proposal kolaborasi bisnis: model kerjasama, profil instansi, dan ekspektasi sinergi.',
    themeColor: '#4f46e5',
    questionCount: 5,
    schema: {
      title: 'Formulir Pengajuan Kemitraan & Kolaborasi',
      description: 'Terima kasih atas minat Anda bermitra dengan kami. Mohon berikan informasi detail mengenai bentuk kerjasama yang diajukan.',
      themeColor: '#4f46e5',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Lengkap & Jabatan Pengaju', required: true, options: [], page: 1 },
        { id: 'q2', type: 'short_text', title: 'Nama Instansi / Perusahaan / Komunitas', required: true, options: [], page: 1 },
        {
          id: 'q3',
          type: 'dropdown',
          title: 'Skema Kerjasama yang Ditawarkan',
          required: true,
          options: [
            { id: 'o1', text: 'Co-Branding & Cross Promotion' },
            { id: 'o2', text: 'Media Partner & Publikasi' },
            { id: 'o3', text: 'Sponsorship Acara' },
            { id: 'o4', text: 'Kerjasama Distributor / Reseller' }
          ],
          page: 1
        },
        { id: 'q4', type: 'paragraph', title: 'Ringkasan Proposal & Manfaat Bersama (Win-Win Value)', required: true, options: [], page: 2 },
        { id: 'q5', type: 'short_text', title: 'Tautan Google Drive / Dokumen Proposal Pendukung', required: false, options: [], page: 2 }
      ]
    }
  },
  {
    id: 'tmpl_vendor_registration',
    category: 'business',
    categoryLabel: 'Bisnis & Klien',
    title: 'Registrasi & Verifikasi Supplier / Vendor',
    description: 'Pendaftaran resmi vendor rekanan: bidang industri, nomor legalitas/NIB, dan portofolio pasokan.',
    themeColor: '#0891b2',
    questionCount: 5,
    schema: {
      title: 'Pendaftaran Vendor & Rekanan Baru',
      description: 'Formulir pendaftaran untuk menjadi supplier / penyedia jasa resmi rekanan studio.',
      themeColor: '#0891b2',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Badan Usaha / PT / CV / Firma', required: true, options: [], page: 1 },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Kategori Pasokan / Jasa Utama',
          required: true,
          options: [
            { id: 'o1', text: 'Percetakan & Packaging' },
            { id: 'o2', text: 'Peralatan Hardware & IT' },
            { id: 'o3', text: 'Konsumsi, Katering & F&B' },
            { id: 'o4', text: 'Jasa Transportasi & Logistik' }
          ],
          page: 1
        },
        { id: 'q3', type: 'short_text', title: 'Nomor Pokok Wajib Pajak (NPWP) / NIB', required: true, options: [], page: 1 },
        { id: 'q4', type: 'short_text', title: 'Nomor WhatsApp PIC Penjualan / Sales', required: true, options: [], page: 2 },
        { id: 'q5', type: 'paragraph', title: 'Daftar Klien Utama yang Pernah Dilayani', required: false, options: [], page: 2 }
      ]
    }
  },
  {
    id: 'tmpl_nda_consultation',
    category: 'business',
    categoryLabel: 'Bisnis & Klien',
    title: 'Permohonan NDA & Konsultasi Rahasia',
    description: 'Permintaan sesi diskusi tertutup untuk proyek dengan perlindungan Non-Disclosure Agreement (NDA).',
    themeColor: '#059669',
    questionCount: 4,
    schema: {
      title: 'Permohonan Diskusi Khusus & Penandatanganan NDA',
      description: 'Kami menghargai kerahasiaan kekayaan intelektual Anda. Isi formulir ini untuk penjadwalan sesi bertanda tangan NDA.',
      themeColor: '#059669',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Perwakilan & Nama Entitas', required: true, options: [] },
        { id: 'q2', type: 'short_text', title: 'Bidang Industri / Teknologi Terkait', required: true, options: [] },
        { id: 'q3', type: 'date', title: 'Rencana Tanggal Diskusi Pendahuluan', required: true, options: [] },
        { id: 'q4', type: 'paragraph', title: 'Gambaran Umum Lingkup Proyek (High-Level Scope)', required: true, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_event_feedback',
    category: 'survey',
    categoryLabel: 'Survei & Riset',
    title: 'Evaluasi & Feedback Peserta Acara',
    description: 'Kuesioner evaluasi pasca acara: penilaian materi narasumber, kenyamanan venue, dan saran perbaikan.',
    themeColor: '#10b981',
    questionCount: 5,
    schema: {
      title: 'Survei Evaluasi & Kepuasan Peserta Event',
      description: 'Bantu kami meningkatkan kualitas acara berikutnya dengan memberikan ulasan jujur Anda.',
      themeColor: '#10b981',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'rating', title: 'Penilaian Kualitas Materi & Pemaparan Narasumber', required: true, options: [] },
        { id: 'q2', type: 'rating', title: 'Kenyamanan Fasilitas & Kelancaran Susunan Acara', required: true, options: [] },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Apakah Durasi Acara Sudah Sesuai?',
          required: true,
          options: [
            { id: 'o1', text: 'Sangat Pas' },
            { id: 'o2', text: 'Terlalu Singkat / Kurang Waktu Tanya Jawab' },
            { id: 'o3', text: 'Terlalu Panjang & Melelahkan' }
          ]
        },
        { id: 'q4', type: 'linear_scale', title: 'Seberapa Besar Kemungkinan Anda Mengikuti Acara Berikutnya? (1-10)', required: true, options: [] },
        { id: 'q5', type: 'paragraph', title: 'Topik Apa yang Paling Anda Harapkan untuk Acara Selanjutnya?', required: false, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_brand_awareness',
    category: 'survey',
    categoryLabel: 'Survei & Riset',
    title: 'Riset Brand Awareness & Preferensi Konsumen',
    description: 'Pengukuran persepsi brand di pasar: saluran pengenalan, persepsi harga, dan faktor penentu pembelian.',
    themeColor: '#6366f1',
    questionCount: 5,
    schema: {
      title: 'Kuesioner Riset Pasar & Persepsi Brand',
      description: 'Pendapat Anda sangat berharga dalam penyempurnaan produk dan pesan komunikasi kami.',
      themeColor: '#6366f1',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          title: 'Dari Mana Anda Pertama Kali Mengetahui Brand Kami?',
          required: true,
          options: [
            { id: 'o1', text: 'Instagram / TikTok Reels' },
            { id: 'o2', text: 'Rekomendasi Teman / Kerabat' },
            { id: 'o3', text: 'Pencarian Google Search' },
            { id: 'o4', text: 'Event / Pameran Offline' }
          ]
        },
        {
          id: 'q2',
          type: 'dropdown',
          title: 'Faktor Terpenting Saat Memilih Produk Serupa',
          required: true,
          options: [
            { id: 'o1', text: 'Kualitas & Daya Tahan Produk' },
            { id: 'o2', text: 'Harga Kompetitif & Promo Diskon' },
            { id: 'o3', text: 'Desain Visual & Estetika Vibe' },
            { id: 'o4', text: 'Kecepatan Respon Layanan Pelanggan' }
          ]
        },
        { id: 'q3', type: 'rating', title: 'Tingkat Kemudahan Memahami Informasi Produk Kami', required: true, options: [] },
        { id: 'q4', type: 'paragraph', title: 'Kesan Pertama yang Muncul di Benak Anda Tentang Brand Kami', required: false, options: [] },
        { id: 'q5', type: 'short_text', title: 'Nama Akun Media Sosial / Email untuk Hadiah Giveaway Riset', required: false, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_website_audit',
    category: 'survey',
    categoryLabel: 'Survei & Riset',
    title: 'Audit Kebutuhan Desain Ulang Website',
    description: 'Diagnostik kebutuhan website: kendala navigasi, tujuan re-design, integrasi fitur, dan target konversi.',
    themeColor: '#0284c7',
    questionCount: 4,
    schema: {
      title: 'Kuesioner Pra-Audit & Re-Design Website',
      description: 'Panduan diagnostik sebelum memulai redesain platform digital bisnis Anda.',
      themeColor: '#0284c7',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'URL Website Saat Ini yang Ingin Dibenahi', required: true, options: [] },
        {
          id: 'q2',
          type: 'checkboxes',
          title: 'Masalah Utama yang Kerap Dikeluhkan Pengguna',
          required: true,
          options: [
            { id: 'o1', text: 'Loading halaman terasa lambat' },
            { id: 'o2', text: 'Tampilan di ponsel kurang rapi / tidak responsif' },
            { id: 'o3', text: 'Navigasi menu membingungkan' },
            { id: 'o4', text: 'Tingkat konversi penjualan rendah' }
          ]
        },
        { id: 'q3', type: 'paragraph', title: 'Contoh 2-3 Website Referensi yang Disukai Gaya Desainnya', required: true, options: [] },
        { id: 'q4', type: 'short_text', title: 'Fitur Khusus yang Wajib Tersedia (Payment, Booking, dsb.)', required: false, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_exit_interview',
    category: 'hr',
    categoryLabel: 'HR & Tim',
    title: 'Formulir Exit Interview Karyawan',
    description: 'Kuesioner rahasia saat pengunduran diri: alasan pengunduran diri, budaya kerja, dan feedback kepemimpinan.',
    themeColor: '#d97706',
    questionCount: 5,
    schema: {
      title: 'Exit Interview Karyawan (Kerahasiaan Terjamin)',
      description: 'Masukan Anda sangat bernilai untuk perbaikan kultur organisasi dan iklim kerja di masa mendatang.',
      themeColor: '#d97706',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'dropdown',
          title: 'Faktor Utama Pengunduran Diri',
          required: true,
          options: [
            { id: 'o1', text: 'Peluang Karir & Tantangan Baru' },
            { id: 'o2', text: 'Kompensasi & Benefit' },
            { id: 'o3', text: 'Keseimbangan Hidup & Kerja (Work-Life Balance)' },
            { id: 'o4', text: 'Melanjutkan Studi / Bisnis Mandiri' }
          ]
        },
        { id: 'q2', type: 'rating', title: 'Sejauh Mana Lingkungan Kerja Mendukung Pertumbuhan Anda?', required: true, options: [] },
        { id: 'q3', type: 'paragraph', title: 'Hal Terbaik yang Anda Rasakan Selama Bekerja di Sini', required: true, options: [] },
        { id: 'q4', type: 'paragraph', title: 'Saran Konstruktif untuk Manajemen dan Pimpinan Tim', required: true, options: [] },
        { id: 'q5', type: 'date', title: 'Tanggal Efektif Hari Kerja Terakhir (Last Working Day)', required: true, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_new_hire_onboarding',
    category: 'hr',
    categoryLabel: 'HR & Tim',
    title: 'Kelengkapan Berkas Karyawan Baru',
    description: 'Data administratif personil baru: kontak darurat, ukuran kaos seragam, akun perbankan, dan data BPJS.',
    themeColor: '#ea580c',
    questionCount: 5,
    schema: {
      title: 'Pengumpulan Berkas Administrasi Karyawan Baru',
      description: 'Selamat bergabung dalam tim! Mohon lengkapi data administratif berikut untuk penyiapan akun dan fasilitas kerja.',
      themeColor: '#ea580c',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Lengkap Sesuai KTP', required: true, options: [] },
        { id: 'q2', type: 'short_text', title: 'Nama & Nomor Kontak Darurat (Keluarga Terdekat)', required: true, options: [] },
        {
          id: 'q3',
          type: 'multiple_choice',
          title: 'Ukuran Kaos Polo Seragam Tim',
          required: true,
          options: [
            { id: 'o1', text: 'S (Small)' },
            { id: 'o2', text: 'M (Medium)' },
            { id: 'o3', text: 'L (Large)' },
            { id: 'o4', text: 'XL / XXL' }
          ]
        },
        { id: 'q4', type: 'short_text', title: 'Nomor Rekening Bank BCA / Mandiri untuk Payroll', required: true, options: [] },
        { id: 'q5', type: 'paragraph', title: 'Riwayat Alergi Makanan / Kondisi Medis Khusus', required: false, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_training_needs',
    category: 'hr',
    categoryLabel: 'HR & Tim',
    title: 'Survei Kebutuhan Pelatihan Internal',
    description: 'Pemetaan minat pengembangan kompetensi: topik teknis, soft skills, dan metode pembelajaran idaman.',
    themeColor: '#7c3aed',
    questionCount: 4,
    schema: {
      title: 'Survei Minat & Kebutuhan Workshop Tim',
      description: 'Bantu HR merancang kurikulum workshop internal yang tepat guna sesuai kebutuhan pekerjaan Anda.',
      themeColor: '#7c3aed',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        {
          id: 'q1',
          type: 'checkboxes',
          title: 'Topik Hard Skills yang Paling Ingin Dipelajari',
          required: true,
          options: [
            { id: 'o1', text: 'Pemanfaatan AI Tools & Prompt Engineering' },
            { id: 'o2', text: 'Motion Graphics & Animasi Antarmuka' },
            { id: 'o3', text: 'Data Analytics & Visualisasi Dashboard' },
            { id: 'o4', text: 'Copywriting & Storytelling Komersial' }
          ]
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Format Pembelajaran yang Paling Efektif untuk Anda',
          required: true,
          options: [
            { id: 'o1', text: 'Praktik Langsung (Hands-on Lab) Offline' },
            { id: 'o2', text: 'Webinar Interaktif Online dengan Rekaman' },
            { id: 'o3', text: 'Mentoring 1-on-1 dengan Senior' }
          ]
        },
        { id: 'q3', type: 'rating', title: 'Seberapa Puas Anda dengan Program Pelatihan Tahun Lalu?', required: false, options: [] },
        { id: 'q4', type: 'paragraph', title: 'Nama Mentor / Narasumber Eksternal Rekomendasi Anda', required: false, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_scholarship_app',
    category: 'education',
    categoryLabel: 'Edukasi & Event',
    title: 'Pendaftaran Program Beasiswa Belajar',
    description: 'Seleksi penerima beasiswa kursus intensif: biodata prestasi, esai motivasi, dan tautan portofolio karya.',
    themeColor: '#2563eb',
    questionCount: 6,
    schema: {
      title: 'Formulir Seleksi Beasiswa Creative Talent',
      description: 'Program beasiswa pelatihan intensif 100% didanai untuk talenta muda berbakat Indonesia.',
      themeColor: '#2563eb',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Lengkap Pendaftar', required: true, options: [], page: 1 },
        { id: 'q2', type: 'short_text', title: 'Asal Sekolah / Universitas / Lembaga', required: true, options: [], page: 1 },
        {
          id: 'q3',
          type: 'dropdown',
          title: 'Jalur Peminatan Beasiswa',
          required: true,
          options: [
            { id: 'o1', text: 'UI/UX & Product Design' },
            { id: 'o2', text: 'Fullstack Web Development' },
            { id: 'o3', text: 'Brand Identity & Visual Storytelling' }
          ],
          page: 1
        },
        { id: 'q4', type: 'paragraph', title: 'Esai Singkat: Mengapa Anda Berhak Menerima Beasiswa Ini?', required: true, options: [], page: 2 },
        { id: 'q5', type: 'short_text', title: 'Tautan Portofolio / GitHub / Behance', required: true, options: [], page: 2 },
        { id: 'q6', type: 'date', title: 'Kesiapan Mulai Mengikuti Kelas Intensif', required: true, options: [], page: 2 }
      ]
    }
  },
  {
    id: 'tmpl_creative_competition',
    category: 'education',
    categoryLabel: 'Edukasi & Event',
    title: 'Pendaftaran Kompetisi Karya Kreatif',
    description: 'Registrasi peserta lomba desain & video: nama tim, judul submission karya, dan pernyataan orisinalitas.',
    themeColor: '#9333ea',
    questionCount: 5,
    schema: {
      title: 'Registrasi Resmi Kompetisi Kreatif Nasional',
      description: 'Kirimkan karya terbaik Anda dan raih hadiah total puluhan juta rupiah.',
      themeColor: '#9333ea',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Tim / Nama Individu Peserta', required: true, options: [] },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Kategori Lomba yang Diikuti',
          required: true,
          options: [
            { id: 'o1', text: 'Poster Digital & Ilustrasi' },
            { id: 'o2', text: 'Video Pendek Kreatif (Reels/TikTok)' },
            { id: 'o3', text: 'Desain Prototipe Aplikasi Mobile' }
          ]
        },
        { id: 'q3', type: 'short_text', title: 'Judul Karya yang Diikutsertakan', required: true, options: [] },
        { id: 'q4', type: 'short_text', title: 'Tautan Google Drive Karya (Pastikan Akses Publik Terbuka)', required: true, options: [] },
        {
          id: 'q5',
          type: 'checkboxes',
          title: 'Pernyataan Orisinalitas',
          required: true,
          options: [
            { id: 'o1', text: 'Saya menyatakan karya ini orisinal dan bebas dari plagiasi' }
          ]
        }
      ]
    }
  },
  {
    id: 'tmpl_seminar_certificate',
    category: 'education',
    categoryLabel: 'Edukasi & Event',
    title: 'Klaim E-Sertifikat & Presensi Webinar',
    description: 'Penerbitan e-certificate seminar: penulisan nama dan gelar, feedback materi, dan konfirmasi kehadiran.',
    themeColor: '#0d9488',
    questionCount: 4,
    schema: {
      title: 'Klaim E-Sertifikat & Ulasan Seminar',
      description: 'E-Sertifikat akan dikirimkan otomatis ke email Anda dalam waktu 1x24 jam setelah data diverifikasi.',
      themeColor: '#0d9488',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Lengkap beserta Gelar (Untuk Dicetak pada Sertifikat)', required: true, options: [] },
        { id: 'q2', type: 'short_text', title: 'Alamat Email Aktif Penerima Sertifikat', required: true, options: [] },
        { id: 'q3', type: 'rating', title: 'Kepuasan Terhadap Materi Seminar Hari Ini', required: true, options: [] },
        { id: 'q4', type: 'paragraph', title: 'Poin Pembelajaran Terpenting yang Anda Dapatkan (Key Takeaways)', required: true, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_podcast_guest',
    category: 'creative',
    categoryLabel: 'Kreatif & Media',
    title: 'Pengajuan Narasumber Guest Podcast',
    description: 'Formulir kurasi tamu rekaman podcast: topik keahlian, bio singkat, tautan sosial media, dan ketersediaan waktu.',
    themeColor: '#db2777',
    questionCount: 5,
    schema: {
      title: 'Pendaftaran & Kurasi Tamu Podcast Studio',
      description: 'Bagi Anda yang memiliki cerita inspiratif seputar industri kreatif, bagikan wawasan Anda di podcast kami.',
      themeColor: '#db2777',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Lengkap & Panggilan', required: true, options: [] },
        { id: 'q2', type: 'short_text', title: 'Profesi / Usaha / Keahlian Khusus', required: true, options: [] },
        { id: 'q3', type: 'paragraph', title: 'Topik Utama atau Sudut Pandang Unik yang Ingin Dibahas', required: true, options: [] },
        { id: 'q4', type: 'short_text', title: 'Tautan Akun Instagram / LinkedIn / YouTube', required: true, options: [] },
        {
          id: 'q5',
          type: 'multiple_choice',
          title: 'Preferensi Format Sesi Rekaman',
          required: true,
          options: [
            { id: 'o1', text: 'Hadir Langsung di Studio (Jakarta Selatan)' },
            { id: 'o2', text: 'Rekaman Online Jarak Jauh via Riverside / Zoom' }
          ]
        }
      ]
    }
  },
  {
    id: 'tmpl_commercial_video_brief',
    category: 'creative',
    categoryLabel: 'Kreatif & Media',
    title: 'Brief Produksi Video Iklan & Komersial',
    description: 'Perencanaan pembuatan video komersial: target audiens, durasi, moodboard visual, dan platform tayang.',
    themeColor: '#e11d48',
    questionCount: 5,
    schema: {
      title: 'Brief Kreatif Produksi Video Komersial',
      description: 'Lengkapi rincian konsep di bawah ini agar tim sutradara dan videografer dapat menyusun storyboard.',
      themeColor: '#e11d48',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Brand / Produk yang Akan Diiklankan', required: true, options: [] },
        {
          id: 'q2',
          type: 'dropdown',
          title: 'Tujuan Utama Video (Primary Objective)',
          required: true,
          options: [
            { id: 'o1', text: 'Peluncuran Produk Baru (Product Launch)' },
            { id: 'o2', text: 'Membangun Citra & Brand Awareness' },
            { id: 'o3', text: 'Iklan Konversi Penjualan Langsung (Direct Response)' }
          ]
        },
        {
          id: 'q3',
          type: 'checkboxes',
          title: 'Rencana Platform Distribusi Video',
          required: true,
          options: [
            { id: 'o1', text: 'Instagram Reels (9:16)' },
            { id: 'o2', text: 'TikTok Ads (9:16)' },
            { id: 'o3', text: 'YouTube Komersial (16:9)' },
            { id: 'o4', text: 'Videotron / Billboard Digital' }
          ]
        },
        { id: 'q4', type: 'paragraph', title: 'Pesan Utama (Key Message) yang Wajib Muncul dalam Video', required: true, options: [] },
        { id: 'q5', type: 'date', title: 'Target Tanggal Selesai Final Editing Video', required: true, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_influencer_collab',
    category: 'creative',
    categoryLabel: 'Kreatif & Media',
    title: 'Pengajuan Endorsement & KOL Campaign',
    description: 'Formulir kerjasama influencer: rate card paket postingan, demografi followers, dan syarat pengiriman produk.',
    themeColor: '#c026d3',
    questionCount: 5,
    schema: {
      title: 'Formulir Kerjasama KOL & Creator Campaign',
      description: 'Undangan kolaborasi kampanye berbayar untuk kreator konten gaya hidup, teknologi, dan kreatif.',
      themeColor: '#c026d3',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Kreator / Nama Agensi', required: true, options: [] },
        { id: 'q2', type: 'short_text', title: 'Username Akun Media Sosial Utama & Jumlah Pengikut', required: true, options: [] },
        {
          id: 'q3',
          type: 'checkboxes',
          title: 'Pilihan Deliverables yang Disepakati',
          required: true,
          options: [
            { id: 'o1', text: '1x Instagram Reel / TikTok Video' },
            { id: 'o2', text: '3x Instagram Stories dengan Tautan Swipe Up' },
            { id: 'o3', text: 'Ulasan Eksklusif di YouTube Video' },
            { id: 'o4', text: 'Kehadiran Langsung di Lokasi Acara' }
          ]
        },
        { id: 'q4', type: 'short_text', title: 'Alamat Lengkap Pengiriman Produk Sampel (Gift Package)', required: true, options: [] },
        { id: 'q5', type: 'short_text', title: 'Estimasi Rate Card / Biaya Jasa Kerjasama', required: false, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_bulk_wholesale',
    category: 'order',
    categoryLabel: 'Order & Transaksi',
    title: 'Pemesanan Grosir B2B & Volume Besar',
    description: 'Pengadaan barang dalam jumlah besar: kuantitas pesanan, kustomisasi logo, dan termin pembayaran.',
    themeColor: '#16a34a',
    questionCount: 5,
    schema: {
      title: 'Permohonan Harga Khusus Pesanan Grosir B2B',
      description: 'Dapatkan diskon bertingkat dan fasilitas pembayaran korporat untuk pemesanan minimal 100 unit.',
      themeColor: '#16a34a',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Perusahaan / Organisasi Pembeli', required: true, options: [] },
        { id: 'q2', type: 'short_text', title: 'Jenis Produk yang Diinginkan', required: true, options: [] },
        { id: 'q3', type: 'short_text', title: 'Estimasi Total Kuantitas (Jumlah Pcs / Box)', required: true, options: [] },
        {
          id: 'q4',
          type: 'multiple_choice',
          title: 'Kebutuhan Custom Cetak Logo Perusahaan',
          required: true,
          options: [
            { id: 'o1', text: 'Ya, butuh sablon / bordir / grafir logo kami' },
            { id: 'o2', text: 'Tidak, gunakan kemasan standar polos' }
          ]
        },
        { id: 'q5', type: 'date', title: 'Target Tanggal Pengiriman Tiba di Gudang', required: true, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_sponsorship_package',
    category: 'order',
    categoryLabel: 'Order & Transaksi',
    title: 'Paket Sponsorship & Booth Expo Event',
    description: 'Booking ruang pameran & sponsor acara: pilihan tier (Platinum, Gold, Silver), dan kebutuhan daya listrik.',
    themeColor: '#ca8a04',
    questionCount: 4,
    schema: {
      title: 'Booking Paket Sponsorship & Booth Pameran',
      description: 'Maksimalkan eksposur brand Anda di hadapan ribuan audiens dan praktisi industri.',
      themeColor: '#ca8a04',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Nama Brand / Perusahaan Sponsor', required: true, options: [] },
        {
          id: 'q2',
          type: 'dropdown',
          title: 'Pilihan Paket Sponsorship',
          required: true,
          options: [
            { id: 'o1', text: 'Platinum Sponsor - Main Stage & Booth 6x6m (Rp 50.000.000)' },
            { id: 'o2', text: 'Gold Sponsor - Booth 3x3m & Logo Banner (Rp 25.000.000)' },
            { id: 'o3', text: 'Silver Sponsor - Booth Standard 2x2m (Rp 12.500.000)' }
          ]
        },
        {
          id: 'q3',
          type: 'checkboxes',
          title: 'Kebutuhan Tambahan pada Booth',
          required: false,
          options: [
            { id: 'o1', text: 'Daya Listrik Tambahan (2200 VA)' },
            { id: 'o2', text: 'LED Screen Display 55 inch' },
            { id: 'o3', text: 'Meja Bar & Kursi Barstool Tambahan' }
          ]
        },
        { id: 'q4', type: 'short_text', title: 'Email Penanggung Jawab untuk Pengiriman Invoice Resmi', required: true, options: [] }
      ]
    }
  },
  {
    id: 'tmpl_service_ticket',
    category: 'order',
    categoryLabel: 'Order & Transaksi',
    title: 'Tiket Servis & Permintaan Maintenance',
    description: 'Pelaporan kendala pasca serah terima: tingkat urgensi, deskripsi kendala teknis, dan jam kunjungan teknisi.',
    themeColor: '#dc2626',
    questionCount: 4,
    schema: {
      title: 'Tiket Bantuan Teknis & Pemeliharaan Sistem',
      description: 'Layanan purna jual prioritas bagi klien aktif dengan jaminan respon cepat tim teknis.',
      themeColor: '#dc2626',
      acceptingResponses: true,
      autoSaveDrive: true,
      questions: [
        { id: 'q1', type: 'short_text', title: 'Kode Proyek / Nomor Kontrak Layanan', required: true, options: [] },
        {
          id: 'q2',
          type: 'multiple_choice',
          title: 'Tingkat Urgensi Kendala',
          required: true,
          options: [
            { id: 'o1', text: 'Kritis - Layanan Lumpuh Total (Down)' },
            { id: 'o2', text: 'Tinggi - Fitur Utama Terganggu Sebagian' },
            { id: 'o3', text: 'Normal - Pertanyaan Rutin / Permintaan Minor' }
          ]
        },
        { id: 'q3', type: 'paragraph', title: 'Kronologi Kendala & Pesan Error yang Muncul', required: true, options: [] },
        { id: 'q4', type: 'short_text', title: 'Kontak WhatsApp Personil yang Berada di Lokasi', required: true, options: [] }
      ]
    }
  }
];
