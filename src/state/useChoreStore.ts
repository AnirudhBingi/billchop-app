import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chore, ChoreLeaderboard, RideShare } from '../types';

interface ChoreState {
  chores: Chore[];
  leaderboard: ChoreLeaderboard[];
  rides: RideShare[];
  
  // Chore actions
  addChore: (chore: Chore) => void;
  updateChore: (choreId: string, updates: Partial<Chore>) => void;
  deleteChore: (choreId: string) => void;
  completeChore: (choreId: string, completedBy: string) => void;
  
  // Ride actions
  addRide: (ride: RideShare) => void;
  updateRide: (rideId: string, updates: Partial<RideShare>) => void;
  deleteRide: (rideId: string) => void;
  
  // Leaderboard actions
  updateLeaderboard: () => void;
  getUserRank: (userId: string) => number;
  getUserPoints: (userId: string) => number;
  
  // Utility functions
  getGroupChores: (groupId: string) => Chore[];
  getUserChores: (userId: string) => Chore[];
  getOverdueChores: () => Chore[];
}

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      chores: [],
      leaderboard: [],
      rides: [],
      
      addChore: (chore) => set((state) => ({
        chores: [...state.chores, chore]
      })),
      
      updateChore: (choreId, updates) => set((state) => ({
        chores: state.chores.map(c => 
          c.id === choreId ? { ...c, ...updates } : c
        )
      })),
      
      deleteChore: (choreId) => set((state) => ({
        chores: state.chores.filter(c => c.id !== choreId)
      })),
      
      completeChore: (choreId, completedBy) => {
        const chore = get().chores.find(c => c.id === choreId);
        if (!chore) return;
        
        set((state) => ({
          chores: state.chores.map(c => 
            c.id === choreId 
              ? { 
                  ...c, 
                  status: 'completed' as const,
                  completedAt: new Date(),
                  completedBy 
                }
              : c
          )
        }));
        
        // Update leaderboard
        get().updateLeaderboard();
      },
      
      addRide: (ride) => set((state) => ({
        rides: [...state.rides, ride]
      })),
      
      updateRide: (rideId, updates) => set((state) => ({
        rides: state.rides.map(r => 
          r.id === rideId ? { ...r, ...updates } : r
        )
      })),
      
      deleteRide: (rideId) => set((state) => ({
        rides: state.rides.filter(r => r.id !== rideId)
      })),
      
      updateLeaderboard: () => {
        const chores = get().chores;
        const completedChores = chores.filter(c => c.status === 'completed');
        
        // Group by user and calculate points
        const userStats: { [userId: string]: { points: number; completed: number } } = {};
        
        completedChores.forEach(chore => {
          if (chore.completedBy) {
            if (!userStats[chore.completedBy]) {
              userStats[chore.completedBy] = { points: 0, completed: 0 };
            }
            userStats[chore.completedBy].points += chore.points;
            userStats[chore.completedBy].completed += 1;
          }
        });
        
        // Convert to leaderboard format and sort
        const leaderboard: ChoreLeaderboard[] = Object.entries(userStats)
          .map(([userId, stats]) => ({
            userId,
            totalPoints: stats.points,
            completedChores: stats.completed,
            rank: 0, // Will be set after sorting
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .map((entry, index) => ({ ...entry, rank: index + 1 }));
        
        set({ leaderboard });
      },
      
      getUserRank: (userId) => {
        const entry = get().leaderboard.find(l => l.userId === userId);
        return entry ? entry.rank : 0;
      },
      
      getUserPoints: (userId) => {
        const entry = get().leaderboard.find(l => l.userId === userId);
        return entry ? entry.totalPoints : 0;
      },
      
      getGroupChores: (groupId) => {
        return get().chores.filter(c => c.groupId === groupId);
      },
      
      getUserChores: (userId) => {
        return get().chores.filter(c => c.assignedTo === userId);
      },
      
      getOverdueChores: () => {
        const now = new Date();
        return get().chores.filter(c => 
          c.dueDate && 
          new Date(c.dueDate) < now && 
          c.status !== 'completed'
        );
      },
    }),
    {
      name: 'chore-storage',
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