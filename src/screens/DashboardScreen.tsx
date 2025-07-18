import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { useChoreStore } from '../state/useChoreStore';
import { mockUsers, mockGroups, mockExpenses, mockChores, mockPersonalExpenses } from '../utils/mockData';
import { cn } from '../utils/cn';
import Animated, { FadeInUp, FadeInDown, BounceIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import CurrencyService from '../services/CurrencyService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Refined Color Palette - Light theme optimized with vibrant accents
const THEME_COLORS = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  
  // Primary colors - Modern and vibrant
  primary: '#6366F1',      // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  
  // Secondary colors
  secondary: '#06B6D4',     // Cyan
  secondaryLight: '#22D3EE',
  secondaryDark: '#0891B2',
  
  // Accent colors
  accent: '#F59E0B',        // Amber
  accentLight: '#FBBF24',
  accentDark: '#D97706',
  
  // Status colors
  success: '#10B981',       // Emerald
  successLight: '#34D399',
  error: '#EF4444',         // Red
  errorLight: '#F87171',
  warning: '#F59E0B',
  
  // Text colors
  text: '#111827',          // Gray-900
  textSecondary: '#6B7280', // Gray-500
  textLight: '#9CA3AF',     // Gray-400
  
  // Border and divider
  border: '#E5E7EB',        // Gray-200
  divider: '#F3F4F6'        // Gray-100
};

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings, friends } = useUserStore();
  const { expenses, personalExpenses, budgets, financialGoals, getTotalOwed, getTotalOwing } = useExpenseStore();
  const { chores, getUserPoints } = useChoreStore();
  
  const isDark = settings.theme === 'dark';
  const userId = currentUser?.id || '';

  // Mock favorite riders data
  const [favoriteRiders] = useState([
    { id: '1', name: 'Sarah Chen', avatar: '👩🏻‍💼', rides: 12, lastRide: 'Airport pickup' },
    { id: '2', name: 'Mike Rodriguez', avatar: '👨🏽‍🎓', rides: 8, lastRide: 'Grocery run' },
    { id: '3', name: 'Emma Wilson', avatar: '👩🏼‍🦰', rides: 15, lastRide: 'Campus commute' }
  ]);

  // Initialize mock data for demo
  useEffect(() => {
    if (!currentUser) {
      console.log('Setting up mock data...');
      useUserStore.getState().setCurrentUser(mockUsers[0]);
      mockUsers.slice(1).forEach(user => {
        console.log('Adding friend:', user.name);
        useUserStore.getState().addFriend(user);
      });
      mockGroups.forEach(group => {
        console.log('Adding group:', group.name);
        useExpenseStore.getState().addGroup(group);
      });
      mockExpenses.forEach(expense => {
        console.log('Adding expense:', expense.title, 'paid by:', expense.paidBy, 'split between:', expense.splitBetween);
        useExpenseStore.getState().addExpense(expense);
      });
      mockChores.forEach(chore => {
        useChoreStore.getState().addChore(chore);
      });
      mockPersonalExpenses.forEach(expense => {
        useExpenseStore.getState().addPersonalExpense(expense);
      });
    }
  }, [currentUser]);

  // Debug balance calculations
  useEffect(() => {
    if (currentUser) {
      console.log('Current user:', currentUser.name, 'ID:', currentUser.id);
      console.log('Total expenses:', expenses.length);
      console.log('Total owed calculation:', getTotalOwed(userId));
      console.log('Total owing calculation:', getTotalOwing(userId));
      
      // Log some expense details
      expenses.forEach(exp => {
        console.log(`Expense: ${exp.title}, Paid by: ${exp.paidBy}, Split between: ${exp.splitBetween.join(',')}`);
      });
    }
  }, [currentUser, expenses, userId]);

  // Calculate financial data with combined currency conversion
  const [combinedBalance, setCombinedBalance] = useState<{
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    currency: string;
  }>({ totalIncome: 0, totalExpenses: 0, netBalance: 0, currency: 'USD' });

  // Calculate combined balance across both local and home currencies
  useEffect(() => {
    const calculateCombinedBalance = async () => {
      try {
        const currencyService = CurrencyService.getInstance();
        
        // Get all personal expenses for the user
        const userPersonalExpenses = personalExpenses.filter(e => e.userId === userId);
        const localExpenses = userPersonalExpenses.filter(e => !e.isHomeCountry);
        const homeExpenses = userPersonalExpenses.filter(e => e.isHomeCountry);

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
        // Fallback to simple calculation
        const userPersonalExpenses = personalExpenses.filter(e => e.userId === userId);
        const totalIncome = userPersonalExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = userPersonalExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const netBalance = totalIncome - totalExpenses;
        
        setCombinedBalance({
          totalIncome,
          totalExpenses,
          netBalance,
          currency: 'USD'
        });
      }
    };

    if (userId) {
      calculateCombinedBalance();
    }
  }, [personalExpenses, userId]);

  // Legacy calculation for backward compatibility
  const userPersonalExpenses = personalExpenses.filter(e => e.userId === userId);
  const totalIncome = userPersonalExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = userPersonalExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const netBalance = combinedBalance.netBalance; // Use combined balance
  
  const userBudgets = budgets.filter(b => b.userId === userId && b.isActive);
  const userGoals = financialGoals.filter(g => g.userId === userId && !g.isCompleted);
  const activeGoal = userGoals.sort((a, b) => b.priority === 'high' ? 1 : -1)[0];
  
  const totalOwed = getTotalOwed(userId);
  const totalOwing = getTotalOwing(userId);
  const chorePoints = getUserPoints(userId);
  const pendingChores = chores.filter(c => c.assignedTo === userId && c.status === 'pending').length;

  // Enhanced Quick Action Data
  const quickActions = [
    {
      id: 'smart-split',
      title: 'Smart Split',
      subtitle: 'Scan & Split',
      icon: 'camera',
      colors: [THEME_COLORS.primary, THEME_COLORS.primaryLight],
      onPress: () => navigation.navigate('SplitBill' as any)
    },
    {
      id: 'ai-analytics',
      title: 'AI Analytics',
      subtitle: 'Smart Insights',
      icon: 'analytics',
      colors: [THEME_COLORS.secondary, THEME_COLORS.secondaryLight],
      onPress: () => navigation.navigate('Analytics' as any)
    },
    {
      id: 'split-bill',
      title: 'Split Bill',
      subtitle: 'Group Expense',
      icon: 'people',
      colors: [THEME_COLORS.accent, THEME_COLORS.accentLight],
      onPress: () => navigation.navigate('SplitBill' as any)
    },
    {
      id: 'personal',
      title: 'Personal',
      subtitle: 'My Finances',
      icon: 'wallet',
      colors: [THEME_COLORS.success, THEME_COLORS.successLight],
      onPress: () => {
        // Show a message that Personal tab is available
        Alert.alert('Personal Finance', 'Use the Personal tab at the bottom to manage your personal finances!');
      }
    }
  ];

  // Personal Finance Summary for Dashboard
  const personalFinanceSummary = {
    hasPersonalData: userPersonalExpenses.length > 0,
    hasBudgets: userBudgets.length > 0,
    hasGoals: userGoals.length > 0,
    recentTransactions: userPersonalExpenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
  };

  return (
    <View 
      className="flex-1"
      style={{ 
        backgroundColor: THEME_COLORS.background,
        paddingTop: insets.top 
      }}
    >
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <Animated.View 
          entering={FadeInUp}
          className="px-6 py-6"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text style={{ color: THEME_COLORS.textSecondary, fontSize: 16 }}>
                Welcome back,
              </Text>
              <Text 
                className="text-2xl font-bold"
                style={{ color: THEME_COLORS.primary }}
              >
                {currentUser?.name || 'Alex Student'}!
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              className="p-3 rounded-full"
              style={{ backgroundColor: THEME_COLORS.surface }}
            >
              <Ionicons name="settings" size={24} color={THEME_COLORS.primary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Financial Overview Widget */}
        <Animated.View entering={FadeInUp.delay(100)} className="px-6 mb-4">
          <Text 
            className="text-lg font-bold mb-3"
            style={{ color: THEME_COLORS.text }}
          >
            💰 Financial Overview
          </Text>
          <View 
            className="rounded-2xl p-4"
            style={{ 
              backgroundColor: THEME_COLORS.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 3,
              borderWidth: 1,
              borderColor: THEME_COLORS.border
            }}
          >
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text style={{ color: THEME_COLORS.textSecondary, fontSize: 11, marginBottom: 2 }}>
                  Personal Balance
                </Text>
                <Pressable onPress={() => {
                  // Show alert to guide user to Personal tab
                  Alert.alert('Personal Finance', 'Use the Personal tab at the bottom to manage your personal finances!');
                }}>
                  <Text 
                    className="text-lg font-bold"
                    style={{ color: combinedBalance.netBalance >= 0 ? THEME_COLORS.success : THEME_COLORS.error }}
                  >
                    ${Math.abs(combinedBalance.netBalance).toFixed(2)}
                  </Text>
                </Pressable>
                <Text style={{ color: THEME_COLORS.textLight, fontSize: 9 }}>
                  {combinedBalance.netBalance >= 0 ? 'Positive' : 'Negative'}
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text style={{ color: THEME_COLORS.textSecondary, fontSize: 11, marginBottom: 2 }}>
                  You Are Owed
                </Text>
                <Text className="text-lg font-bold" style={{ color: THEME_COLORS.success }}>
                  ${getTotalOwed(userId).toFixed(2)}
                </Text>
                <Text style={{ color: THEME_COLORS.textLight, fontSize: 9 }}>
                  From Friends
                </Text>
              </View>
              <View className="items-center flex-1">
                <Text style={{ color: THEME_COLORS.textSecondary, fontSize: 11, marginBottom: 2 }}>
                  You Owe
                </Text>
                <Text className="text-lg font-bold" style={{ color: THEME_COLORS.error }}>
                  ${getTotalOwing(userId).toFixed(2)}
                </Text>
                <Text style={{ color: THEME_COLORS.textLight, fontSize: 9 }}>
                  To Friends
                </Text>
              </View>
            </View>
            
            {activeGoal && (
              <View 
                className="mt-3 p-2 rounded-xl"
                style={{ backgroundColor: THEME_COLORS.secondary + '10' }}
              >
                <Text className="text-xs font-semibold mb-1" style={{ color: THEME_COLORS.secondary }}>
                  🎯 {activeGoal.title}
                </Text>
                <View className="flex-row justify-between items-center">
                  <View 
                    className="rounded-full h-1.5 flex-1 mr-2"
                    style={{ backgroundColor: THEME_COLORS.divider }}
                  >
                    <View 
                      className="h-1.5 rounded-full"
                      style={{ 
                        width: `${Math.min((activeGoal.currentAmount / activeGoal.targetAmount) * 100, 100)}%`,
                        backgroundColor: THEME_COLORS.secondary
                      }}
                    />
                  </View>
                  <Text className="text-xs font-medium" style={{ color: THEME_COLORS.secondary }}>
                    ${activeGoal.currentAmount.toFixed(0)}/${activeGoal.targetAmount.toFixed(0)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Ride Log Widget */}
        <Animated.View entering={FadeInUp.delay(150)} className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text 
              className="text-lg font-bold"
              style={{ color: THEME_COLORS.text }}
            >
              🚗 Quick Ride Log
            </Text>
            <Pressable
              onPress={() => navigation.navigate('RideLog')}
              className="flex-row items-center"
            >
              <Text 
                className="text-sm font-medium mr-1"
                style={{ color: THEME_COLORS.primary }}
              >
                View All
              </Text>
              <Ionicons name="chevron-forward" size={16} color={THEME_COLORS.primary} />
            </Pressable>
          </View>
          
          <View 
            className="rounded-2xl p-4"
            style={{ 
              backgroundColor: THEME_COLORS.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 1,
              borderColor: THEME_COLORS.border
            }}
          >
            <Text className="text-sm font-medium mb-3" style={{ color: THEME_COLORS.textSecondary }}>
              Favorite Riders
            </Text>
            
            <View className="flex-row justify-between mb-4">
              {favoriteRiders.slice(0, 3).map((rider, index) => (
                <Pressable
                  key={rider.id}
                  onPress={() => {
                    // One-tap ride creation with this favorite rider
                    navigation.navigate('CreateRide', { 
                      selectedPassenger: rider.id,
                      rideDescription: rider.lastRide 
                    });
                  }}
                  className="items-center flex-1"
                >
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: THEME_COLORS.surface }}
                  >
                    <Text className="text-lg">{rider.avatar}</Text>
                  </View>
                  <Text 
                    className="text-xs font-medium text-center"
                    style={{ color: THEME_COLORS.text }}
                    numberOfLines={1}
                  >
                    {rider.name.split(' ')[0]}
                  </Text>
                  <Text 
                    className="text-xs text-center"
                    style={{ color: THEME_COLORS.textLight }}
                  >
                    {rider.rides} rides
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <Pressable
              onPress={() => navigation.navigate('CreateRide' as any)}
              className="rounded-xl p-3"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-semibold">Log New Ride</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(200)} className="px-6 mb-6">
          <Text 
            className="text-lg font-bold mb-4"
            style={{ color: THEME_COLORS.text }}
          >
            ⚡ Quick Actions
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.id}
                entering={BounceIn.delay(100 * index)}
                style={{ width: (width - 60) / 2, marginBottom: 16 }}
              >
                <Pressable
                  onPress={action.onPress}
                  className="rounded-2xl overflow-hidden"
                  style={{ 
                    height: 120,
                    shadowColor: action.colors[0],
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 6
                  }}
                >
                  <LinearGradient
                    colors={action.colors as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="flex-1 p-4 justify-between"
                  >
                    {/* Icon at top */}
                    <View className="self-start">
                      <View 
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                      >
                        <Ionicons 
                          name={action.icon as any} 
                          size={20} 
                          color="white" 
                        />
                      </View>
                    </View>
                    
                    {/* Content at bottom */}
                    <View>
                      <Text className="text-white font-bold text-base mb-1">
                        {action.title}
                      </Text>
                      <Text className="text-white opacity-90 text-sm">
                        {action.subtitle}
                      </Text>
                    </View>
                    
                    {/* Arrow indicator */}
                    <View className="absolute top-3 right-3">
                      <Ionicons 
                        name="arrow-forward" 
                        size={16} 
                        color="rgba(255,255,255,0.8)" 
                      />
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInUp.delay(300)} className="px-6 mb-4">
          <View className="flex-row justify-between">
            <View 
              className="flex-1 mr-2 p-4 rounded-xl items-center"
              style={{ 
                backgroundColor: THEME_COLORS.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                borderWidth: 1,
                borderColor: THEME_COLORS.border
              }}
            >
              <View 
                className="w-10 h-10 rounded-lg items-center justify-center mb-2"
                style={{ backgroundColor: THEME_COLORS.accent + '15' }}
              >
                <Ionicons name="trophy" size={20} color={THEME_COLORS.accent} />
              </View>
              <Text 
                className="text-lg font-bold"
                style={{ color: THEME_COLORS.accent }}
              >
                {chorePoints}
              </Text>
              <Text style={{ color: THEME_COLORS.textSecondary, fontSize: 11 }}>
                Chore Points
              </Text>
            </View>
            
            <View 
              className="flex-1 ml-2 p-4 rounded-xl items-center"
              style={{ 
                backgroundColor: THEME_COLORS.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                borderWidth: 1,
                borderColor: THEME_COLORS.border
              }}
            >
              <View 
                className="w-10 h-10 rounded-lg items-center justify-center mb-2"
                style={{ backgroundColor: THEME_COLORS.secondary + '15' }}
              >
                <Ionicons name="time" size={20} color={THEME_COLORS.secondary} />
              </View>
              <Text 
                className="text-lg font-bold"
                style={{ color: THEME_COLORS.secondary }}
              >
                {pendingChores}
              </Text>
              <Text style={{ color: THEME_COLORS.textSecondary, fontSize: 11 }}>
                Pending Tasks
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Budget Alert */}
        {userBudgets.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400)} className="px-6 mb-4">
            <Text 
              className="text-lg font-bold mb-4"
              style={{ color: THEME_COLORS.text }}
            >
              📊 Budget Status
            </Text>
            {userBudgets.slice(0, 2).map(budget => {
              const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
              const isWarning = percentage >= budget.alertThreshold;
              
              return (
                <View 
                  key={budget.id}
                  className="p-4 rounded-xl mb-3"
                  style={{ 
                    backgroundColor: THEME_COLORS.card,
                    borderLeftWidth: 4,
                    borderLeftColor: isWarning ? THEME_COLORS.error : THEME_COLORS.success,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2
                  }}
                >
                  <View className="flex-row justify-between items-center mb-3">
                    <Text 
                      className="font-semibold capitalize"
                      style={{ color: THEME_COLORS.text }}
                    >
                      {budget.category}
                    </Text>
                    <Text 
                      className="font-bold"
                      style={{ color: isWarning ? THEME_COLORS.error : THEME_COLORS.success }}
                    >
                      ${budget.spent.toFixed(0)}/${budget.limit.toFixed(0)}
                    </Text>
                  </View>
                  <View 
                    className="rounded-full h-2 mb-2"
                    style={{ backgroundColor: THEME_COLORS.divider }}
                  >
                    <View 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: isWarning ? THEME_COLORS.error : THEME_COLORS.success
                      }}
                    />
                  </View>
                  <Text style={{ color: THEME_COLORS.textSecondary, fontSize: 12 }}>
                    {percentage.toFixed(0)}% used
                    {isWarning && ' ⚠️ Over threshold!'}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}


      </ScrollView>

      {/* Floating AI Chat Bar */}
      <Animated.View 
        entering={FadeInUp.delay(600)}
        className="absolute bottom-24 left-4 right-4"
      >
        <Pressable
          onPress={() => navigation.navigate('AIChat' as any)}
          className="rounded-full p-4 overflow-hidden"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
            backgroundColor: 'rgba(59, 130, 246, 0.9)', // Blue glassmorphic background
          }}
        >
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.95)', 'rgba(37, 99, 235, 0.95)', 'rgba(29, 78, 216, 0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="absolute inset-0 rounded-full"
          />
          <View className="flex-row items-center justify-between relative z-10">
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
              >
                <Ionicons name="sparkles" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-white text-base">
                  AI Assistant
                </Text>
                <Text className="text-xs text-white opacity-95">
                  Ask me anything about expenses, budgets, or splitting bills
                </Text>
              </View>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="white" 
            />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}