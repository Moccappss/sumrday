export interface ClientFlipbook {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  description?: string;
  pdfUrl?: string;
  totalPages: number;
  paperSize?: 'a4' | 'us-letter' | 'square' | 'landscape' | 'custom';
  aspectRatio?: number; // width / height, e.g. 0.7071 for A4 portrait
  allowDownload: boolean;
  defaultViewMode: 'double' | 'single';
  isDark?: boolean;
  accentColor?: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_FLIPBOOKS: ClientFlipbook[] = [
  {
    id: 'fb-sumrday-brandbook',
    slug: 'sumrday-brandbook',
    title: 'sumr.day Visual Brand Guideline & Design System 2026',
    clientName: 'sumr.day Studio',
    description: 'Panduan identitas visual resmi, filosofi Warm Tech, sistem tipografi, dan token desain studio.',
    pdfUrl: '',
    totalPages: 8,
    paperSize: 'a4',
    aspectRatio: 0.7071,
    allowDownload: true,
    defaultViewMode: 'double',
    isDark: true,
    accentColor: '#f59e0b',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fb-client-lookbook-2026',
    slug: 'editorial-lookbook',
    title: 'Editorial Creative Lookbook & Portfolio Showcase',
    clientName: 'Klien Kolaborasi',
    description: 'Pratinjau kurasi portofolio interaktif, layout majalah digital, dan studi kasus desain spasial.',
    pdfUrl: '',
    totalPages: 8,
    paperSize: 'a4',
    aspectRatio: 0.7071,
    allowDownload: true,
    defaultViewMode: 'double',
    isDark: false,
    accentColor: '#D95629',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
