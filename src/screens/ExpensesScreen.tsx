import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { Expense, Group } from '../types';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings, friends } = useUserStore();
  const { expenses, groups } = useExpenseStore();
  const [selectedTab, setSelectedTab] = useState<'all' | 'groups'>('all');
  
  const isDark = settings.theme === 'dark';
  
  const filteredExpenses = expenses.filter(e => !e.isDraft);
  const draftExpenses = expenses.filter(e => e.isDraft);

  const ExpenseItem = ({ expense }: { expense: Expense }) => {
    const paidByUser = friends.find(f => f.id === expense.paidBy) || currentUser;
    const group = expense.groupId ? groups.find(g => g.id === expense.groupId) : null;
    
    return (
      <GlassCard className="mb-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className={cn(
              "font-semibold text-base",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {expense.title}
            </Text>
            
            {expense.description && (
              <Text className={cn(
                "text-sm opacity-70 mt-1",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {expense.description}
              </Text>
            )}
            
            <View className="flex-row items-center mt-2">
              <View className={cn(
                "px-2 py-1 rounded-full mr-2",
                getCategoryColor(expense.category)
              )}>
                <Text className="text-xs font-medium text-white">
                  {expense.category.toUpperCase()}
                </Text>
              </View>
              
              {group && (
                <View className="px-2 py-1 bg-blue-500/20 rounded-full mr-2">
                  <Text className="text-xs font-medium text-blue-500">
                    {group.name}
                  </Text>
                </View>
              )}
            </View>
            
            <Text className={cn(
              "text-xs opacity-60 mt-2",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Paid by {paidByUser?.name || 'Unknown'} • {format(new Date(expense.date), 'MMM dd, yyyy')}
            </Text>
          </View>
          
          <View className="items-end">
            <Text className={cn(
              "text-lg font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              ${expense.amount.toFixed(2)}
            </Text>
            <Text className={cn(
              "text-xs opacity-60",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {expense.currency}
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const GroupItem = ({ group }: { group: Group }) => {
    const groupExpenses = expenses.filter(e => e.groupId === group.id && !e.isDraft);
    const totalAmount = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return (
      <Pressable onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}>
        <GlassCard className="mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className={cn(
                "font-semibold text-base",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {group.name}
              </Text>
              
              {group.description && (
                <Text className={cn(
                  "text-sm opacity-70 mt-1",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {group.description}
                </Text>
              )}
              
              <Text className={cn(
                "text-xs opacity-60 mt-2",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {group.members.length} members • {groupExpenses.length} expenses
              </Text>
            </View>
            
            <View className="items-end">
              <Text className={cn(
                "text-lg font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                ${totalAmount.toFixed(2)}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={isDark ? "#9CA3AF" : "#6B7280"} 
              />
            </View>
          </View>
        </GlassCard>
      </Pressable>
    );
  };

  return (
    <View 
      className={cn(
        "flex-1",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className={cn(
            "text-2xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Expenses
          </Text>
          <AnimatedButton
            title="Add"
            size="sm"
            icon={<Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />}
            onPress={() => navigation.navigate('AddExpense', {})}
          />
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-gray-200/30 rounded-xl p-1">
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'all' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('all')}
          >
            <Text className={cn(
              "font-medium",
              selectedTab === 'all' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              All Expenses
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'groups' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('groups')}
          >
            <Text className={cn(
              "font-medium",
              selectedTab === 'groups' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              Groups
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Draft Expenses */}
        {draftExpenses.length > 0 && selectedTab === 'all' && (
          <View className="mb-4">
            <Text className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Drafts
            </Text>
            {draftExpenses.map((expense) => (
              <View key={expense.id} className="relative">
                <ExpenseItem expense={expense} />
                <View className="absolute top-2 right-2">
                  <View className="bg-orange-500 px-2 py-1 rounded-full">
                    <Text className="text-xs font-medium text-white">DRAFT</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Main Content */}
        {selectedTab === 'all' ? (
          <View>
            <Text className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Recent Expenses
            </Text>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <ExpenseItem key={expense.id} expense={expense} />
              ))
            ) : (
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons 
                    name="receipt-outline" 
                    size={48} 
                    color={isDark ? "#6B7280" : "#9CA3AF"} 
                  />
                  <Text className={cn(
                    "text-lg font-medium mt-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No expenses yet
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70 text-center mt-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Start by adding your first expense or creating a group
                  </Text>
                  <AnimatedButton
                    title="Add Expense"
                    className="mt-4"
                    onPress={() => navigation.navigate('AddExpense', {})}
                  />
                </View>
              </GlassCard>
            )}
          </View>
        ) : (
          <View>
            <Text className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Your Groups
            </Text>
            {groups.length > 0 ? (
              groups.map((group) => (
                <GroupItem key={group.id} group={group} />
              ))
            ) : (
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons 
                    name="people-outline" 
                    size={48} 
                    color={isDark ? "#6B7280" : "#9CA3AF"} 
                  />
                  <Text className={cn(
                    "text-lg font-medium mt-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No groups yet
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70 text-center mt-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Create a group to split expenses with roommates or friends
                  </Text>
                  <AnimatedButton
                    title="Create Group"
                    className="mt-4"
                    onPress={() => {/* TODO: Create group functionality */}}
                  />
                </View>
              </GlassCard>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    food: 'bg-orange-500',
    transportation: 'bg-blue-500',
    utilities: 'bg-yellow-500',
    entertainment: 'bg-purple-500',
    shopping: 'bg-pink-500',
    healthcare: 'bg-red-500',
    education: 'bg-indigo-500',
    rent: 'bg-green-500',
    groceries: 'bg-teal-500',
    other: 'bg-gray-500',
  };
  return colors[category] || 'bg-gray-500';
}