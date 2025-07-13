import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AppSettings } from '../types';

interface UserState {
  currentUser: User | null;
  friends: User[];
  settings: AppSettings;
  users: User[];
  loading: boolean;
  setCurrentUser: (user: User) => void;
  addFriend: (friend: User) => void;
  removeFriend: (friendId: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  logout: () => void;
  fetchUsers: (userIds: string[]) => Promise<void>;
  fetchFriends: () => Promise<void>;
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
      users: [],
      loading: false,
      
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
      fetchUsers: async (userIds) => {
        set({ loading: true });
        // TODO: Implement actual fetch from API
        const fetchedUsers: User[] = []; // Stub
        set({ users: fetchedUsers, loading: false });
      },
      fetchFriends: async () => {
        set({ loading: true });
        // TODO: Implement actual fetch
        const fetchedFriends: User[] = [];
        set({ friends: fetchedFriends, loading: false });
      },
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