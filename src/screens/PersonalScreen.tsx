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
import { PersonalExpense } from '../types';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PersonalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const { personalExpenses } = useExpenseStore();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'expenses' | 'income'>('overview');
  
  const isDark = settings.theme === 'dark';
  
  const expenses = personalExpenses.filter(e => e.type === 'expense');
  const income = personalExpenses.filter(e => e.type === 'income');
  
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  
  // Get current month data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const thisMonthIncome = income.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const monthlyIncome = thisMonthIncome.reduce((sum, item) => sum + item.amount, 0);
  const monthlyExpenses = thisMonthExpenses.reduce((sum, item) => sum + item.amount, 0);

  const PersonalExpenseItem = ({ item }: { item: PersonalExpense }) => (
    <GlassCard className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className={cn(
            "font-semibold text-base",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {item.title}
          </Text>
          
          {item.description && (
            <Text className={cn(
              "text-sm opacity-70 mt-1",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {item.description}
            </Text>
          )}
          
          <View className="flex-row items-center mt-2">
            <View className={cn(
              "px-2 py-1 rounded-full mr-2",
              getCategoryColor(item.category)
            )}>
              <Text className="text-xs font-medium text-white">
                {item.category.toUpperCase()}
              </Text>
            </View>
            
            <View className={cn(
              "px-2 py-1 rounded-full",
              item.type === 'income' ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              <Text className={cn(
                "text-xs font-medium",
                item.type === 'income' ? "text-green-500" : "text-red-500"
              )}>
                {item.type.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text className={cn(
            "text-xs opacity-60 mt-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {format(new Date(item.date), 'MMM dd, yyyy')}
          </Text>
        </View>
        
        <View className="items-end">
          <Text className={cn(
            "text-lg font-bold",
            item.type === 'income' ? "text-green-500" : isDark ? "text-white" : "text-gray-900"
          )}>
            {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
          </Text>
          <Text className={cn(
            "text-xs opacity-60",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {item.currency}
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  const StatCard = ({ title, amount, subtitle, color = "blue", icon }: {
    title: string;
    amount: number;
    subtitle?: string;
    color?: "blue" | "green" | "red";
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    const colorClasses = {
      blue: "text-blue-500",
      green: "text-green-500", 
      red: "text-red-500"
    };

    return (
      <GlassCard className="flex-1 mx-1">
        <View className="items-center py-4">
          <Ionicons name={icon} size={24} color={
            color === "green" ? "#10B981" : 
            color === "red" ? "#EF4444" : "#3B82F6"
          } />
          <Text className={cn(
            "text-xs opacity-70 mt-2 text-center",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {title}
          </Text>
          <Text className={cn(
            "text-lg font-bold mt-1",
            colorClasses[color]
          )}>
            ${amount.toFixed(2)}
          </Text>
          {subtitle && (
            <Text className={cn(
              "text-xs opacity-60 text-center",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {subtitle}
            </Text>
          )}
        </View>
      </GlassCard>
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
            Personal Finance
          </Text>
          <AnimatedButton
            title="Add"
            size="sm"
            icon={<Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />}
            onPress={() => navigation.navigate('PersonalFinance')}
          />
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-gray-200/30 rounded-xl p-1">
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'overview' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('overview')}
          >
            <Text className={cn(
              "font-medium text-xs",
              selectedTab === 'overview' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              Overview
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'expenses' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('expenses')}
          >
            <Text className={cn(
              "font-medium text-xs",
              selectedTab === 'expenses' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              Expenses
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'income' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('income')}
          >
            <Text className={cn(
              "font-medium text-xs",
              selectedTab === 'income' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              Income
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'overview' && (
          <>
            {/* Balance Overview */}
            <GlassCard className="mb-6">
              <Text className={cn(
                "text-lg font-semibold mb-4",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Balance Overview
              </Text>
              <View className="items-center">
                <Text className={cn(
                  "text-sm opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Net Balance
                </Text>
                <Text className={cn(
                  "text-3xl font-bold mt-2",
                  netBalance >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
                </Text>
                <Text className={cn(
                  "text-xs opacity-60 mt-1",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Total Income - Total Expenses
                </Text>
              </View>
            </GlassCard>

            {/* Monthly Stats */}
            <View className="flex-row mb-6">
              <StatCard 
                title="This Month Income" 
                amount={monthlyIncome} 
                icon="trending-up-outline"
                color="green"
              />
              <StatCard 
                title="This Month Expenses" 
                amount={monthlyExpenses} 
                icon="trending-down-outline"
                color="red"
              />
            </View>

            {/* All Time Stats */}
            <View className="flex-row mb-6">
              <StatCard 
                title="Total Income" 
                amount={totalIncome} 
                subtitle={`${income.length} transactions`}
                icon="wallet-outline"
                color="green"
              />
              <StatCard 
                title="Total Expenses" 
                amount={totalExpenses} 
                subtitle={`${expenses.length} transactions`}
                icon="card-outline"
                color="red"
              />
            </View>

            {/* Recent Activity */}
            <GlassCard>
              <Text className={cn(
                "text-lg font-semibold mb-4",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Recent Activity
              </Text>
              {personalExpenses.length > 0 ? (
                personalExpenses.slice(0, 3).map((item, index) => (
                  <View key={item.id} className={cn(
                    "flex-row items-center justify-between py-3",
                    index < 2 && "border-b border-gray-200/20"
                  )}>
                    <View className="flex-1">
                      <Text className={cn(
                        "font-medium",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {item.title}
                      </Text>
                      <Text className={cn(
                        "text-sm opacity-70",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {item.category} • {format(new Date(item.date), 'MMM dd')}
                      </Text>
                    </View>
                    <Text className={cn(
                      "font-semibold",
                      item.type === 'income' ? "text-green-500" : isDark ? "text-white" : "text-gray-900"
                    )}>
                      {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                    </Text>
                  </View>
                ))
              ) : (
                <View className="items-center py-4">
                  <Text className={cn(
                    "opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No personal transactions yet
                  </Text>
                </View>
              )}
            </GlassCard>
          </>
        )}

        {selectedTab === 'expenses' && (
          <>
            <Text className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Personal Expenses ({expenses.length})
            </Text>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <PersonalExpenseItem key={expense.id} item={expense} />
              ))
            ) : (
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons 
                    name="card-outline" 
                    size={48} 
                    color={isDark ? "#6B7280" : "#9CA3AF"} 
                  />
                  <Text className={cn(
                    "text-lg font-medium mt-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No personal expenses yet
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70 text-center mt-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Add your first personal expense to start tracking
                  </Text>
                  <AnimatedButton
                    title="Add Personal Expense"
                    className="mt-4"
                    onPress={() => navigation.navigate('PersonalFinance')}
                  />
                </View>
              </GlassCard>
            )}
          </>
        )}

        {selectedTab === 'income' && (
          <>
            <Text className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Personal Income ({income.length})
            </Text>
            {income.length > 0 ? (
              income.map((incomeItem) => (
                <PersonalExpenseItem key={incomeItem.id} item={incomeItem} />
              ))
            ) : (
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons 
                    name="wallet-outline" 
                    size={48} 
                    color={isDark ? "#6B7280" : "#9CA3AF"} 
                  />
                  <Text className={cn(
                    "text-lg font-medium mt-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No income recorded yet
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70 text-center mt-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Add your income sources to track your financial health
                  </Text>
                  <AnimatedButton
                    title="Add Income"
                    className="mt-4"
                    onPress={() => navigation.navigate('PersonalFinance')}
                  />
                </View>
              </GlassCard>
            )}
          </>
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