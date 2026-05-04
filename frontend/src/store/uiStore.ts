import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state: UIStore) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
}));
