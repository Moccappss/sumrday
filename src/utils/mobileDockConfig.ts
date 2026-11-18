export type MobileDockIconKey =
  | 'home'
  | 'folder'
  | 'bag'
  | 'tag'
  | 'sparkles'
  | 'book'
  | 'info'
  | 'gamepad'
  | 'chat'
  | 'cart'
  | 'user'
  | 'link'
  | 'globe'
  | 'star'
  | 'compass'
  | 'layers';

export interface MobileDockCustomItem {
  id: string;
  label: string;
  url: string;
  icon: MobileDockIconKey;
  enabled: boolean;
  isHighlight?: boolean;
}

export interface MobileDockConfig {
  enabled?: boolean;
  displayMode?: 'icon-only' | 'icon-text';
  items?: {
    home?: boolean;
    portfolio?: boolean;
    catalog?: boolean;
    whatsapp?: boolean;
    cart?: boolean;
    account?: boolean;
  };
  customItems?: MobileDockCustomItem[];
}

export const DOCK_PRESET_PAGES: Omit<MobileDockCustomItem, 'enabled'>[] = [
  { id: 'home', label: 'Beranda', url: '/', icon: 'home' },
  { id: 'portfolio', label: 'Portofolio', url: '/portofolio', icon: 'folder' },
  { id: 'catalog', label: 'Katalog', url: '/katalog', icon: 'bag' },
  { id: 'ratecard', label: 'Rate Card', url: '/rate-card', icon: 'tag' },
  { id: 'updates', label: 'Updates', url: '/updates', icon: 'sparkles' },
  { id: 'blog', label: 'Blog', url: '/blog', icon: 'book' },
  { id: 'about', label: 'Tentang', url: '/about', icon: 'info' },
  { id: 'games', label: 'Games', url: '/games', icon: 'gamepad' },
  { id: 'links', label: 'Links', url: '/links', icon: 'layers' },
  { id: 'whatsapp', label: 'Live Chat', url: '#chat', icon: 'chat', isHighlight: true },
  { id: 'cart', label: 'Keranjang', url: '/keranjang', icon: 'cart' },
  { id: 'account', label: 'Akun Klien', url: '/akun', icon: 'user' },
];

export const DOCK_ICON_OPTIONS: { key: MobileDockIconKey; label: string }[] = [
  { key: 'home', label: 'Beranda' },
  { key: 'folder', label: 'Portofolio' },
  { key: 'bag', label: 'Katalog' },
  { key: 'tag', label: 'Harga' },
  { key: 'sparkles', label: 'Updates' },
  { key: 'book', label: 'Artikel' },
  { key: 'info', label: 'Tentang' },
  { key: 'gamepad', label: 'Games' },
  { key: 'chat', label: 'Chat' },
  { key: 'cart', label: 'Keranjang' },
  { key: 'user', label: 'Akun' },
  { key: 'link', label: 'Tautan' },
  { key: 'globe', label: 'Web' },
  { key: 'star', label: 'Unggulan' },
  { key: 'compass', label: 'Jelajah' },
  { key: 'layers', label: 'Halaman' },
];

export const DEFAULT_DOCK_CONFIG: MobileDockConfig = {
  enabled: true,
  displayMode: 'icon-only',
  items: {
    home: true,
    portfolio: true,
    catalog: true,
    whatsapp: true,
    cart: true,
    account: true,
  },
};

/**
 * Resolves the ordered list of dock items from config.
 * Falls back cleanly to legacy `items` booleans if `customItems` has not been set yet.
 */
export function resolveMobileDockItems(config?: MobileDockConfig): MobileDockCustomItem[] {
  if (Array.isArray(config?.customItems) && config.customItems.length > 0) {
    return config.customItems;
  }
  const legacy = config?.items || DEFAULT_DOCK_CONFIG.items || {};
  return [
    { id: 'home', label: 'Home', url: '/', icon: 'home', enabled: legacy.home !== false },
    { id: 'portfolio', label: 'Karya', url: '/portofolio', icon: 'folder', enabled: legacy.portfolio !== false },
    { id: 'catalog', label: 'Katalog', url: '/katalog', icon: 'bag', enabled: legacy.catalog !== false },
    { id: 'whatsapp', label: 'Chat', url: '#chat', icon: 'chat', enabled: legacy.whatsapp !== false, isHighlight: true },
    { id: 'cart', label: 'Cart', url: '/keranjang', icon: 'cart', enabled: legacy.cart !== false },
    { id: 'account', label: 'Akun', url: '/akun', icon: 'user', enabled: legacy.account !== false },
  ];
}
