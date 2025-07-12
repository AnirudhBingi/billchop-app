import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Group, Balance, Transaction, PersonalExpense, Budget } from '../types';

interface ExpenseState {
  expenses: Expense[];
  groups: Group[];
  balances: Balance[];
  transactions: Transaction[];
  personalExpenses: PersonalExpense[];
  budgets: Budget[];
  
  // Expense actions
  addExpense: (expense: Expense) => void;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  publishDraftExpense: (expenseId: string) => void;
  
  // Group actions
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;
  
  // Balance actions
  updateBalance: (userId: string, balance: Partial<Balance>) => void;
  settleBalance: (fromUserId: string, toUserId: string, amount: number) => void;
  
  // Personal expense actions
  addPersonalExpense: (expense: PersonalExpense) => void;
  updatePersonalExpense: (expenseId: string, updates: Partial<PersonalExpense>) => void;
  deletePersonalExpense: (expenseId: string) => void;
  
  // Budget actions
  addBudget: (budget: Budget) => void;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => void;
  deleteBudget: (budgetId: string) => void;
  
  // Utility functions
  getGroupExpenses: (groupId: string) => Expense[];
  getUserBalance: (userId: string) => Balance | null;
  getTotalOwed: (userId: string) => number;
  getTotalOwing: (userId: string) => number;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      groups: [],
      balances: [],
      transactions: [],
      personalExpenses: [],
      budgets: [],
      
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, expense]
      })),
      
      updateExpense: (expenseId, updates) => set((state) => ({
        expenses: state.expenses.map(e => 
          e.id === expenseId ? { ...e, ...updates } : e
        )
      })),
      
      deleteExpense: (expenseId) => set((state) => ({
        expenses: state.expenses.filter(e => e.id !== expenseId)
      })),
      
      publishDraftExpense: (expenseId) => set((state) => ({
        expenses: state.expenses.map(e => 
          e.id === expenseId ? { ...e, isDraft: false } : e
        )
      })),
      
      addGroup: (group) => set((state) => ({
        groups: [...state.groups, group]
      })),
      
      updateGroup: (groupId, updates) => set((state) => ({
        groups: state.groups.map(g => 
          g.id === groupId ? { ...g, ...updates } : g
        )
      })),
      
      deleteGroup: (groupId) => set((state) => ({
        groups: state.groups.filter(g => g.id !== groupId),
        expenses: state.expenses.filter(e => e.groupId !== groupId)
      })),
      
      updateBalance: (userId, balance) => set((state) => {
        const existingIndex = state.balances.findIndex(b => b.userId === userId);
        if (existingIndex >= 0) {
          const updatedBalances = [...state.balances];
          updatedBalances[existingIndex] = { ...updatedBalances[existingIndex], ...balance };
          return { balances: updatedBalances };
        } else {
          return { balances: [...state.balances, { userId, owes: {}, owedBy: {}, ...balance }] };
        }
      }),
      
      settleBalance: (fromUserId, toUserId, amount) => {
        const transaction: Transaction = {
          id: Date.now().toString(),
          fromUserId,
          toUserId,
          amount,
          currency: 'USD', // TODO: Make dynamic
          description: 'Balance settlement',
          date: new Date(),
          type: 'settlement'
        };
        
        set((state) => ({
          transactions: [...state.transactions, transaction]
        }));
      },
      
      addPersonalExpense: (expense) => set((state) => ({
        personalExpenses: [...state.personalExpenses, expense]
      })),
      
      updatePersonalExpense: (expenseId, updates) => set((state) => ({
        personalExpenses: state.personalExpenses.map(e => 
          e.id === expenseId ? { ...e, ...updates } : e
        )
      })),
      
      deletePersonalExpense: (expenseId) => set((state) => ({
        personalExpenses: state.personalExpenses.filter(e => e.id !== expenseId)
      })),
      
      addBudget: (budget) => set((state) => ({
        budgets: [...state.budgets, budget]
      })),
      
      updateBudget: (budgetId, updates) => set((state) => ({
        budgets: state.budgets.map(b => 
          b.id === budgetId ? { ...b, ...updates } : b
        )
      })),
      
      deleteBudget: (budgetId) => set((state) => ({
        budgets: state.budgets.filter(b => b.id !== budgetId)
      })),
      
      getGroupExpenses: (groupId) => {
        return get().expenses.filter(e => e.groupId === groupId);
      },
      
      getUserBalance: (userId) => {
        return get().balances.find(b => b.userId === userId) || null;
      },
      
      getTotalOwed: (userId) => {
        const balance = get().getUserBalance(userId);
        if (!balance) return 0;
        return Object.values(balance.owedBy).reduce((sum, amount) => sum + amount, 0);
      },
      
      getTotalOwing: (userId) => {
        const balance = get().getUserBalance(userId);
        if (!balance) return 0;
        return Object.values(balance.owes).reduce((sum, amount) => sum + amount, 0);
      },
    }),
    {
      name: 'expense-storage',
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