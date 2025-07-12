export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[]; // User IDs
  createdBy: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: string; // User ID
  splitBetween: string[]; // User IDs
  groupId?: string;
  date: Date;
  createdAt: Date;
  isDraft: boolean;
  receipt?: string; // Image URL
}

export interface Balance {
  userId: string;
  owes: { [userId: string]: number };
  owedBy: { [userId: string]: number };
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  type: 'settlement' | 'expense' | 'ride' | 'chore_reward';
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  category: string;
  assignedTo?: string; // User ID
  groupId: string;
  points: number;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface ChoreLeaderboard {
  userId: string;
  totalPoints: number;
  completedChores: number;
  rank: number;
}

export interface RideShare {
  id: string;
  driverId: string;
  passengerId: string;
  distance?: number;
  duration?: number;
  cost: number;
  costType: 'fixed' | 'per_mile';
  date: Date;
  description: string;
}

export interface PersonalExpense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory | IncomeCategory;
  type: 'expense' | 'income';
  date: Date;
  description?: string;
  isHomeCountry: boolean;
  userId: string;
  createdAt: Date;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly';
  isHomeCountry: boolean;
  userId: string;
  createdAt: Date;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
  isActive: boolean;
}

export interface FinancialGoal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  category: string;
  targetDate: Date;
  isHomeCountry: boolean;
  userId: string;
  createdAt: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface SpendingInsight {
  id: string;
  type: 'warning' | 'tip' | 'achievement' | 'trend';
  title: string;
  description: string;
  category?: string;
  amount?: number;
  percentage?: number;
  createdAt: Date;
  isRead: boolean;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // Relative to USD
}

export interface AppSettings {
  primaryCurrency: string;
  homeCurrency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    expenses: boolean;
    chores: boolean;
    settlements: boolean;
  };
  language: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    expenseId?: string;
    choreId?: string;
    actionPerformed?: string;
  };
}

export type ExpenseCategory = 
  | 'food' 
  | 'transportation' 
  | 'utilities' 
  | 'entertainment' 
  | 'shopping' 
  | 'healthcare' 
  | 'education' 
  | 'rent' 
  | 'groceries' 
  | 'other';

export type ChoreCategory = 
  | 'kitchen' 
  | 'bathroom' 
  | 'living_room' 
  | 'bedroom' 
  | 'general_cleaning' 
  | 'laundry' 
  | 'maintenance' 
  | 'outdoor' 
  | 'other';

export type IncomeCategory = 
  | 'salary'
  | 'freelance'
  | 'part_time'
  | 'family_support'
  | 'scholarship'
  | 'investment'
  | 'other';