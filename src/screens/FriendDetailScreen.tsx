import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Pressable } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useExpenseStore } from '../state/useExpenseStore';
import { useUserStore } from '../state/useUserStore';
import { Expense, User } from '../types/index';
import { getUserName } from '../utils/balanceCalculator';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import GlassCard from '../components/GlassCard';
import Animated, { FadeInUp } from 'react-native-reanimated';

type FriendDetailRouteProp = RouteProp<RootStackParamList, 'FriendDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FriendDetailScreen = () => {
  const route = useRoute<FriendDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { friendId } = route.params;
  const { expenses, deleteExpense } = useExpenseStore();
  const { friends, currentUser, settings } = useUserStore();
  const [sharedExpenses, setSharedExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<number>(0);

  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const exps = expenses.filter(exp => !exp.groupId && exp.splitBetween.includes(friendId));
    setSharedExpenses(exps);
    
    // Calculate balance properly
    let friendBalance = 0;
    exps.forEach(exp => {
      const splitAmount = exp.amount / exp.splitBetween.length;
      if (exp.paidBy === currentUser?.id) {
        friendBalance += splitAmount; // Friend owes you
      } else if (exp.paidBy === friendId) {
        friendBalance -= splitAmount; // You owe friend
      }
    });
    setBalance(friendBalance);
  }, [friendId, expenses, currentUser]);

  const friendName = getUserName(friendId, friends);
  const friend = friends.find(f => f.id === friendId);

  const handleDeleteExpense = (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteExpense(expenseId);
            Alert.alert('Success', 'Expense deleted successfully');
          }
        }
      ]
    );
  };

  const handleEditExpense = (expense: Expense) => {
    // Navigate to expense edit screen or show edit modal
    Alert.alert('Edit Expense', 'Edit functionality will be implemented soon');
  };

  const renderExpenseCard = ({ item }: { item: Expense }) => {
    const isCurrentUserPayer = currentUser?.id === item.paidBy;
    const splitAmount = item.amount / item.splitBetween.length;
    
    return (
      <Animated.View entering={FadeInUp}>
        <GlassCard className="mb-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className={cn(
                  "font-semibold text-base",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {item.title}
                </Text>
                {isCurrentUserPayer && (
                  <View className="px-2 py-1 bg-green-500/20 rounded-full">
                    <Text className="text-xs font-medium text-green-500">YOU PAID</Text>
                  </View>
                )}
              </View>
              
              {item.description && (
                <Text className={cn(
                  "text-sm opacity-70 mt-1",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {item.description}
                </Text>
              )}
              
              <View className="flex-row items-center mt-2 mb-2">
                <Ionicons name="people-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                <Text className={cn(
                  "text-xs ml-1 opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Split {item.splitBetween.length} ways • ${splitAmount.toFixed(2)} each
                </Text>
              </View>
              
              <View className="flex-row items-center flex-wrap mt-1">
                <View className="px-2 py-1 bg-blue-500/20 rounded-full mr-2 mb-1">
                  <Text className="text-xs font-medium text-blue-500">
                    {item.category.toUpperCase()}
                  </Text>
                </View>
                
                {!isCurrentUserPayer && (
                  <View className="px-2 py-1 bg-orange-500/20 rounded-full mb-1">
                    <Text className="text-xs font-medium text-orange-500">
                      YOU OWE ${splitAmount.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text className={cn(
                "text-xs opacity-60 mt-2",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Paid by {isCurrentUserPayer ? 'You' : friendName} • {format(new Date(item.date), 'MMM dd, yyyy')}
              </Text>
            </View>
            
            <View className="items-end">
              <Text className={cn(
                "text-lg font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                ${item.amount.toFixed(2)}
              </Text>
              <Text className={cn(
                "text-xs opacity-60",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {item.currency}
              </Text>
              {isCurrentUserPayer && (
                <Text className="text-xs text-green-500 font-medium mt-1">
                  +${item.amount.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
          
          {/* Action Buttons */}
          <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Pressable
              onPress={() => handleEditExpense(item)}
              className="flex-row items-center px-3 py-1 mr-2"
            >
              <Ionicons name="create-outline" size={16} color="#3B82F6" />
              <Text className="text-blue-500 text-sm font-medium ml-1">Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => handleDeleteExpense(item.id)}
              className="flex-row items-center px-3 py-1"
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text className="text-red-500 text-sm font-medium ml-1">Delete</Text>
            </Pressable>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View className={cn("flex-1", isDark ? "bg-gray-900" : "bg-gray-50")}>
      <FlatList
        data={sharedExpenses}
        renderItem={renderExpenseCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={() => (
          <View className="px-4 py-6">
            {/* Header */}
            <Animated.View entering={FadeInUp} className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className={cn(
                  "w-12 h-12 rounded-full items-center justify-center mr-3",
                  isDark ? "bg-purple-600" : "bg-purple-500"
                )}>
                  <Text className="text-white text-lg font-bold">
                    {friend?.name.charAt(0).toUpperCase() || 'F'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className={cn(
                    "text-xl font-bold",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {friendName}
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {friend?.email || 'No email'}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Balance Card */}
            <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
              <GlassCard>
                <View className="items-center py-4">
                  <Text className={cn(
                    "text-sm opacity-70 mb-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Current Balance
                  </Text>
                  <Text className={cn(
                    "text-3xl font-bold mb-1",
                    balance >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    ${Math.abs(balance).toFixed(2)}
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    You {balance >= 0 ? 'are owed' : 'owe'} {friendName}
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>

            {/* Section Title */}
            <Animated.View entering={FadeInUp.delay(200)} className="mb-4">
              <Text className={cn(
                "text-lg font-semibold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Shared Expenses ({sharedExpenses.length})
              </Text>
            </Animated.View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="px-4 py-8">
            <Animated.View entering={FadeInUp.delay(300)}>
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                  <Text className={cn(
                    "text-center mt-4 font-medium",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No shared expenses yet
                  </Text>
                  <Text className={cn(
                    "text-center mt-2 text-sm opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Start splitting bills to see them here
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Action Buttons */}
      <Animated.View 
        entering={FadeInUp.delay(400)}
        className="absolute bottom-6 left-4 right-4"
      >
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => navigation.navigate('SettleUp', { friendId })}
            disabled={balance === 0}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center",
              balance === 0 
                ? "bg-gray-300 dark:bg-gray-600" 
                : "bg-blue-500"
            )}
          >
            <Ionicons name="card-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold">Settle Up</Text>
          </Pressable>
          
          <Pressable
            onPress={() => navigation.navigate('SplitBill')}
            className="flex-1 py-3 px-4 bg-green-500 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="add-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold">Add Expense</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

export default FriendDetailScreen; 