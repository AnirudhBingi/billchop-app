import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'expense' | 'chore' | 'budget' | 'settlement' | 'reminder' | 'goal' | 'social';
  category: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  isRead: boolean;
  actionable?: boolean;
  actionData?: any;
  userId: string;
}

export interface NotificationSettings {
  enabled: boolean;
  expenses: {
    newExpense: boolean;
    expenseUpdated: boolean;
    paymentReminder: boolean;
    weeklyReport: boolean;
  };
  chores: {
    choreAssigned: boolean;
    choreCompleted: boolean;
    choreOverdue: boolean;
    pointsEarned: boolean;
  };
  budgets: {
    budgetExceeded: boolean;
    budgetWarning: boolean;
    monthlyReport: boolean;
  };
  social: {
    friendAdded: boolean;
    groupInvite: boolean;
    mentionInComment: boolean;
  };
  goals: {
    goalCompleted: boolean;
    milestoneReached: boolean;
    reminderToSave: boolean;
  };
  settlements: {
    paymentReceived: boolean;
    paymentRequest: boolean;
    settlementReminder: boolean;
  };
  general: {
    sound: boolean;
    vibration: boolean;
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };
}

interface NotificationState {
  notifications: Notification[];
  settings: NotificationSettings;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: (userId: string) => void;
  
  // Settings actions
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  updateCategorySettings: (category: keyof NotificationSettings, updates: any) => void;
  
  // Utility functions
  getUnreadCount: (userId: string) => number;
  getNotificationsByType: (userId: string, type: Notification['type']) => Notification[];
  shouldShowNotification: (type: Notification['type'], category: string) => boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  expenses: {
    newExpense: true,
    expenseUpdated: true,
    paymentReminder: true,
    weeklyReport: false
  },
  chores: {
    choreAssigned: true,
    choreCompleted: true,
    choreOverdue: true,
    pointsEarned: true
  },
  budgets: {
    budgetExceeded: true,
    budgetWarning: true,
    monthlyReport: false
  },
  social: {
    friendAdded: true,
    groupInvite: true,
    mentionInComment: true
  },
  goals: {
    goalCompleted: true,
    milestoneReached: true,
    reminderToSave: false
  },
  settlements: {
    paymentReceived: true,
    paymentRequest: true,
    settlementReminder: true
  },
  general: {
    sound: true,
    vibration: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  }
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      settings: defaultSettings,
      
      addNotification: (notificationData) => set((state) => {
        const newNotification: Notification = {
          ...notificationData,
          id: Date.now().toString(),
          createdAt: new Date()
        };
        
        // Check if notifications should be shown based on settings
        if (!state.shouldShowNotification(notificationData.type, notificationData.category)) {
          return state;
        }
        
        return {
          notifications: [newNotification, ...state.notifications]
        };
      }),
      
      markAsRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      })),
      
      markAllAsRead: (userId) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.userId === userId ? { ...n, isRead: true } : n
        )
      })),
      
      deleteNotification: (notificationId) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== notificationId)
      })),
      
      clearAllNotifications: (userId) => set((state) => ({
        notifications: state.notifications.filter(n => n.userId !== userId)
      })),
      
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
      
      updateCategorySettings: (category, updates) => set((state) => ({
        settings: {
          ...state.settings,
          [category]: { ...state.settings[category], ...updates }
        }
      })),
      
      getUnreadCount: (userId) => {
        return get().notifications.filter(n => n.userId === userId && !n.isRead).length;
      },
      
      getNotificationsByType: (userId, type) => {
        return get().notifications.filter(n => n.userId === userId && n.type === type);
      },
      
      shouldShowNotification: (type, category) => {
        const settings = get().settings;
        if (!settings.enabled) return false;
        
        switch (type) {
          case 'expense':
            return settings.expenses[category as keyof typeof settings.expenses] ?? true;
          case 'chore':
            return settings.chores[category as keyof typeof settings.chores] ?? true;
          case 'budget':
            return settings.budgets[category as keyof typeof settings.budgets] ?? true;
          case 'social':
            return settings.social[category as keyof typeof settings.social] ?? true;
          case 'goal':
            return settings.goals[category as keyof typeof settings.goals] ?? true;
          case 'settlement':
            return settings.settlements[category as keyof typeof settings.settlements] ?? true;
          default:
            return true;
        }
      }
    }),
    {
      name: 'notification-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);