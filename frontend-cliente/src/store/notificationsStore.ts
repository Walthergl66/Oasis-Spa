/** Notificaciones del usuario autenticado (campana del encabezado). */
import { create } from 'zustand';
import { notificationsService } from '../services/notifications.service';
import type { AppNotification } from '../types';

interface NotificationsStore {
  items: AppNotification[];
  userId: string | null;
  load: (userId: string) => Promise<void>;
  reload: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  items: [],
  userId: null,

  load: async userId => {
    const items = await notificationsService.list(userId);
    set({ items, userId });
  },

  reload: async () => {
    const { userId, load } = get();
    if (userId) await load(userId);
  },

  markAllRead: async () => {
    const { userId } = get();
    if (!userId) return;
    await notificationsService.markAllRead(userId);
    set(state => ({ items: state.items.map(n => ({ ...n, read: true })) }));
  },

  markRead: async id => {
    await notificationsService.markRead(id);
    set(state => ({ items: state.items.map(n => (n.id === id ? { ...n, read: true } : n)) }));
  },
}));
