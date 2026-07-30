/** Notificaciones del usuario. Refleja el módulo `notifications` de NestJS. */
import { request } from '../api/http';
import { clone, db, mutate } from '../api/localDb';
import type { AppNotification } from '../types';

export const notificationsService = {
  /** GET /notifications */
  list: (userId: string): Promise<AppNotification[]> =>
    request({
      method: 'get',
      path: '/notifications',
      params: { userId },
      mock: () =>
        clone(
          db()
            .notifications.filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        ),
    }),

  /** PATCH /notifications/:id/read */
  markRead: (id: string): Promise<{ ok: boolean }> =>
    request({
      method: 'patch',
      path: `/notifications/${id}/read`,
      mock: () =>
        mutate(data => {
          const notification = data.notifications.find(n => n.id === id);
          if (notification) notification.read = true;
          return { ok: true };
        }),
    }),

  /** PATCH /notifications/read-all */
  markAllRead: (userId: string): Promise<{ ok: boolean }> =>
    request({
      method: 'patch',
      path: '/notifications/read-all',
      body: { userId },
      mock: () =>
        mutate(data => {
          data.notifications.forEach(n => {
            if (n.userId === userId) n.read = true;
          });
          return { ok: true };
        }),
    }),
};
