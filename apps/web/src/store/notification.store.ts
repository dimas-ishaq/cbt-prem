import { create } from 'zustand';
import api from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'read'>) => void;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  setFromList: (list: Notification[]) => void;
}

function mergeNotifications(existing: Notification[], incoming: Notification[]) {
  const map = new Map<string, Notification>();

  for (const item of existing) {
    map.set(item.id, item);
  }

  for (const item of incoming) {
    const current = map.get(item.id);
    map.set(item.id, current ? { ...current, ...item, read: current.read || item.read } : item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) {
        return state;
      }

      return {
        notifications: [{ ...notification, read: false }, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    }),

  markAllRead: async () => {
    const previous = get().notifications;
    const previousUnreadCount = get().unreadCount;

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));

    try {
      await api.patch('/notifications/me/read-all');
    } catch {
      set({
        notifications: previous,
        unreadCount: previousUnreadCount,
      });
    }
  },

  markRead: async (id) => {
    const previous = get().notifications;
    const previousUnreadCount = get().unreadCount;

    set((state) => {
      const next = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: next,
        unreadCount: next.filter((n) => !n.read).length,
      };
    });

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      set({
        notifications: previous,
        unreadCount: previousUnreadCount,
      });
    }
  },

  setFromList: (list) =>
    set((state) => {
      const normalized = list.map((item) => ({
        ...item,
        read: Boolean(item.read),
      }));
      const notifications = mergeNotifications(state.notifications, normalized);

      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),
}));
