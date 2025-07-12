import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Squid Game Color Palette
const SQUID_COLORS = {
  pink: '#E91E63',
  lightPink: '#F7B5CA',
  teal: '#16A085',
  lightTeal: '#00BCD4',
  black: '#212121',
  white: '#FFFFFF',
  darkPink: '#C2185B',
  darkTeal: '#138D75'
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

  // Initialize mock data for demo
  useEffect(() => {
    if (!currentUser) {
      useUserStore.getState().setCurrentUser(mockUsers[0]);
      mockUsers.slice(1).forEach(user => {
        useUserStore.getState().addFriend(user);
      });
      mockGroups.forEach(group => {
        useExpenseStore.getState().addGroup(group);
      });
      mockExpenses.forEach(expense => {
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

  // Calculate financial data
  const userPersonalExpenses = personalExpenses.filter(e => e.userId === userId);
  const totalIncome = userPersonalExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = userPersonalExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  
  const userBudgets = budgets.filter(b => b.userId === userId && b.isActive);
  const userGoals = financialGoals.filter(g => g.userId === userId && !g.isCompleted);
  const activeGoal = userGoals.sort((a, b) => b.priority === 'high' ? 1 : -1)[0];
  
  const totalOwed = getTotalOwed(userId);
  const totalOwing = getTotalOwing(userId);
  const chorePoints = getUserPoints(userId);
  const pendingChores = chores.filter(c => c.assignedTo === userId && c.status === 'pending').length;

  // Quick Action Data with Squid Game styling
  const quickActions = [
    {
      id: 'smart-split',
      title: 'Smart Split',
      subtitle: '📸 Scan & Split',
      icon: 'camera',
      colors: [SQUID_COLORS.pink, SQUID_COLORS.darkPink],
      onPress: () => navigation.navigate('SplitBill')
    },
    {
      id: 'ai-analytics',
      title: 'AI Analytics',
      subtitle: '🧠 Smart Insights',
      icon: 'analytics',
      colors: [SQUID_COLORS.teal, SQUID_COLORS.darkTeal],
      onPress: () => navigation.navigate('Analytics')
    },
    {
      id: 'split-bill',
      title: 'Split Bill',
      subtitle: '👥 Group Expense',
      icon: 'people',
      colors: [SQUID_COLORS.lightPink, SQUID_COLORS.pink],
      onPress: () => navigation.navigate('SplitBill')
    },
    {
      id: 'personal',
      title: 'Personal',
      subtitle: '💰 My Finances',
      icon: 'wallet',
      colors: [SQUID_COLORS.lightTeal, SQUID_COLORS.teal],
      onPress: () => navigation.navigate('MainTabs', { screen: 'Personal' })
    },
    {
      id: 'add-chore',
      title: 'Add Chore',
      subtitle: '✅ Create Task',
      icon: 'checkmark-circle',
      colors: [SQUID_COLORS.pink, SQUID_COLORS.darkPink],
      onPress: () => navigation.navigate('AddChore')
    }
  ];

  return (
    <View 
      className="flex-1"
      style={{ 
        backgroundColor: isDark ? SQUID_COLORS.black : '#F8FAFC',
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
              <Text className="text-lg text-gray-600">Welcome back,</Text>
              <Text 
                className="text-2xl font-bold"
                style={{ color: SQUID_COLORS.pink }}
              >
                {currentUser?.name || 'Alex Student'}!
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              className="p-3 rounded-full"
              style={{ backgroundColor: SQUID_COLORS.lightPink + '20' }}
            >
              <Ionicons name="settings" size={24} color={SQUID_COLORS.pink} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Financial Overview Widget */}
        <Animated.View entering={FadeInUp.delay(100)} className="px-6 mb-6">
          <Text 
            className="text-lg font-bold mb-4"
            style={{ color: isDark ? SQUID_COLORS.white : SQUID_COLORS.black }}
          >
            💰 Financial Overview
          </Text>
          <View 
            className="rounded-2xl p-6 shadow-lg"
            style={{ 
              backgroundColor: isDark ? SQUID_COLORS.black : SQUID_COLORS.white,
              borderWidth: 2,
              borderColor: SQUID_COLORS.lightPink
            }}
          >
            <View className="flex-row justify-between mb-4">
              <View className="items-center flex-1">
                <Text className="text-sm text-gray-500 mb-1">Net Balance</Text>
                <Text 
                  className="text-xl font-bold"
                  style={{ color: netBalance >= 0 ? SQUID_COLORS.teal : SQUID_COLORS.pink }}
                >
                  ${Math.abs(netBalance).toFixed(2)}
                </Text>
                <Text className="text-xs text-gray-400">
                  {netBalance >= 0 ? 'Positive' : 'Negative'}
                </Text>
              </View>
              
              <View className="items-center flex-1">
                <Text className="text-sm text-gray-500 mb-1">You're Owed</Text>
                <Text 
                  className="text-xl font-bold"
                  style={{ color: SQUID_COLORS.teal }}
                >
                  ${totalOwed.toFixed(2)}
                </Text>
                <Text className="text-xs text-gray-400">From friends</Text>
              </View>
              
              <View className="items-center flex-1">
                <Text className="text-sm text-gray-500 mb-1">You Owe</Text>
                <Text 
                  className="text-xl font-bold"
                  style={{ color: SQUID_COLORS.pink }}
                >
                  ${totalOwing.toFixed(2)}
                </Text>
                <Text className="text-xs text-gray-400">To friends</Text>
              </View>
            </View>
            
            {activeGoal && (
              <View 
                className="mt-4 p-3 rounded-xl"
                style={{ backgroundColor: SQUID_COLORS.lightTeal + '20' }}
              >
                <Text className="text-sm font-semibold mb-1" style={{ color: SQUID_COLORS.teal }}>
                  🎯 Active Goal: {activeGoal.title}
                </Text>
                <View className="flex-row justify-between items-center">
                  <View className="bg-gray-200 rounded-full h-2 flex-1 mr-3">
                    <View 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${Math.min((activeGoal.currentAmount / activeGoal.targetAmount) * 100, 100)}%`,
                        backgroundColor: SQUID_COLORS.teal
                      }}
                    />
                  </View>
                  <Text className="text-xs font-medium" style={{ color: SQUID_COLORS.teal }}>
                    ${activeGoal.currentAmount.toFixed(0)}/${activeGoal.targetAmount.toFixed(0)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(200)} className="px-6 mb-6">
          <Text 
            className="text-lg font-bold mb-4"
            style={{ color: isDark ? SQUID_COLORS.white : SQUID_COLORS.black }}
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
                  className="rounded-2xl overflow-hidden shadow-lg"
                  style={{ height: 120 }}
                >
                  <LinearGradient
                    colors={action.colors}
                    className="flex-1 p-4 justify-between"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base mb-1">
                          {action.title}
                        </Text>
                        <Text className="text-white opacity-90 text-xs">
                          {action.subtitle}
                        </Text>
                      </View>
                      <View 
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                      >
                        <Ionicons 
                          name={action.icon as any} 
                          size={16} 
                          color="white" 
                        />
                      </View>
                    </View>
                    
                    <View className="self-end">
                      <Ionicons 
                        name="arrow-forward-circle" 
                        size={20} 
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
        <Animated.View entering={FadeInUp.delay(300)} className="px-6 mb-6">
          <View className="flex-row justify-between">
            <View 
              className="flex-1 mr-3 p-4 rounded-2xl items-center"
              style={{ 
                backgroundColor: SQUID_COLORS.lightPink + '20',
                borderWidth: 1,
                borderColor: SQUID_COLORS.lightPink
              }}
            >
              <Ionicons name="trophy" size={32} color={SQUID_COLORS.pink} />
              <Text 
                className="text-2xl font-bold mt-2"
                style={{ color: SQUID_COLORS.pink }}
              >
                {chorePoints}
              </Text>
              <Text className="text-sm text-gray-600">Chore Points</Text>
            </View>
            
            <View 
              className="flex-1 ml-3 p-4 rounded-2xl items-center"
              style={{ 
                backgroundColor: SQUID_COLORS.lightTeal + '20',
                borderWidth: 1,
                borderColor: SQUID_COLORS.lightTeal
              }}
            >
              <Ionicons name="time" size={32} color={SQUID_COLORS.teal} />
              <Text 
                className="text-2xl font-bold mt-2"
                style={{ color: SQUID_COLORS.teal }}
              >
                {pendingChores}
              </Text>
              <Text className="text-sm text-gray-600">Pending Tasks</Text>
            </View>
          </View>
        </Animated.View>

        {/* Budget Alert */}
        {userBudgets.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400)} className="px-6 mb-6">
            <Text 
              className="text-lg font-bold mb-4"
              style={{ color: isDark ? SQUID_COLORS.white : SQUID_COLORS.black }}
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
                    backgroundColor: isWarning ? SQUID_COLORS.lightPink + '20' : SQUID_COLORS.lightTeal + '20',
                    borderWidth: 1,
                    borderColor: isWarning ? SQUID_COLORS.lightPink : SQUID_COLORS.lightTeal
                  }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text 
                      className="font-semibold capitalize"
                      style={{ color: isDark ? SQUID_COLORS.white : SQUID_COLORS.black }}
                    >
                      {budget.category}
                    </Text>
                    <Text 
                      className="font-bold"
                      style={{ color: isWarning ? SQUID_COLORS.pink : SQUID_COLORS.teal }}
                    >
                      ${budget.spent.toFixed(0)}/${budget.limit.toFixed(0)}
                    </Text>
                  </View>
                  <View className="bg-gray-200 rounded-full h-2">
                    <View 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: isWarning ? SQUID_COLORS.pink : SQUID_COLORS.teal
                      }}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(0)}% used
                    {isWarning && ' ⚠️ Over threshold!'}
                  </Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* AI Assistant */}
        <Animated.View entering={FadeInDown.delay(500)} className="px-6 mb-6">
          <View 
            className="rounded-2xl p-6"
            style={{ 
              backgroundColor: isDark ? SQUID_COLORS.black : SQUID_COLORS.white,
              borderWidth: 2,
              borderColor: SQUID_COLORS.lightTeal
            }}
          >
            <View className="flex-row items-center mb-4">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: SQUID_COLORS.lightTeal }}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text 
                  className="text-lg font-bold"
                  style={{ color: isDark ? SQUID_COLORS.white : SQUID_COLORS.black }}
                >
                  AI Assistant
                </Text>
                <Text className="text-gray-500">
                  Ask me to add expenses, split bills, or get insights
                </Text>
              </View>
              <Pressable
                className="rounded-xl px-4 py-2"
                style={{ backgroundColor: SQUID_COLORS.teal }}
              >
                <Text className="text-white font-semibold">Chat</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}