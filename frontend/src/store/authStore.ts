/** Sesión del usuario. Se rehidrata desde el token guardado al abrir la app. */
import { create } from 'zustand';
import { errorMessage } from '../api/http';
import { authService } from '../services/auth.service';
import type { User } from '../types';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  /** 'loading' mientras se rehidrata la sesión: evita parpadeos de rutas. */
  status: 'loading' | 'ready';
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  status: 'loading',
  error: null,

  hydrate: async () => {
    if (!authService.getToken()) {
      set({ status: 'ready', user: null, isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, status: 'ready', error: null });
    } catch {
      authService.clearToken();
      set({ user: null, isAuthenticated: false, status: 'ready' });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const { user, token } = await authService.login(email, password);
      authService.saveToken(token);
      set({ user, isAuthenticated: true, status: 'ready' });
      return user;
    } catch (error) {
      set({ error: errorMessage(error) });
      throw error;
    }
  },

  register: async input => {
    set({ error: null });
    try {
      const { user, token } = await authService.register(input);
      authService.saveToken(token);
      set({ user, isAuthenticated: true, status: 'ready' });
      return user;
    } catch (error) {
      set({ error: errorMessage(error) });
      throw error;
    }
  },

  logout: () => {
    authService.clearToken();
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: user => set({ user, isAuthenticated: !!user }),

  refresh: async () => {
    const current = get().user;
    if (!current) return;
    try {
      const user = await authService.getCurrentUser();
      set({ user });
    } catch {
      // Si el token dejó de ser válido se conserva la sesión actual en memoria.
    }
  },
}));
