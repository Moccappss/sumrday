export interface FormHeaderTheme {
  id: string;
  name: string;
  category: 'minimal' | 'creative' | 'tech' | 'vibrant';
  bannerUrl: string;
  defaultColor: string;
}

export const QUESTION_CARD_COLORS = [
  { id: 'default', name: 'Default (Tema)', color: '', bg: '' },
  { id: 'purple', name: 'Violet Glow', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.07)' },
  { id: 'indigo', name: 'Indigo Space', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.07)' },
  { id: 'blue', name: 'Sky Cyan', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.07)' },
  { id: 'emerald', name: 'Mint Emerald', color: '#10b981', bg: 'rgba(16, 185, 129, 0.07)' },
  { id: 'amber', name: 'Warm Amber', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.07)' },
  { id: 'rose', name: 'Rose Coral', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.07)' },
  { id: 'slate', name: 'Dark Slate', color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' }
];

export const FORM_HEADER_THEMES: FormHeaderTheme[] = [
  {
    id: 'theme_abstract_purple',
    name: 'Cosmic Violet',
    category: 'vibrant',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    defaultColor: '#673ab7'
  },
  {
    id: 'theme_gradient_blue',
    name: 'Ocean Gradient',
    category: 'tech',
    bannerUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80',
    defaultColor: '#0284c7'
  },
  {
    id: 'theme_emerald_flow',
    name: 'Emerald Aurora',
    category: 'creative',
    bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    defaultColor: '#10b981'
  },
  {
    id: 'theme_warm_sunset',
    name: 'Sunset Dream',
    category: 'vibrant',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    defaultColor: '#f59e0b'
  },
  {
    id: 'theme_minimal_monochrome',
    name: 'Minimal Dark Architecture',
    category: 'minimal',
    bannerUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    defaultColor: '#334155'
  },
  {
    id: 'theme_creative_pastel',
    name: 'Creative Studio Canvas',
    category: 'creative',
    bannerUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
    defaultColor: '#ec4899'
  }
];
