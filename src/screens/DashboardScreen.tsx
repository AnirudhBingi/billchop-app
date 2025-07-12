import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { useChoreStore } from '../state/useChoreStore';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { mockUsers, mockGroups, mockExpenses, mockChores, mockPersonalExpenses } from '../utils/mockData';
import { cn } from '../utils/cn';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const { expenses, personalExpenses, getTotalOwed, getTotalOwing } = useExpenseStore();
  const { chores, getUserPoints } = useChoreStore();
  
  const isDark = settings.theme === 'dark';
  
  // Initialize mock data for demo
  useEffect(() => {
    if (!currentUser) {
      // Set current user
      useUserStore.getState().setCurrentUser(mockUsers[0]);
      
      // Add friends
      mockUsers.slice(1).forEach(user => {
        useUserStore.getState().addFriend(user);
      });
      
      // Add groups
      mockGroups.forEach(group => {
        useExpenseStore.getState().addGroup(group);
      });
      
      // Add expenses
      mockExpenses.forEach(expense => {
        useExpenseStore.getState().addExpense(expense);
      });
      
      // Add chores
      mockChores.forEach(chore => {
        useChoreStore.getState().addChore(chore);
      });
      
      // Add personal expenses
      mockPersonalExpenses.forEach(expense => {
        useExpenseStore.getState().addPersonalExpense(expense);
      });
      
      // Update leaderboard
      useChoreStore.getState().updateLeaderboard();
    }
  }, [currentUser]);

  const totalOwed = currentUser ? getTotalOwed(currentUser.id) : 0;
  const totalOwing = currentUser ? getTotalOwing(currentUser.id) : 0;
  const userPoints = currentUser ? getUserPoints(currentUser.id) : 0;
  const pendingChores = chores.filter(c => c.status === 'pending').length;
  const recentExpenses = expenses.slice(0, 3);

  const QuickActionCard = ({ title, icon, onPress, color = "#3B82F6" }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    color?: string;
  }) => (
    <Pressable onPress={onPress} className="flex-1">
      <GlassCard className="items-center justify-center h-20 mx-1">
        <Ionicons 
          name={icon} 
          size={20} 
          color={color} 
        />
        <Text className={cn(
          "text-xs font-medium mt-1 text-center",
          isDark ? "text-white" : "text-gray-900"
        )}>
          {title}
        </Text>
      </GlassCard>
    </Pressable>
  );

  return (
    <View 
      className={cn(
        "flex-1",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className={cn(
              "text-2xl font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Welcome back,
            </Text>
            <Text className={cn(
              "text-2xl font-bold text-blue-500"
            )}>
              {currentUser?.name || 'Student'}!
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Settings')}>
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={isDark ? "#FFFFFF" : "#111827"} 
            />
          </Pressable>
        </View>

        {/* Balance Overview */}
        <GlassCard className="mb-6">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Balance Overview
          </Text>
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className={cn(
                "text-sm opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                You owe
              </Text>
              <Text className="text-2xl font-bold text-red-500">
                ${totalOwing.toFixed(2)}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className={cn(
                "text-sm opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                You're owed
              </Text>
              <Text className="text-2xl font-bold text-green-500">
                ${totalOwed.toFixed(2)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="mb-6">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Quick Actions
          </Text>
          
          {/* First Row - Revolutionary Features */}
          <View className="flex-row mb-3">
            <QuickActionCard
              title="📸 Smart Split"
              icon="camera-outline"
              onPress={() => navigation.navigate('SplitBill')}
              color="#EF4444"
            />
            <QuickActionCard
              title="🧠 AI Analytics"
              icon="analytics-outline"
              onPress={() => navigation.navigate('Analytics')}
              color="#8B5CF6"
            />
          </View>
          
          {/* Second Row - Core Functions */}
          <View className="flex-row mb-3">
            <QuickActionCard
              title="Split Bill"
              icon="people-outline"
              onPress={() => navigation.navigate('SplitBill')}
              color="#3B82F6"
            />
            <QuickActionCard
              title="Personal"
              icon="wallet-outline"
              onPress={() => navigation.navigate('PersonalFinance')}
              color="#F59E0B"
            />
          </View>
          
          {/* Third Row - Chores */}
          <View className="flex-row">
            <QuickActionCard
              title="Add Chore"
              icon="checkmark-circle-outline"
              onPress={() => navigation.navigate('AddChore', {})}
              color="#8B5CF6"
            />
            <View className="flex-1 mx-1">
              {/* Empty space for visual balance */}
            </View>
          </View>
        </GlassCard>

        {/* Stats Cards */}
        <View className="flex-row mb-6">
          <GlassCard className="flex-1 mr-2">
            <View className="items-center">
              <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
              <Text className={cn(
                "text-sm opacity-70 mt-2",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Chore Points
              </Text>
              <Text className={cn(
                "text-xl font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {userPoints}
              </Text>
            </View>
          </GlassCard>
          
          <GlassCard className="flex-1 ml-2">
            <View className="items-center">
              <Ionicons name="time-outline" size={24} color="#EF4444" />
              <Text className={cn(
                "text-sm opacity-70 mt-2",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Pending Chores
              </Text>
              <Text className={cn(
                "text-xl font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {pendingChores}
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Recent Activity */}
        <GlassCard className="mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className={cn(
              "text-lg font-semibold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Recent Expenses
            </Text>
            <Pressable onPress={() => navigation.navigate('MainTabs')}>
              <Text className="text-blue-500 font-medium">View All</Text>
            </Pressable>
          </View>
          
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => (
              <View key={expense.id} className="flex-row items-center justify-between py-3 border-b border-gray-200/20">
                <View className="flex-1">
                  <Text className={cn(
                    "font-medium",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {expense.title}
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {expense.category}
                  </Text>
                </View>
                <Text className={cn(
                  "font-semibold",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  ${expense.amount.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <Text className={cn(
              "text-center py-4 opacity-70",
              isDark ? "text-white" : "text-gray-900"
            )}>
              No recent expenses
            </Text>
          )}
        </GlassCard>

        {/* AI Assistant CTA */}
        <GlassCard>
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
              <Ionicons name="chatbubble-outline" size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className={cn(
                "font-semibold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                AI Assistant
              </Text>
              <Text className={cn(
                "text-sm opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Ask me to add expenses, split bills, or get insights
              </Text>
            </View>
            <AnimatedButton
              title="Chat"
              size="sm"
              onPress={() => {
                // Placeholder for AI chat - could integrate with existing API
                console.log('AI Chat feature - integrate with chat-service.ts');
              }}
            />
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}