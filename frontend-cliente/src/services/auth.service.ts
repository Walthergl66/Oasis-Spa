/**
 * Autenticación. Mantiene la firma original (login / register / logout /
 * getCurrentUser) pero resuelve contra el repositorio local mientras NestJS no
 * emita JWT reales. El token de demo es reversible a propósito: sirve para
 * simular la sesión, no para proteger nada.
 */
import { ApiError, request, setAuthToken } from '../api/http';
import { clone, db, mutate, newId } from '../api/localDb';
import { initials } from '../mocks/seed';
import type { User } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

const TOKEN_KEY = 'oasis-spa-token';

function fakeToken(userId: string): string {
  return `demo.${btoa(userId)}.${Date.now().toString(36)}`;
}

function userIdFromToken(token: string): string | null {
  try {
    return atob(token.split('.')[1] ?? '');
  } catch {
    return null;
  }
}

export const authService = {
  /** POST /auth/login */
  login: (email: string, password: string): Promise<AuthResponse> =>
    request({
      method: 'post',
      path: '/auth/login',
      body: { email, password },
      mock: () => {
        const data = db();
        const normalized = email.trim().toLowerCase();
        const user = data.users.find(u => u.email.toLowerCase() === normalized);
        if (!user || data.credentials[user.email] !== password) {
          throw new ApiError('Correo o contraseña incorrectos.', 'INVALID_CREDENTIALS');
        }
        if (!user.active) throw new ApiError('Esta cuenta está desactivada.', 'INACTIVE');
        return { user: clone(user), token: fakeToken(user.id) };
      },
    }),

  /** POST /auth/register */
  register: (input: { name: string; email: string; password: string; phone?: string; city?: string }): Promise<AuthResponse> =>
    request({
      method: 'post',
      path: '/auth/register',
      body: input,
      mock: () =>
        mutate(data => {
          const normalized = input.email.trim().toLowerCase();
          if (data.users.some(u => u.email.toLowerCase() === normalized)) {
            throw new ApiError('Ya existe una cuenta con ese correo.', 'EMAIL_TAKEN');
          }
          if (input.password.length < 6) throw new ApiError('La contraseña debe tener al menos 6 caracteres.', 'WEAK_PASSWORD');

          const user: User = {
            id: newId('usr'),
            name: input.name.trim(),
            email: input.email.trim(),
            phone: input.phone?.trim() ?? '',
            city: input.city?.trim() || 'Manta, Manabí',
            role: 'cliente',
            initials: initials(input.name),
            memberSince: new Date().toISOString().slice(0, 10),
            points: 0,
            level: 'Bronce',
            favoriteServices: [],
            active: true,
          };
          data.users.push(user);
          data.credentials[user.email] = input.password;
          data.notifications.unshift({
            id: newId('ntf'), userId: user.id, icon: '🌿', title: '¡Bienvenida a Oasis Spa!',
            text: 'Tienes 20% de descuento en tu primer servicio. Luna puede agendarlo por ti.',
            createdAt: new Date().toISOString(), read: false,
          });
          return { user: clone(user), token: fakeToken(user.id) };
        }),
    }),

  /** POST /auth/logout */
  logout: async (): Promise<void> => {
    authService.clearToken();
  },

  /** GET /auth/me — rehidrata la sesión al recargar la página. */
  getCurrentUser: (): Promise<User> =>
    request({
      method: 'get',
      path: '/auth/me',
      mock: () => {
        const token = authService.getToken();
        const id = token ? userIdFromToken(token) : null;
        const user = id ? db().users.find(u => u.id === id) : undefined;
        if (!user) throw new ApiError('Sesión no válida.', 'UNAUTHORIZED');
        return clone(user);
      },
    }),

  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),

  saveToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
  },

  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
  },
};
