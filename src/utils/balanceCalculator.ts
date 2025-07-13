import { Expense, User, Group } from '../types/index';

// Interfaces for balance calculations
export interface BalanceCalculation {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  detailedBalances: { [userId: string]: number };
}

export interface GroupBalance extends BalanceCalculation {
  groupId: string;
  groupName: string;
  members: string[];
}

export interface FriendBalance {
  friendId: string;
  friendName: string;
  balance: number;
  lastTransaction: Date;
}

// Utility to get user name safely
export function getUserName(userId: string, users: User[]): string {
  const user = users.find(u => u.id === userId);
  return user ? user.name : 'Unknown User';
}

// Calculate balances for a specific group
export function calculateGroupBalances(
  group: Group,
  expenses: Expense[],
  users: User[],
  currentUserId: string
): GroupBalance {
  let totalOwed = 0;
  let totalOwing = 0;
  const detailedBalances: { [userId: string]: number } = {};

  expenses
    .filter(exp => exp.groupId === group.id && !exp.isDraft)
    .forEach(exp => {
      const splitCount = exp.splitBetween.length;
      const share = exp.amount / splitCount;

      if (exp.paidBy === currentUserId) {
        exp.splitBetween.forEach(userId => {
          if (userId !== currentUserId) {
            detailedBalances[userId] = (detailedBalances[userId] || 0) + share;
            totalOwed += share;
          }
        });
      } else if (exp.splitBetween.includes(currentUserId)) {
        detailedBalances[exp.paidBy] = (detailedBalances[exp.paidBy] || 0) - share;
        totalOwing += share;
      }
    });

  return {
    groupId: group.id,
    groupName: group.name,
    members: group.members,
    totalOwed,
    totalOwing,
    netBalance: totalOwed - totalOwing,
    detailedBalances
  };
}

// Calculate balances for friends (non-group expenses)
export function calculateFriendBalances(
  expenses: Expense[],
  friends: User[],
  currentUserId: string
): FriendBalance[] {
  const friendBalances: { [friendId: string]: { balance: number; lastDate: Date | null } } = {};

  expenses
    .filter(exp => !exp.groupId && !exp.isDraft)
    .forEach(exp => {
      const splitCount = exp.splitBetween.length;
      const share = exp.amount / splitCount;
      const expDate = new Date(exp.date);

      exp.splitBetween.forEach(userId => {
        if (userId !== currentUserId && friends.some(f => f.id === userId)) {
          if (!friendBalances[userId]) {
            friendBalances[userId] = { balance: 0, lastDate: null };
          }

          if (exp.paidBy === currentUserId) {
            friendBalances[userId].balance += share;
          } else if (exp.paidBy === userId) {
            friendBalances[userId].balance -= share;
          }

          if (!friendBalances[userId].lastDate || expDate > friendBalances[userId].lastDate) {
            friendBalances[userId].lastDate = expDate;
          }
        }
      });
    });

  return Object.entries(friendBalances).map(([friendId, data]) => ({
    friendId,
    friendName: getUserName(friendId, friends),
    balance: data.balance,
    lastTransaction: data.lastDate || new Date()
  }));
}

// Calculate total balances across all
export function calculateTotalBalances(
  groupBalances: GroupBalance[],
  friendBalances: FriendBalance[]
): BalanceCalculation {
  let totalOwed = 0;
  let totalOwing = 0;

  groupBalances.forEach(gb => {
    totalOwed += gb.totalOwed;
    totalOwing += gb.totalOwing;
  });

  friendBalances.forEach(fb => {
    if (fb.balance > 0) totalOwed += fb.balance;
    else totalOwing += Math.abs(fb.balance);
  });

  return {
    totalOwed,
    totalOwing,
    netBalance: totalOwed - totalOwing,
    detailedBalances: {} // Combine if needed
  };
}

// Validation utility
export function validateExpenseData(expense: Expense): boolean {
  return !!(
    expense.id &&
    expense.title &&
    expense.amount > 0 &&
    expense.currency &&
    expense.paidBy &&
    expense.splitBetween.length > 0 &&
    expense.date
  );
}

// Get all unique users from expenses
export function getAllUsersInExpenses(expenses: Expense[]): string[] {
  const users = new Set<string>();
  expenses.forEach(exp => {
    users.add(exp.paidBy);
    exp.splitBetween.forEach(id => users.add(id));
  });
  return Array.from(users);
} 