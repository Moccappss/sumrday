import { create } from 'zustand'
import type { AppSettings, PageSettings } from '../hooks/useAppTheme'

interface AppState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  settings: AppSettings | null
  setSettings: (settings: AppSettings) => void
  customPages: PageSettings[]
  setCustomPages: (pages: PageSettings[]) => void
  shopEnabled: boolean
  setShopEnabled: (enabled: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  settings: null,
  setSettings: (settings) => set({ settings }),
  customPages: [],
  setCustomPages: (customPages) => set({ customPages }),
  shopEnabled: false,
  setShopEnabled: (shopEnabled) => set({ shopEnabled }),
}))

