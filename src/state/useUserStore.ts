import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AppSettings } from '../types';

interface UserState {
  currentUser: User | null;
  friends: User[];
  settings: AppSettings;
  setCurrentUser: (user: User) => void;
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  logout: () => void;
}

const defaultSettings: AppSettings = {
  primaryCurrency: 'USD',
  homeCurrency: 'USD',
  theme: 'system',
  notifications: {
    expenses: true,
    chores: true,
    settlements: true,
  },
  language: 'en',
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      friends: [],
      settings: defaultSettings,
      
      setCurrentUser: (user) => set({ currentUser: user }),
      
      addFriend: (friend) => set((state) => ({
        friends: [...state.friends, friend]
      })),
      
      removeFriend: (friendId) => set((state) => ({
        friends: state.friends.filter(f => f.id !== friendId)
      })),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      logout: () => set({
        currentUser: null,
        friends: [],
        settings: defaultSettings,
      }),
    }),
    {
      name: 'user-storage',
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