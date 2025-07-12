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
import Animated, { FadeInUp } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PersonalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const { personalExpenses } = useExpenseStore();
  const [selectedMode, setSelectedMode] = useState<'selection' | 'local' | 'home'>('selection');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'budget' | 'goals' | 'insights'>('overview');
  
  const isDark = settings.theme === 'dark';
  
  // Revolutionary dual-currency system
  const [localCurrency] = useState({ code: 'USD', symbol: '$' });
  const [homeCurrency] = useState({ code: 'INR', symbol: '₹' });

  const expenses = personalExpenses.filter(e => e.type === 'expense');
  const income = personalExpenses.filter(e => e.type === 'income');
  
  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: "bg-orange-500",
      transportation: "bg-blue-500",
      utilities: "bg-yellow-500",
      entertainment: "bg-purple-500",
      shopping: "bg-pink-500",
      healthcare: "bg-red-500",
      education: "bg-green-500",
      rent: "bg-indigo-500",
      groceries: "bg-emerald-500",
      other: "bg-gray-500"
    };
    return colors[category] || "bg-gray-500";
  };

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
            ${item.amount.toFixed(2)}
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
              Choose your finance mode to get started
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(100)} 
            style={{ 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
              borderRadius: 16, 
              padding: 20, 
              marginBottom: 20,
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 2 }, 
              shadowOpacity: 0.1, 
              shadowRadius: 8, 
              elevation: 3
            }}
          >
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827', 
              marginBottom: 16 
            }}>
              🌍 Dual-Currency System
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: isDark ? '#9CA3AF' : '#6B7280', 
              marginBottom: 20 
            }}>
              Perfect for international students - manage both local and home country finances
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setSelectedMode('local')}
                style={{
                  flex: 1, 
                  padding: 24, 
                  borderRadius: 12, 
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
                  {localCurrency.symbol} {localCurrency.code} • Where you live now
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => setSelectedMode('home')}
                style={{
                  flex: 1, 
                  padding: 24, 
                  borderRadius: 12, 
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
                  {homeCurrency.symbol} {homeCurrency.code} • Your original country
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(200)} 
            style={{ 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
              borderRadius: 16, 
              padding: 20,
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 2 }, 
              shadowOpacity: 0.1, 
              shadowRadius: 8, 
              elevation: 3
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827', 
              marginBottom: 12 
            }}>
              ✨ Revolutionary Features
            </Text>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                📊 Smart budgeting with AI insights
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                🎯 Goal tracking with progress visualization
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                💱 Automatic currency conversion
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                🔮 Spending pattern prediction
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Main Personal Finance Dashboard
  const currentCurrency = selectedMode === 'local' ? localCurrency : homeCurrency;
  
  return (
    <View 
      className={cn(
        "flex-1",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Header with Mode Switch */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {selectedMode === 'local' ? '🏠 Local' : '🏡 Home'} Finances
              </Text>
              <Text className={cn(
                "text-sm opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {currentCurrency.symbol} {currentCurrency.code} • {selectedMode === 'local' ? 'Where you live' : 'Your home country'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => navigation.navigate('PersonalFinance')}
                style={{ 
                  padding: 8, 
                  borderRadius: 8, 
                  backgroundColor: '#10B981'
                }}
              >
                <Ionicons name="add" size={20} color="white" />
              </Pressable>
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
          </View>

          {/* Quick Actions */}
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF', 
            borderRadius: 16, 
            padding: 16, 
            marginBottom: 20,
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.1, 
            shadowRadius: 8, 
            elevation: 3
          }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827', 
              marginBottom: 12 
            }}>
              ⚡ Quick Actions
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => navigation.navigate('PersonalFinance')}
                style={{
                  flex: 1, 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: '#10B981', 
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600' }}>Add Income</Text>
              </Pressable>
              
              <Pressable
                onPress={() => navigation.navigate('PersonalFinance')}
                style={{
                  flex: 1, 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: '#EF4444', 
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="remove-circle" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600' }}>Add Expense</Text>
              </Pressable>
            </View>
          </View>

          {/* Balance Overview */}
          <GlassCard className="mb-6">
            <Text className={cn(
              "text-lg font-semibold mb-4",
              isDark ? "text-white" : "text-gray-900"
            )}>
              💰 Financial Overview
            </Text>
            <View className="flex-row justify-between">
              <View className="flex-1 items-center py-3 bg-green-500/10 rounded-l-xl">
                <Text className={cn(
                  "text-xs opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Income
                </Text>
                <Text className="text-lg font-bold text-green-500">
                  {currentCurrency.symbol}2,450
                </Text>
              </View>
              <View className="flex-1 items-center py-3 bg-red-500/10">
                <Text className={cn(
                  "text-xs opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Expenses
                </Text>
                <Text className="text-lg font-bold text-red-500">
                  {currentCurrency.symbol}1,890
                </Text>
              </View>
              <View className="flex-1 items-center py-3 bg-blue-500/10 rounded-r-xl">
                <Text className={cn(
                  "text-xs opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Balance
                </Text>
                <Text className="text-lg font-bold text-blue-500">
                  {currentCurrency.symbol}560
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
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Content based on selected tab */}
          {selectedTab === 'overview' && (
            <View>
              <Text className={cn(
                "text-lg font-semibold mb-4",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Recent Transactions
              </Text>
              
              {personalExpenses.length > 0 ? (
                <FlatList
                  data={personalExpenses.slice(0, 5)}
                  renderItem={({ item }) => <PersonalExpenseItem item={item} />}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <GlassCard>
                  <View className="items-center py-8">
                    <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
                    <Text className={cn(
                      "text-center mt-4 font-medium",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      No transactions yet
                    </Text>
                    <Text className={cn(
                      "text-center mt-2 text-sm opacity-70",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Add your first personal expense to get started
                    </Text>
                  </View>
                </GlassCard>
              )}
            </View>
          )}

          {selectedTab === 'budget' && (
            <GlassCard>
              <View className="items-center py-8">
                <Ionicons name="bar-chart-outline" size={48} color="#3B82F6" />
                <Text className={cn(
                  "text-center mt-4 font-medium",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Smart Budgeting
                </Text>
                <Text className={cn(
                  "text-center mt-2 text-sm opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  AI-powered budget insights coming soon
                </Text>
              </View>
            </GlassCard>
          )}

          {selectedTab === 'goals' && (
            <GlassCard>
              <View className="items-center py-8">
                <Ionicons name="trophy-outline" size={48} color="#F59E0B" />
                <Text className={cn(
                  "text-center mt-4 font-medium",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Financial Goals
                </Text>
                <Text className={cn(
                  "text-center mt-2 text-sm opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Goal tracking with progress visualization coming soon
                </Text>
              </View>
            </GlassCard>
          )}

          {selectedTab === 'insights' && (
            <GlassCard>
              <View className="items-center py-8">
                <Ionicons name="analytics-outline" size={48} color="#8B5CF6" />
                <Text className={cn(
                  "text-center mt-4 font-medium",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Spending Insights
                </Text>
                <Text className={cn(
                  "text-center mt-2 text-sm opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  AI-powered spending pattern analysis coming soon
                </Text>
              </View>
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}