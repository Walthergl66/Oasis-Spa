/**
 * Usuarios: perfil de la clienta y base de clientas del administrador.
 * Refleja el módulo `users` de NestJS.
 */
import { ApiError, request } from '../api/http';
import { clone, db, mutate } from '../api/localDb';
import { initials } from '../mocks/seed';
import type { ClientSummary, User } from '../types';

export interface ProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
}

/** Métricas derivadas de las citas: visitas, gasto y última visita. */
function summarize(user: User): ClientSummary {
  const completed = db().appointments.filter(a => a.clientId === user.id && a.status === 'completada');
  const spent = completed.reduce((sum, a) => sum + a.price, 0);
  const last = completed
    .map(a => a.start)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  const daysSinceLast = last ? (Date.now() - new Date(last).getTime()) / 86_400_000 : Infinity;
  const status: ClientSummary['status'] =
    completed.length === 0 ? 'Nueva' : daysSinceLast > 60 ? 'Inactiva' : 'Activa';

  return { client: clone(user), visits: completed.length, spent, lastVisit: last, status };
}

export const userService = {
  /** GET /users/:id */
  getProfile: (userId: string): Promise<User> =>
    request({
      method: 'get',
      path: `/users/${userId}`,
      mock: () => {
        const user = db().users.find(u => u.id === userId);
        if (!user) throw new ApiError('El usuario no existe.', 'NOT_FOUND');
        return clone(user);
      },
    }),

  /** GET /users/:id/summary — perfil + métricas de fidelidad. */
  getSummary: (userId: string): Promise<ClientSummary> =>
    request({
      method: 'get',
      path: `/users/${userId}/summary`,
      mock: () => {
        const user = db().users.find(u => u.id === userId);
        if (!user) throw new ApiError('El usuario no existe.', 'NOT_FOUND');
        return summarize(user);
      },
    }),

  /** PATCH /users/:id */
  updateProfile: (userId: string, changes: ProfileInput): Promise<User> =>
    request({
      method: 'patch',
      path: `/users/${userId}`,
      body: changes,
      mock: () =>
        mutate(data => {
          const user = data.users.find(u => u.id === userId);
          if (!user) throw new ApiError('El usuario no existe.', 'NOT_FOUND');
          if (changes.email && changes.email.trim().toLowerCase() !== user.email.toLowerCase()) {
            const taken = data.users.some(
              u => u.id !== userId && u.email.toLowerCase() === changes.email!.trim().toLowerCase(),
            );
            if (taken) throw new ApiError('Ese correo ya está en uso.', 'EMAIL_TAKEN');
            const password = data.credentials[user.email];
            delete data.credentials[user.email];
            data.credentials[changes.email.trim()] = password;
          }
          if (changes.name !== undefined) user.name = changes.name.trim();
          if (changes.email !== undefined) user.email = changes.email.trim();
          if (changes.phone !== undefined) user.phone = changes.phone.trim();
          if (changes.city !== undefined) user.city = changes.city.trim();
          user.initials = initials(user.name);
          data.appointments.forEach(a => {
            if (a.clientId === userId) a.clientName = user.name;
          });
          return clone(user);
        }),
    }),

  /** PATCH /users/:id/favorites — añade o quita un servicio favorito. */
  toggleFavorite: (userId: string, serviceName: string): Promise<User> =>
    request({
      method: 'patch',
      path: `/users/${userId}/favorites`,
      body: { serviceName },
      mock: () =>
        mutate(data => {
          const user = data.users.find(u => u.id === userId);
          if (!user) throw new ApiError('El usuario no existe.', 'NOT_FOUND');
          user.favoriteServices = user.favoriteServices.includes(serviceName)
            ? user.favoriteServices.filter(f => f !== serviceName)
            : [...user.favoriteServices, serviceName];
          return clone(user);
        }),
    }),

  /** GET /users?role=cliente (admin) — base de clientas con sus métricas. */
  listClients: (search = ''): Promise<ClientSummary[]> =>
    request({
      method: 'get',
      path: '/users',
      params: { role: 'cliente', search },
      mock: () => {
        const term = search.trim().toLowerCase();
        return db()
          .users.filter(u => u.role === 'cliente')
          .filter(u => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
          .map(summarize)
          .sort((a, b) => b.spent - a.spent);
      },
    }),
};
