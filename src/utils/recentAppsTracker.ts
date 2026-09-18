export interface RecentAppItem {
  id: string;
  module: string;
  label: string;
  title: string;
  subTitle?: string;
  statePayload?: any;
  icon?: string;
  timestamp: number;
}

const STORAGE_KEY = 'porto_recent_apps_v2';
const MAX_RECENT_ITEMS = 15;

export const getRecentApps = (): RecentAppItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return [
    {
      id: 'dash_default',
      module: 'dashboard',
      label: 'Dashboard Utama',
      title: 'Dashboard',
      subTitle: 'Overview Sistem',
      timestamp: Date.now()
    }
  ];
};

export const trackRecentApp = (item: {
  id?: string;
  module: string;
  label: string;
  title?: string;
  subTitle?: string;
  statePayload?: any;
  icon?: string;
}) => {
  try {
    const current = getRecentApps();
    const itemId = item.id || `rec_${item.module}_${Date.now()}`;
    const cleanLabel = (item.label || item.title || item.module).trim();
    const cleanTitle = (item.title || item.label || item.module).trim();

    // Filter out previous duplicate by id or same label & module
    const filtered = current.filter(
      i => i.id !== itemId && !(i.module === item.module && i.label === cleanLabel)
    );

    const newItem: RecentAppItem = {
      id: itemId,
      module: item.module,
      label: cleanLabel,
      title: cleanTitle,
      subTitle: item.subTitle || 'Aktivitas Terakhir',
      statePayload: item.statePayload || null,
      icon: item.icon || item.module,
      timestamp: Date.now()
    };

    const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global event for instant UI update
    window.dispatchEvent(
      new CustomEvent('porto_track_recent_item', { detail: newItem })
    );
  } catch (e) {
    console.error('Error tracking recent item:', e);
  }
};

export const removeRecentApp = (id: string) => {
  try {
    const current = getRecentApps();
    const updated = current.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('porto_track_recent_item'));
  } catch (e) {}
};

export const clearRecentApps = () => {
  try {
    const defaultList: RecentAppItem[] = [
      {
        id: 'dash_default',
        module: 'dashboard',
        label: 'Dashboard Utama',
        title: 'Dashboard',
        subTitle: 'Overview Sistem',
        timestamp: Date.now()
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultList));
    window.dispatchEvent(new Event('porto_track_recent_item'));
  } catch (e) {}
};
