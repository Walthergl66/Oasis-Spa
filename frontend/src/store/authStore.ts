import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string;
}

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set: any) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user: AuthUser | null) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
