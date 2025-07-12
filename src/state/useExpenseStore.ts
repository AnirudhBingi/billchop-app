import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Group, Balance, Transaction, PersonalExpense, Budget, FinancialGoal, SpendingInsight } from '../types';

interface ExpenseState {
  expenses: Expense[];
  groups: Group[];
  balances: Balance[];
  transactions: Transaction[];
  personalExpenses: PersonalExpense[];
  budgets: Budget[];
  financialGoals: FinancialGoal[];
  spendingInsights: SpendingInsight[];
  
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
  
  // Goal actions
  addGoal: (goal: FinancialGoal) => void;
  updateGoal: (goalId: string, updates: Partial<FinancialGoal>) => void;
  deleteGoal: (goalId: string) => void;
  addProgressToGoal: (goalId: string, amount: number) => void;
  
  // Insight actions
  addInsight: (insight: SpendingInsight) => void;
  markInsightAsRead: (insightId: string) => void;
  generateInsights: (userId: string) => void;
  
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
      financialGoals: [],
      spendingInsights: [],
      
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
      
      addGoal: (goal) => set((state) => ({
        financialGoals: [...state.financialGoals, goal]
      })),
      
      updateGoal: (goalId, updates) => set((state) => ({
        financialGoals: state.financialGoals.map(g => 
          g.id === goalId ? { ...g, ...updates } : g
        )
      })),
      
      deleteGoal: (goalId) => set((state) => ({
        financialGoals: state.financialGoals.filter(g => g.id !== goalId)
      })),
      
      addProgressToGoal: (goalId, amount) => set((state) => ({
        financialGoals: state.financialGoals.map(g => 
          g.id === goalId ? { 
            ...g, 
            currentAmount: Math.min(g.currentAmount + amount, g.targetAmount),
            isCompleted: (g.currentAmount + amount) >= g.targetAmount
          } : g
        )
      })),
      
      addInsight: (insight) => set((state) => ({
        spendingInsights: [...state.spendingInsights, insight]
      })),
      
      markInsightAsRead: (insightId) => set((state) => ({
        spendingInsights: state.spendingInsights.map(i => 
          i.id === insightId ? { ...i, isRead: true } : i
        )
      })),
      
      generateInsights: (userId) => {
        const state = get();
        const userExpenses = state.personalExpenses.filter(e => e.userId === userId);
        const userBudgets = state.budgets.filter(b => b.userId === userId);
        const insights: SpendingInsight[] = [];
        
        // Check budget overages
        userBudgets.forEach(budget => {
          const spentPercentage = (budget.spent / budget.limit) * 100;
          if (spentPercentage >= budget.alertThreshold) {
            insights.push({
              id: `budget-alert-${budget.id}-${Date.now()}`,
              type: spentPercentage >= 100 ? 'warning' : 'tip',
              title: spentPercentage >= 100 ? 'Budget Exceeded!' : 'Budget Alert',
              description: `You've spent ${spentPercentage.toFixed(0)}% of your ${budget.category} budget`,
              category: budget.category,
              percentage: spentPercentage,
              createdAt: new Date(),
              isRead: false
            });
          }
        });
        
        // Add spending trend insights
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const recentExpenses = userExpenses.filter(e => e.date >= lastMonth && e.type === 'expense');
        
        if (recentExpenses.length > 0) {
          const topCategory = recentExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
          }, {} as Record<string, number>);
          
          const highestCategory = Object.entries(topCategory).sort(([,a], [,b]) => b - a)[0];
          
          insights.push({
            id: `trend-${Date.now()}`,
            type: 'trend',
            title: 'Top Spending Category',
            description: `You spent most on ${highestCategory[0]} this month: ${highestCategory[1].toFixed(2)}`,
            category: highestCategory[0],
            amount: highestCategory[1],
            createdAt: new Date(),
            isRead: false
          });
        }
        
        set((state) => ({
          spendingInsights: [...state.spendingInsights, ...insights]
        }));
      },
      
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