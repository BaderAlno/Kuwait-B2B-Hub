import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  action_url: string;
  icon_type: string;
  created_at: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  bellAnimating: boolean;
  isDropdownOpen: boolean;

  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  triggerBellAnimation: () => void;
  toggleDropdown: () => void;
  closeDropdown: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  bellAnimating: false,
  isDropdownOpen: false,

  setNotifications: (notifications) => set({ notifications }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  triggerBellAnimation: () => {
    set({ bellAnimating: true });
    setTimeout(() => set({ bellAnimating: false }), 700);
  },

  toggleDropdown: () =>
    set((state) => ({ isDropdownOpen: !state.isDropdownOpen })),

  closeDropdown: () => set({ isDropdownOpen: false }),
}));
