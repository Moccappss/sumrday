import { create } from 'zustand';
import type { AdminDrawerType } from '../types/adminEvents';

export interface AdminState {
  // Navigation & View
  activePage: string;
  setActivePage: (page: string) => void;
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  isZenMode: boolean;
  toggleZenMode: () => void;

  // Global Search & Palette
  isGlobalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Active Global Modals
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  modalPayload: any;
  openModalWithPayload: (modal: string, payload?: any) => void;
  closeActiveModal: () => void;

  // Notifications & Badges
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;

  // Multitasking Quick Drawer
  activeDrawer: AdminDrawerType | null;
  drawerPayload: any;
  openDrawer: (drawer: AdminDrawerType, payload?: any) => void;
  closeDrawer: () => void;

  // Studio Real-time Sync & Refresh Trigger
  refreshNonce: number;
  triggerRefresh: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  activePage: typeof window !== 'undefined' ? (localStorage.getItem('porto_active_page') || 'dashboard') : 'dashboard',
  setActivePage: (activePage) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('porto_active_page', activePage);
    }
    set({ activePage });
  },

  isSidebarExpanded: typeof window !== 'undefined' ? (localStorage.getItem('cms_sidebar_expanded') !== 'false') : true,
  toggleSidebar: () => set((state) => {
    const next = !state.isSidebarExpanded;
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms_sidebar_expanded', String(next));
    }
    return { isSidebarExpanded: next };
  }),
  setSidebarExpanded: (isSidebarExpanded) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cms_sidebar_expanded', String(isSidebarExpanded));
    }
    set({ isSidebarExpanded });
  },

  isZenMode: false,
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),

  isGlobalSearchOpen: false,
  setGlobalSearchOpen: (isGlobalSearchOpen) => set({ isGlobalSearchOpen }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  activeModal: null,
  setActiveModal: (activeModal) => set({ activeModal }),
  modalPayload: null,
  openModalWithPayload: (modal, payload = null) => set({ activeModal: modal, modalPayload: payload }),
  closeActiveModal: () => set({ activeModal: null, modalPayload: null }),

  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),

  activeDrawer: null,
  drawerPayload: null,
  openDrawer: (drawer, payload = null) => set({ activeDrawer: drawer, drawerPayload: payload }),
  closeDrawer: () => set({ activeDrawer: null, drawerPayload: null }),

  refreshNonce: 0,
  triggerRefresh: () => set((state) => ({ refreshNonce: state.refreshNonce + 1 })),
}));
