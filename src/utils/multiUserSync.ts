import { storage } from './storage';

/**
 * Multi-user Real-time Edit & Page Update Tracking System.
 * Maps data keys to admin sidebar modules and builder page slugs.
 */

export const KEY_TO_PAGE_MAP: Record<string, { module: string; subPages?: string[]; label: string }> = {
  'porto_projects_data': { module: 'projects', label: 'Proyek' },
  'porto_projects':      { module: 'projects', label: 'Proyek' },
  'porto_main_website':  { module: 'website',  label: 'Website' },
  'porto_links':         { module: 'links',    label: 'Bio Links' },
  'porto_transactions':  { module: 'transactions', label: 'Transaksi' },
  'porto_chats':         { module: 'chat',     label: 'Chat' },
  'porto_memo':          { module: 'notes',    label: 'Catatan' },
  'porto_canvas':        { module: 'notes',    label: 'Whiteboard' },
  'porto_pages_data':    { module: 'builder',  label: 'Halaman Builder' },
  'porto_stickers_data': { module: 'builder',  label: 'Stiker & Interaksi' },
  'porto_settings':      { module: 'settings', label: 'Pengaturan' },
  'porto_catalog':       { module: 'katalog',  label: 'Katalog' }
};

const STORAGE_KEY = 'porto_updated_pages_dots';

export const getUpdatedPages = (): Record<string, boolean> => {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

export const markPageAsUpdated = (pageOrModule: string, label?: string, actor?: string) => {
  if (typeof window === 'undefined') return;
  const current = getUpdatedPages();
  current[pageOrModule] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

  // Dispatch event for AdminSidebar and ToolkitSidebar dots only — no toast/sound
  window.dispatchEvent(new CustomEvent('porto_page_dots_updated', { detail: current }));
};

export const clearPageUpdateDot = (pageOrModule: string) => {
  if (typeof window === 'undefined') return;
  const current = getUpdatedPages();
  if (current[pageOrModule] || current['builder'] || current['notes'] || current['settings']) {
    delete current[pageOrModule];
    // Also clear module umbrella if all sub-items are cleared
    if (pageOrModule === 'home' || pageOrModule === 'portofolio' || pageOrModule === 'biodata') {
      const hasOtherBuilder = Object.keys(current).some(k => k !== 'builder' && ['home', 'portofolio', 'biodata'].includes(k));
      if (!hasOtherBuilder) delete current['builder'];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('porto_page_dots_updated', { detail: current }));
  }
};

export const clearAllUpdateDots = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('porto_page_dots_updated', { detail: {} }));
};

/**
 * Intelligent Conflict-Free Collection Merger for Multi-User Editing
 * Merges items by unique ID while preserving recent edits based on updatedAt timestamp
 */
export const mergeCollectionsById = <T extends { id: string | number; updatedAt?: number | string }>(
  localItems: T[],
  remoteItems: T[]
): T[] => {
  if (!Array.isArray(localItems)) return remoteItems || [];
  if (!Array.isArray(remoteItems)) return localItems || [];

  const map = new Map<string | number, T>();

  // Add all local items
  localItems.forEach(item => {
    if (item && item.id !== undefined) map.set(item.id, item);
  });

  // Merge remote items, picking the one with latest timestamp or non-destructive fields
  remoteItems.forEach(remoteItem => {
    if (!remoteItem || remoteItem.id === undefined) return;
    const localItem = map.get(remoteItem.id);
    if (!localItem) {
      map.set(remoteItem.id, remoteItem);
    } else {
      const localTime = new Date(localItem.updatedAt || 0).getTime();
      const remoteTime = new Date(remoteItem.updatedAt || 0).getTime();
      if (remoteTime > localTime) {
        map.set(remoteItem.id, { ...localItem, ...remoteItem });
      } else {
        map.set(remoteItem.id, { ...remoteItem, ...localItem });
      }
    }
  });

  return Array.from(map.values());
};
