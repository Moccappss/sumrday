export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankLogo?: string;
  color?: string;
}

export interface QrisProfile {
  enabled: boolean;
  imageUrl: string;
  merchantName?: string;
  instruction?: string;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string; // or x
  facebook?: string;
  github?: string;
  telegram?: string;
  discord?: string;
  threads?: string;
}

export interface BusinessProfile {
  // 1. Identitas Brand & Usaha
  brandName: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;

  // 2. Kontak Terpadu
  whatsapp: string;
  whatsappAlt?: string;
  email: string;
  address?: string;
  city?: string;
  operatingHours?: string;

  // 3. Seluruh Sosial Media
  socials: SocialLinks;

  // 4. Rekening Bank & QRIS Pribadi (0% Fee)
  bankAccounts: BankAccount[];
  qris: QrisProfile;

  updatedAt?: string;
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  brandName: 'sumr.day | Creative Digital Studio',
  tagline: 'A little sunshine for your screen',
  description: 'Creative Digital Studio berkonsep Warm Tech & Skena-Aesthetic yang menghadirkan interaksi digital (undangan web, landing page, aset visual) secara hangat, santai, dan penuh energi positif khas musim panas.',
  logoUrl: '',
  websiteUrl: '',

  whatsapp: '081234567890',
  whatsappAlt: '',
  email: 'hi.sumrday@gmail.com',
  address: 'Jl. Pemuda Kreatif No. 88, Jakarta Selatan',
  city: 'DKI Jakarta',
  operatingHours: 'Senin - Sabtu: 08.00 - 21.00 WIB',

  socials: {
    instagram: 'sumrday.studio',
    tiktok: 'sumrday.studio',
    youtube: '@sumrday',
    linkedin: 'sumrday',
    twitter: 'sumrday',
    facebook: 'sumrday',
    github: 'sumrday',
    telegram: 'sumrdayadmin',
    discord: '',
    threads: 'sumrday.studio'
  },

  bankAccounts: [
    {
      id: 'bank_bca_default',
      bankName: 'BCA',
      accountNumber: '1234567890',
      accountName: 'ARIF DARMAWAN',
      color: '#003399'
    },
    {
      id: 'bank_mandiri_default',
      bankName: 'Mandiri',
      accountNumber: '9876543210123',
      accountName: 'ARIF DARMAWAN',
      color: '#002d62'
    }
  ],

  qris: {
    enabled: true,
    imageUrl: '',
    merchantName: 'SUMR.DAY STUDIO',
    instruction: 'Scan QRIS dari m-Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (GoPay, OVO, ShopeePay, DANA) bebas biaya admin.'
  }
};
