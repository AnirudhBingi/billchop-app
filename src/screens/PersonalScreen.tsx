import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import GlassCard from '../components/GlassCard';
import { PersonalExpense, Budget, FinancialGoal, SpendingInsight } from '../types';
import { format, startOfMonth, endOfMonth, isAfter } from 'date-fns';
import { cn } from '../utils/cn';
import Animated, { FadeInUp } from 'react-native-reanimated';
import CurrencyService from '../services/CurrencyService';
import AddExpenseModal from './AddExpenseModal';
import AddIncomeModal from './AddIncomeModal';
import CreateBudgetModal from './CreateBudgetModal';
import CreateGoalModal from './CreateGoalModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PersonalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser, settings } = useUserStore();
  const { 
    personalExpenses, 
    budgets, 
    financialGoals, 
    spendingInsights,
    addBudget,
    addGoal,
    updateBudget,
    generateInsights,
    markInsightAsRead,
    updatePersonalExpense,
    deletePersonalExpense,
    deleteBudget,
    deleteGoal
  } = useExpenseStore();
  
  const [selectedMode, setSelectedMode] = useState<'selection' | 'local' | 'home'>('local');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'budget' | 'goals' | 'insights'>('overview');
  
  // Modal states
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showCreateBudgetModal, setShowCreateBudgetModal] = useState(false);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  
  const isDark = settings.theme === 'dark';
  const userId = currentUser?.id || '';
  
  // Currency setup
  const localCurrency = { code: 'USD', symbol: '$' };
  const homeCurrency = { code: 'INR', symbol: '₹' };
  const currentCurrency = selectedMode === 'local' ? localCurrency : homeCurrency;
  const isHomeCountry = selectedMode === 'home';

  // Filter data based on current mode and user
  const userExpenses = personalExpenses.filter(e => 
    e.userId === userId && e.isHomeCountry === isHomeCountry
  );
  const userBudgets = budgets.filter(b => 
    b.userId === userId && b.isHomeCountry === isHomeCountry && b.isActive
  );
  const userGoals = financialGoals.filter(g => 
    g.userId === userId && g.isHomeCountry === isHomeCountry
  );
  const userInsights = spendingInsights.filter(i => !i.isRead);

  // Calculate financial metrics for current mode
  const expenses = userExpenses.filter(e => e.type === 'expense');
  const income = userExpenses.filter(e => e.type === 'income');
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // Calculate combined balance across both local and home currencies
  const [combinedBalance, setCombinedBalance] = useState<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    currency: string;
  }>({ totalIncome: 0, totalExpenses: 0, netBalance: 0, currency: 'USD' });

  // Calculate combined balance with currency conversion
  useEffect(() => {
    const calculateCombinedBalance = async () => {
      try {
        const currencyService = CurrencyService.getInstance();
        
        // Get all personal expenses for the user
        const allUserExpenses = personalExpenses.filter(e => e.userId === userId);
        const localExpenses = allUserExpenses.filter(e => !e.isHomeCountry);
        const homeExpenses = allUserExpenses.filter(e => e.isHomeCountry);

        // Calculate local totals
        const localIncome = localExpenses.filter(e => e.type === 'income');
        const localExpenseItems = localExpenses.filter(e => e.type === 'expense');
        const localTotalIncome = localIncome.reduce((sum, item) => sum + item.amount, 0);
        const localTotalExpenses = localExpenseItems.reduce((sum, item) => sum + item.amount, 0);

        // Calculate home totals (convert each using locked rate if present)
        let homeIncomeInUSD = 0;
        let homeExpensesInUSD = 0;
        for (const entry of homeExpenses) {
          const rate = entry.lockedExchangeRate || await currencyService.getExchangeRate(entry.currency, 'USD');
          if (entry.type === 'income') {
            homeIncomeInUSD += entry.amount * rate;
          } else if (entry.type === 'expense') {
            homeExpensesInUSD += entry.amount * rate;
          }
        }

        // Calculate combined totals in USD
        const combinedTotalIncome = localTotalIncome + homeIncomeInUSD;
        const combinedTotalExpenses = localTotalExpenses + homeExpensesInUSD;
        const combinedNetBalance = combinedTotalIncome - combinedTotalExpenses;

        setCombinedBalance({
          totalIncome: combinedTotalIncome,
          totalExpenses: combinedTotalExpenses,
          netBalance: combinedNetBalance,
          currency: 'USD'
        });
      } catch (error) {
        console.error('Error calculating combined balance:', error);
        // Fallback to current mode calculation
        setCombinedBalance({
          totalIncome,
          totalExpenses,
          netBalance,
          currency: currentCurrency.code
        });
      }
    };

    if (userId) {
      calculateCombinedBalance();
    }
  }, [personalExpenses, userId, currentCurrency.code]);

  // Update budget spent amounts and generate insights only when needed
  useEffect(() => {
    if (userId && selectedMode !== 'selection') {
      // Update budget spent amounts
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      
      userBudgets.forEach(budget => {
        const categoryExpenses = expenses.filter(e => 
          e.category === budget.category &&
          e.date >= monthStart &&
          e.date <= monthEnd
        );
        const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        if (spent !== budget.spent) {
          updateBudget(budget.id, { spent });
        }
      });

      // Generate insights only if we have expenses and no recent insights
      if (userExpenses.length > 0) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const hasRecentInsights = userInsights.some(i => new Date(i.createdAt) > oneHourAgo);
        
        if (!hasRecentInsights) {
          generateInsights(userId);
        }
      }
    }
  }, [selectedMode, userId]); // Removed userExpenses from deps to prevent infinite loop

  const createQuickBudget = (category: string, limit: number) => {
    const budget: Budget = {
      id: Date.now().toString(),
      category,
      limit,
      spent: 0,
      currency: currentCurrency.code,
      period: 'monthly',
      isHomeCountry,
      userId,
      createdAt: new Date(),
      alertThreshold: 80,
      isActive: true
    };
    addBudget(budget);
  };

  const createQuickGoal = (title: string, targetAmount: number, category: string) => {
    const goal: FinancialGoal = {
      id: Date.now().toString(),
      title,
      targetAmount,
      currentAmount: 0,
      currency: currentCurrency.code,
      category,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      isHomeCountry,
      userId,
      createdAt: new Date(),
      isCompleted: false,
      priority: 'medium'
    };
    addGoal(goal);
  };

  const handleEditTransaction = (expense: PersonalExpense) => {
    navigation.navigate('PersonalFinance', {
      initialType: expense.type,
      selectedMode: expense.isHomeCountry ? 'home' : 'local',
      expenseId: expense.id,
      prefill: expense
    });
  };

  const handleDeleteTransaction = (expense: PersonalExpense) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePersonalExpense(expense.id) }
      ]
    );
  };

  const handleEditBudget = (budget: Budget) => {
    navigation.navigate('BudgetManager', { 
      selectedMode: budget.isHomeCountry ? 'home' : 'local',
      budgetId: budget.id,
      prefill: budget
    });
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the ${budget.category} budget?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(budget.id) }
      ]
    );
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    navigation.navigate('GoalManager', { 
      selectedMode: goal.isHomeCountry ? 'home' : 'local',
      goalId: goal.id,
      prefill: goal
    });
  };

  const handleDeleteGoal = (goal: FinancialGoal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete the "${goal.title}" goal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) }
      ]
    );
  };

  // Currency Selection Screen
  if (selectedMode === 'selection') {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6', paddingTop: insets.top }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          <Animated.View entering={FadeInUp} style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: isDark ? '#FFFFFF' : '#111827', 
              marginBottom: 8 
            }}>
              💰 Personal Finance
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: isDark ? '#9CA3AF' : '#6B7280' 
            }}>
              Advanced financial management for international students
            </Text>
          </Animated.View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <Pressable
              onPress={() => setSelectedMode('local')}
              style={{
                flex: 1, 
                padding: 24, 
                borderRadius: 16, 
                backgroundColor: '#3B82F6', 
                alignItems: 'center'
              }}
            >
              <Ionicons name="location" size={32} color="white" />
              <Text style={{ 
                color: 'white', 
                fontWeight: '600', 
                marginTop: 12, 
                textAlign: 'center' 
              }}>
                🏠 Local Finances
              </Text>
              <Text style={{ 
                color: 'white', 
                opacity: 0.8, 
                fontSize: 12, 
                marginTop: 4, 
                textAlign: 'center' 
              }}>
                {localCurrency.symbol} {localCurrency.code}
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => setSelectedMode('home')}
              style={{
                flex: 1, 
                padding: 24, 
                borderRadius: 16, 
                backgroundColor: '#10B981', 
                alignItems: 'center'
              }}
            >
              <Ionicons name="home" size={32} color="white" />
              <Text style={{ 
                color: 'white', 
                fontWeight: '600', 
                marginTop: 12, 
                textAlign: 'center' 
              }}>
                🏡 Home Country
              </Text>
              <Text style={{ 
                color: 'white', 
                opacity: 0.8, 
                fontSize: 12, 
                marginTop: 4, 
                textAlign: 'center' 
              }}>
                {homeCurrency.symbol} {homeCurrency.code}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View 
      className={cn("flex-1", isDark ? "bg-gray-900" : "bg-gray-50")}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className={cn("text-2xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                {selectedMode === 'local' ? '🏠 Local' : '🏡 Home'} Finances
              </Text>
              <Text className={cn("text-sm opacity-70", isDark ? "text-white" : "text-gray-900")}>
                {currentCurrency.symbol} {currentCurrency.code} • Smart Money Management
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedMode('selection')}
              style={{ 
                padding: 8, 
                borderRadius: 8, 
                backgroundColor: selectedMode === 'local' ? '#3B82F6' : '#10B981' 
              }}
            >
              <Ionicons name="swap-horizontal" size={20} color="white" />
            </Pressable>
          </View>

          {/* Quick Actions */}
          <GlassCard className="mb-6">
            <Text className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
              ⚡ Quick Actions
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowAddIncomeModal(true)}
                className="flex-1 bg-green-500 p-4 rounded-xl items-center"
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text className="text-white font-semibold mt-1">Add Income</Text>
              </Pressable>
              
              <Pressable
                onPress={() => setShowAddExpenseModal(true)}
                className="flex-1 bg-red-500 p-4 rounded-xl items-center"
              >
                <Ionicons name="remove-circle" size={20} color="white" />
                <Text className="text-white font-semibold mt-1">Add Expense</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* Financial Overview */}
          <GlassCard className="mb-6">
            <Text className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
              💰 Financial Overview
            </Text>
            <View className="flex-row justify-between">
              <View className="flex-1 items-center py-3 bg-green-500/10 rounded-l-xl">
                <Text className={cn("text-xs opacity-70", isDark ? "text-white" : "text-gray-900")}>
                  Income
                </Text>
                <Text className="text-lg font-bold text-green-500">
                  {currentCurrency.symbol}{totalIncome.toFixed(2)}
                </Text>
              </View>
              <View className="flex-1 items-center py-3 bg-red-500/10">
                <Text className={cn("text-xs opacity-70", isDark ? "text-white" : "text-gray-900")}>
                  Expenses
                </Text>
                <Text className="text-lg font-bold text-red-500">
                  {currentCurrency.symbol}{totalExpenses.toFixed(2)}
                </Text>
              </View>
              <View className="flex-1 items-center py-3 bg-blue-500/10 rounded-r-xl">
                <Text className={cn("text-xs opacity-70", isDark ? "text-white" : "text-gray-900")}>
                  Balance
                </Text>
                <Text className={cn("text-lg font-bold", netBalance >= 0 ? "text-blue-500" : "text-red-500")}>
                  {currentCurrency.symbol}{netBalance.toFixed(2)}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Tab Selector */}
          <View className="flex-row bg-gray-200/30 rounded-xl p-1 mb-6">
            {(['overview', 'budget', 'goals', 'insights'] as const).map(tab => (
              <Pressable
                key={tab}
                className={cn(
                  "flex-1 py-2 rounded-lg items-center",
                  selectedTab === tab && "bg-blue-500"
                )}
                onPress={() => setSelectedTab(tab)}
              >
                <Text className={cn(
                  "font-medium text-xs",
                  selectedTab === tab ? "text-white" : isDark ? "text-white" : "text-gray-900"
                )}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'insights' && userInsights.length > 0 && (
                    <Text className="text-red-400"> ({userInsights.length})</Text>
                  )}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {selectedTab === 'overview' && (
            <View>
              {userExpenses.length > 0 ? (
                <>
                  <Text className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
                    Recent Transactions
                  </Text>
                  <FlatList
                    data={userExpenses.slice(0, 5)}
                    renderItem={({ item }) => (
                      <GlassCard className="mb-3">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                              {item.title}
                            </Text>
                            <Text className={cn("text-sm opacity-70 mt-1", isDark ? "text-white" : "text-gray-900")}>
                              {item.category} • {format(new Date(item.date), 'MMM dd')}
                            </Text>
                          </View>
                          <Text className={cn(
                            "text-lg font-bold",
                            item.type === 'income' ? "text-green-500" : "text-red-500"
                          )}>
                            {item.type === 'income' ? '+' : '-'}{currentCurrency.symbol}{item.amount.toFixed(2)}
                          </Text>
                          <View className="flex-row ml-2">
                            <Pressable
                              onPress={() => handleEditTransaction(item)}
                              accessibilityLabel="Edit transaction"
                              className="p-2 mr-1 rounded-full bg-blue-500/10"
                            >
                              <Ionicons name="create-outline" size={18} color="#3B82F6" />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteTransaction(item)}
                              accessibilityLabel="Delete transaction"
                              className="p-2 rounded-full bg-red-500/10"
                            >
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </Pressable>
                          </View>
                        </View>
                      </GlassCard>
                    )}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                </>
              ) : (
                <GlassCard>
                  <View className="items-center py-8">
                    <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
                    <Text className={cn("text-center mt-4 font-medium", isDark ? "text-white" : "text-gray-900")}>
                      No transactions yet
                    </Text>
                    <Text className={cn("text-center mt-2 text-sm opacity-70", isDark ? "text-white" : "text-gray-900")}>
                      Add your first income or expense to get started
                    </Text>
                  </View>
                </GlassCard>
              )}
            </View>
          )}

          {selectedTab === 'budget' && (
            <View>
              {userBudgets.length > 0 ? (
                <>
                  <Text className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
                    📊 Active Budgets
                  </Text>
                  {userBudgets.map(budget => {
                    const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
                    const isOverBudget = budget.spent > budget.limit;
                    
                    return (
                      <GlassCard key={budget.id} className="mb-4">
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className={cn("font-semibold capitalize", isDark ? "text-white" : "text-gray-900")}>
                            {budget.category}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className={cn(
                              "font-bold mr-2",
                              isOverBudget ? "text-red-500" : percentage > 80 ? "text-yellow-500" : "text-green-500"
                            )}>
                              {currentCurrency.symbol}{budget.spent.toFixed(2)} / {currentCurrency.symbol}{budget.limit.toFixed(2)}
                            </Text>
                            <View className="flex-row">
                              <Pressable
                                onPress={() => handleEditBudget(budget)}
                                accessibilityLabel="Edit budget"
                                className="p-2 mr-1 rounded-full bg-blue-500/10"
                              >
                                <Ionicons name="create-outline" size={16} color="#3B82F6" />
                              </Pressable>
                              <Pressable
                                onPress={() => handleDeleteBudget(budget)}
                                accessibilityLabel="Delete budget"
                                className="p-2 rounded-full bg-red-500/10"
                              >
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                        
                        <View className="bg-gray-200 rounded-full h-3 mb-2">
                          <View 
                            className={cn(
                              "h-3 rounded-full",
                              isOverBudget ? "bg-red-500" : percentage > 80 ? "bg-yellow-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </View>
                        
                        <Text className={cn("text-sm", isDark ? "text-white" : "text-gray-900")}>
                          {percentage.toFixed(0)}% used • Monthly budget
                        </Text>
                      </GlassCard>
                    );
                  })}
                </>
              ) : (
                <GlassCard>
                  <View className="items-center py-8">
                    <Ionicons name="bar-chart-outline" size={48} color="#3B82F6" />
                    <Text className={cn("text-center mt-4 font-medium", isDark ? "text-white" : "text-gray-900")}>
                      No budgets set
                    </Text>
                    <Text className={cn("text-center mt-2 text-sm opacity-70 mb-4", isDark ? "text-white" : "text-gray-900")}>
                      Create budgets to track your spending
                    </Text>
                    
                    <Pressable
                      onPress={() => setShowCreateBudgetModal(true)}
                      className="bg-blue-500 px-6 py-3 rounded-xl self-center"
                    >
                      <Text className="text-white font-semibold">
                        📊 Create Your First Budget
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              )}
            </View>
          )}

          {selectedTab === 'goals' && (
            <View>
              {userGoals.length > 0 ? (
                <>
                  <Text className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
                    🎯 Financial Goals
                  </Text>
                  {userGoals.map(goal => {
                    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    const daysLeft = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                    
                    return (
                      <GlassCard key={goal.id} className="mb-4">
                        <View className="flex-row justify-between items-center mb-3">
                          <Text className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                            {goal.title}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className={cn(
                              "font-bold mr-2",
                              goal.isCompleted ? "text-green-500" : "text-blue-500"
                            )}>
                              {currentCurrency.symbol}{goal.currentAmount.toFixed(2)} / {currentCurrency.symbol}{goal.targetAmount.toFixed(2)}
                            </Text>
                            <View className="flex-row">
                              <Pressable
                                onPress={() => handleEditGoal(goal)}
                                accessibilityLabel="Edit goal"
                                className="p-2 mr-1 rounded-full bg-blue-500/10"
                              >
                                <Ionicons name="create-outline" size={16} color="#3B82F6" />
                              </Pressable>
                              <Pressable
                                onPress={() => handleDeleteGoal(goal)}
                                accessibilityLabel="Delete goal"
                                className="p-2 rounded-full bg-red-500/10"
                              >
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                        
                        <View className="bg-gray-200 rounded-full h-3 mb-2">
                          <View 
                            className={cn(
                              "h-3 rounded-full",
                              goal.isCompleted ? "bg-green-500" : "bg-blue-500"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </View>
                        
                        <View className="flex-row justify-between">
                          <Text className={cn("text-sm", isDark ? "text-white" : "text-gray-900")}>
                            {percentage.toFixed(0)}% complete
                          </Text>
                          <Text className={cn("text-sm", isDark ? "text-white" : "text-gray-900")}>
                            {goal.isCompleted ? '✅ Completed' : `${daysLeft} days left`}
                          </Text>
                        </View>
                      </GlassCard>
                    );
                  })}
                </>
              ) : (
                <GlassCard>
                  <View className="items-center py-8">
                    <Ionicons name="trophy-outline" size={48} color="#F59E0B" />
                    <Text className={cn("text-center mt-4 font-medium", isDark ? "text-white" : "text-gray-900")}>
                      No goals set
                    </Text>
                    <Text className={cn("text-center mt-2 text-sm opacity-70 mb-4", isDark ? "text-white" : "text-gray-900")}>
                      Set financial goals to track your progress
                    </Text>
                    
                    <Pressable
                      onPress={() => setShowCreateGoalModal(true)}
                      className="bg-yellow-500 px-6 py-3 rounded-xl self-center"
                    >
                      <Text className="text-white font-semibold">
                        🎯 Create Your First Goal
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              )}
            </View>
          )}

          {selectedTab === 'insights' && (
            <View>
              {userInsights.length > 0 ? (
                <>
                  <Text className={cn("text-lg font-semibold mb-4", isDark ? "text-white" : "text-gray-900")}>
                    🔮 Smart Insights
                  </Text>
                  {userInsights.map(insight => (
                    <GlassCard key={insight.id} className="mb-4">
                      <View className="flex-row items-start">
                        <View className={cn(
                          "w-10 h-10 rounded-full items-center justify-center mr-3",
                          insight.type === 'warning' ? "bg-red-500/20" :
                          insight.type === 'tip' ? "bg-yellow-500/20" :
                          insight.type === 'achievement' ? "bg-green-500/20" : "bg-blue-500/20"
                        )}>
                          <Ionicons 
                            name={
                              insight.type === 'warning' ? 'warning' :
                              insight.type === 'tip' ? 'bulb' :
                              insight.type === 'achievement' ? 'trophy' : 'trending-up'
                            }
                            size={20}
                            color={
                              insight.type === 'warning' ? '#EF4444' :
                              insight.type === 'tip' ? '#F59E0B' :
                              insight.type === 'achievement' ? '#10B981' : '#3B82F6'
                            }
                          />
                        </View>
                        
                        <View className="flex-1">
                          <Text className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>
                            {insight.title}
                          </Text>
                          <Text className={cn("text-sm opacity-80 mt-1", isDark ? "text-white" : "text-gray-900")}>
                            {insight.description}
                          </Text>
                          
                          <Pressable
                            onPress={() => markInsightAsRead(insight.id)}
                            className="mt-2 self-start"
                          >
                            <Text className="text-blue-500 text-sm font-medium">
                              Mark as read
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
                </>
              ) : (
                <GlassCard>
                  <View className="items-center py-8">
                    <Ionicons name="analytics-outline" size={48} color="#8B5CF6" />
                    <Text className={cn("text-center mt-4 font-medium", isDark ? "text-white" : "text-gray-900")}>
                      No new insights
                    </Text>
                    <Text className={cn("text-center mt-2 text-sm opacity-70", isDark ? "text-white" : "text-gray-900")}>
                      Add more transactions to get AI-powered insights
                    </Text>
                  </View>
                </GlassCard>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Modals */}
      <AddExpenseModal
        visible={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        selectedMode={selectedMode}
      />
      
      <AddIncomeModal
        visible={showAddIncomeModal}
        onClose={() => setShowAddIncomeModal(false)}
        selectedMode={selectedMode}
      />
      
      <CreateBudgetModal
        visible={showCreateBudgetModal}
        onClose={() => setShowCreateBudgetModal(false)}
        selectedMode={selectedMode}
      />
      
      <CreateGoalModal
        visible={showCreateGoalModal}
        onClose={() => setShowCreateGoalModal(false)}
        selectedMode={selectedMode}
      />
    </View>
  );
}