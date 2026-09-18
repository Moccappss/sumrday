export type UpdateStickerType = 'poll' | 'this_or_that' | 'slider_rate' | 'qna';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollSticker {
  type: 'poll';
  question: string;
  options: PollOption[];
}

export interface ThisOrThatSticker {
  type: 'this_or_that';
  question: string;
  optionA: { id: string; text: string; emoji?: string; votes: number };
  optionB: { id: string; text: string; emoji?: string; votes: number };
}

export interface SliderRateSticker {
  type: 'slider_rate';
  question: string;
  emoji: string; // e.g. "☀️", "🔥", "☕", "⭐", "❤️"
  minLabel?: string; // e.g. "Biasa"
  maxLabel?: string; // e.g. "Hangat Pol! ☀️"
  totalScore: number; // total accumulated score
  ratingsCount: number; // total number of ratings
  averageScore: number; // average score 0 - 100
}

export interface QnAResponse {
  id: string;
  text: string;
  authorName?: string;
  createdAt: string;
}

export interface QnASticker {
  type: 'qna';
  prompt: string;
  placeholder?: string;
  responses?: QnAResponse[];
}

export type UpdateSticker = PollSticker | ThisOrThatSticker | SliderRateSticker | QnASticker;

export interface SocialUpdate {
  id: string;
  content: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'mixed';
  projectTag?: string;
  projectUrl?: string;
  customDate: string; // ISO date format 'YYYY-MM-DD' or timestamp string, supports backdating
  createdAt: string;
  likesCount: number;
  isPinned?: boolean;
  isPublished: boolean;
  sticker?: UpdateSticker;
  author?: {
    name: string;
    role: string;
    avatar: string;
  };
}

export const DEFAULT_SOCIAL_UPDATES: SocialUpdate[] = [
  {
    id: 'upd-1',
    content: `Memulai pekan cerah dengan merilis sistem desain v2.0 untuk sumr.day! ☀️ Menyatukan estetika skena yang santai dengan arsitektur web modern yang super snappy.

Beberapa pilar yang kami prioritaskan:
• Arsitektur komponen modular berbasis token yang clean
• Aksen warna Warm Tech bernuansa musim panas yang ramah di mata
• Micro-interactions yang playful dan responsif tanpa membebani performa

A little sunshine for your screen! Bagikan impresi kalian dan selamat berkreasi bersama sumr.day club! 🚀✨`,
    mediaUrls: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'
    ],
    mediaType: 'image',
    projectTag: 'Design System v2.0',
    projectUrl: '/portfolio',
    customDate: '2026-09-15',
    createdAt: '2026-09-15T09:00:00.000Z',
    likesCount: 58,
    isPinned: true,
    isPublished: true,
    sticker: {
      type: 'slider_rate',
      question: 'Seberapa hangat vibe Design System v2.0 sumr.day?',
      emoji: '☀️',
      minLabel: 'Biasa Saja',
      maxLabel: 'Hangat Pol! ☀️',
      totalScore: 4032,
      ratingsCount: 42,
      averageScore: 96
    },
    author: {
      name: 'sumr.day',
      role: 'Creative Digital Studio • Warm Tech & Skena-Aesthetic',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    }
  },
  {
    id: 'upd-2',
    content: `Behind the scenes: Eksplorasi konsep undangan web interaktif untuk festival musim panas. Kami menggabungkan typography skena yang bold, RSVP real-time, dan playlist musik lo-fi yang hangat. 🎶🏖️

Pendekatan kami sederhana: setiap interaksi digital harus terasa personal, tidak kaku, dan membangkitkan senyum saat dibuka di layar smartphone.`,
    mediaUrls: [
      'https://images.unsplash.com/photo-1581291518655-9523c932edcf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80'
    ],
    mediaType: 'image',
    projectTag: 'Undangan Web Estetik',
    projectUrl: '/portfolio',
    customDate: '2025-07-20',
    createdAt: '2025-07-20T14:30:00.000Z',
    likesCount: 84,
    isPinned: false,
    isPublished: true,
    sticker: {
      type: 'this_or_that',
      question: 'Mana konsep undangan web favoritmu untuk event skena?',
      optionA: { id: 'opt-a', text: 'Lo-Fi Chill & Playlist', emoji: '🎧', votes: 62 },
      optionB: { id: 'opt-b', text: 'Summer Fest & RSVP Bold', emoji: '🏖️', votes: 38 }
    },
    author: {
      name: 'sumr.day',
      role: 'Creative Digital Studio • Warm Tech & Skena-Aesthetic',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    }
  },
  {
    id: 'upd-3',
    content: `Kilas balik awal mula studio: Dari eksperimen visual santai hingga lahir menjadi creative digital studio berkonsep Warm Tech & Skena-Aesthetic.

Terima kasih untuk seluruh sumr.day club yang selalu menemani perjalanan ini! Banyak ide-ide segar berikutnya yang siap kami hadirkan di layar kalian. ☀️💛`,
    mediaUrls: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    ],
    mediaType: 'image',
    projectTag: 'sumr.day club',
    projectUrl: '',
    customDate: '2024-03-12',
    createdAt: '2024-03-12T10:15:00.000Z',
    likesCount: 112,
    isPinned: false,
    isPublished: true,
    sticker: {
      type: 'qna',
      prompt: 'Punya ide atau saran proyek digital seru bareng sumr.day club? Tulis di sini! ☀️',
      placeholder: 'Tulis ide kreatif atau sapaanmu...',
      responses: [
        { id: 'res-1', text: 'Bikin template website portofolio interaktif dengan animasi lo-fi dong kak!', authorName: 'Rian D.', createdAt: '2026-09-16T11:20:00.000Z' },
        { id: 'res-2', text: 'Vibe warm tech-nya seger banget, suka banget perpaduan warnanya ✨', authorName: 'Maya K.', createdAt: '2026-09-17T08:15:00.000Z' }
      ]
    },
    author: {
      name: 'sumr.day',
      role: 'Creative Digital Studio • Warm Tech & Skena-Aesthetic',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    }
  }
];
