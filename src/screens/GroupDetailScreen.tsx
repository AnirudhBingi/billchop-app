import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useExpenseStore } from '../state/useExpenseStore';
import { useUserStore } from '../state/useUserStore';
import { calculateGroupBalances, getUserName, GroupBalance } from '../utils/balanceCalculator';
import { Expense, Group, User } from '../types/index';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import GlassCard from '../components/GlassCard';
import Animated, { FadeInUp } from 'react-native-reanimated';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GroupDetailScreen = () => {
  const route = useRoute<GroupDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { groupId } = route.params;
  const { groups, expenses, deleteExpense } = useExpenseStore();
  const { users, currentUser, fetchUsers, settings } = useUserStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<GroupBalance | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'expenses' | 'members'>('overview');

  const isDark = settings.theme === 'dark';

  useEffect(() => {
    const foundGroup = groups.find(g => g.id === groupId);
    setGroup(foundGroup || null);

    if (foundGroup) {
      const exps = expenses.filter(exp => exp.groupId === groupId && !exp.isDraft);
      setGroupExpenses(exps);

      if (currentUser?.id) {
        const bal = calculateGroupBalances(foundGroup, exps, users, currentUser.id);
        setBalance(bal);
      }
    }
  }, [groupId, groups, expenses, users, currentUser]);

  useEffect(() => {
    const userIds = group?.members || [];
    fetchUsers(userIds);
  }, [group]);

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

  const renderExpenseCard = useCallback(({ item }: { item: Expense }) => {
    const payerName = getUserName(item.paidBy, users);
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
                Paid by {payerName} • {format(new Date(item.date), 'MMM dd, yyyy')}
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
  }, [users, navigation, currentUser, isDark]);

  const renderMemberCard = useCallback(({ item: memberId }: { item: string }) => {
    const member = users.find(u => u.id === memberId);
    const memberBalance = balance?.detailedBalances[memberId] || 0;
    
    return (
      <Animated.View entering={FadeInUp}>
        <GlassCard className="mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className={cn(
                "w-10 h-10 rounded-full items-center justify-center mr-3",
                isDark ? "bg-blue-600" : "bg-blue-500"
              )}>
                <Text className="text-white text-sm font-bold">
                  {member?.name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className={cn(
                  "font-semibold text-base",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {member?.name || 'Unknown'}
                </Text>
                <Text className={cn(
                  "text-sm opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {member?.email || 'No email'}
                </Text>
              </View>
            </View>
            
            <View className="items-end">
              <Text className={cn(
                "text-lg font-bold",
                memberBalance >= 0 ? "text-green-500" : "text-red-500"
              )}>
                ${Math.abs(memberBalance).toFixed(2)}
              </Text>
              <Text className={cn(
                "text-xs opacity-60",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {memberBalance >= 0 ? 'Owed' : 'Owes'}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }, [users, balance, isDark]);

  if (!group) {
    return (
      <View className={cn("flex-1 items-center justify-center", isDark ? "bg-gray-900" : "bg-gray-50")}>
        <Text className={cn("text-lg", isDark ? "text-white" : "text-gray-900")}>
          Group not found
        </Text>
      </View>
    );
  }

      return (
      <View className={cn("flex-1", isDark ? "bg-gray-900" : "bg-gray-50")}>
        {selectedTab === 'expenses' ? (
          <FlatList
            data={groupExpenses}
            renderItem={renderExpenseCard}
            keyExtractor={item => item.id}
            ListHeaderComponent={() => (
          <View className="px-4 py-6">
            {/* Header */}
            <Animated.View entering={FadeInUp} className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className={cn(
                  "w-12 h-12 rounded-full items-center justify-center mr-3",
                  isDark ? "bg-green-600" : "bg-green-500"
                )}>
                  <Ionicons name="home" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className={cn(
                    "text-xl font-bold",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {group.name}
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {group.members.length} members
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Tab Selector */}
            <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
              <View className="flex-row bg-gray-200/30 rounded-xl p-1">
                {(['overview', 'expenses', 'members'] as const).map(tab => (
                  <Pressable
                    key={tab}
                    className={cn(
                      "flex-1 py-2 rounded-lg items-center",
                      tab === selectedTab && "bg-blue-500"
                    )}
                    onPress={() => setSelectedTab(tab)}
                  >
                    <Text className={cn(
                      "font-medium text-xs",
                      tab === selectedTab ? "text-white" : isDark ? "text-white" : "text-gray-900"
                    )}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === 'expenses' && groupExpenses.length > 0 && (
                        <Text className="text-red-400"> ({groupExpenses.length})</Text>
                      )}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

                         {/* Overview Tab Content */}
             {selectedTab === 'overview' && balance && (
              <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
                <GlassCard>
                  <View className="py-4">
                    <Text className={cn(
                      "text-center text-sm opacity-70 mb-4",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Group Balance Summary
                    </Text>
                    
                    <View className="flex-row justify-between mb-4">
                      <View className="flex-1 items-center">
                        <Text className={cn(
                          "text-xs opacity-70 mb-1",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          You're Owed
                        </Text>
                        <Text className="text-lg font-bold text-green-500">
                          ${balance.totalOwed.toFixed(2)}
                        </Text>
                      </View>
                      
                      <View className="flex-1 items-center">
                        <Text className={cn(
                          "text-xs opacity-70 mb-1",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          You Owe
                        </Text>
                        <Text className="text-lg font-bold text-red-500">
                          ${balance.totalOwing.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Text className={cn(
                        "text-xs opacity-70 mb-1",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        Net Balance
                      </Text>
                      <Text className={cn(
                        "text-2xl font-bold",
                        balance.netBalance >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        ${Math.abs(balance.netBalance).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            )}

                         {/* Section Title for Expenses/Members */}
             {selectedTab !== 'overview' && (
               <Animated.View entering={FadeInUp.delay(200)} className="mb-4">
                 <Text className={cn(
                   "text-lg font-semibold",
                   isDark ? "text-white" : "text-gray-900"
                 )}>
                   {selectedTab === 'expenses' 
                     ? `Group Expenses (${groupExpenses.length})`
                     : `Group Members (${group.members.length})`
                   }
                 </Text>
               </Animated.View>
             )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="px-4 py-8">
            <Animated.View entering={FadeInUp.delay(300)}>
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons 
                    name={selectedTab === 'expenses' ? "receipt-outline" : "people-outline"} 
                    size={48} 
                    color="#9CA3AF" 
                  />
                  <Text className={cn(
                    "text-center mt-4 font-medium",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {selectedTab === 'expenses' 
                      ? 'No expenses yet'
                      : 'No members found'
                    }
                  </Text>
                  <Text className={cn(
                    "text-center mt-2 text-sm opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {selectedTab === 'expenses' 
                      ? 'Start adding expenses to see them here'
                      : 'Members will appear here'
                    }
                  </Text>
                </View>
              </GlassCard>
            </Animated.View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : selectedTab === 'members' ? (
          <FlatList
            data={group.members}
            renderItem={renderMemberCard}
            keyExtractor={item => item}
            ListHeaderComponent={() => (
              <View className="px-4 py-6">
                {/* Header */}
                <Animated.View entering={FadeInUp} className="mb-6">
                  <View className="flex-row items-center mb-4">
                    <View className={cn(
                      "w-12 h-12 rounded-full items-center justify-center mr-3",
                      isDark ? "bg-green-600" : "bg-green-500"
                    )}>
                      <Ionicons name="home" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className={cn(
                        "text-xl font-bold",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {group.name}
                      </Text>
                      <Text className={cn(
                        "text-sm opacity-70",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {group.members.length} members
                      </Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Tab Selector */}
                <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
                  <View className="flex-row bg-gray-200/30 rounded-xl p-1">
                    {(['overview', 'expenses', 'members'] as const).map(tab => (
                      <Pressable
                        key={tab}
                        className={cn(
                          "flex-1 py-2 rounded-lg items-center",
                          tab === selectedTab && "bg-blue-500"
                        )}
                        onPress={() => setSelectedTab(tab)}
                      >
                        <Text className={cn(
                          "font-medium text-xs",
                          tab === selectedTab ? "text-white" : isDark ? "text-white" : "text-gray-900"
                        )}>
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          {tab === 'expenses' && groupExpenses.length > 0 && (
                            <Text className="text-red-400"> ({groupExpenses.length})</Text>
                          )}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>

                {/* Section Title */}
                <Animated.View entering={FadeInUp.delay(200)} className="mb-4">
                  <Text className={cn(
                    "text-lg font-semibold",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Group Members ({group.members.length})
                  </Text>
                </Animated.View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View className="px-4 py-8">
                <Animated.View entering={FadeInUp.delay(300)}>
                  <GlassCard>
                    <View className="items-center py-8">
                      <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                      <Text className={cn(
                        "text-center mt-4 font-medium",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        No members found
                      </Text>
                      <Text className={cn(
                        "text-center mt-2 text-sm opacity-70",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        Members will appear here
                      </Text>
                    </View>
                  </GlassCard>
                </Animated.View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        ) : (
          <View className="px-4 py-6">
            {/* Header */}
            <Animated.View entering={FadeInUp} className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className={cn(
                  "w-12 h-12 rounded-full items-center justify-center mr-3",
                  isDark ? "bg-green-600" : "bg-green-500"
                )}>
                  <Ionicons name="home" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className={cn(
                    "text-xl font-bold",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {group.name}
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    {group.members.length} members
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Tab Selector */}
            <Animated.View entering={FadeInUp.delay(100)} className="mb-6">
              <View className="flex-row bg-gray-200/30 rounded-xl p-1">
                {(['overview', 'expenses', 'members'] as const).map(tab => (
                  <Pressable
                    key={tab}
                    className={cn(
                      "flex-1 py-2 rounded-lg items-center",
                      tab === selectedTab && "bg-blue-500"
                    )}
                    onPress={() => setSelectedTab(tab)}
                  >
                    <Text className={cn(
                      "font-medium text-xs",
                      tab === selectedTab ? "text-white" : isDark ? "text-white" : "text-gray-900"
                    )}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === 'expenses' && groupExpenses.length > 0 && (
                        <Text className="text-red-400"> ({groupExpenses.length})</Text>
                      )}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Overview Tab Content */}
            {balance && (
              <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
                <GlassCard>
                  <View className="py-4">
                    <Text className={cn(
                      "text-center text-sm opacity-70 mb-4",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Group Balance Summary
                    </Text>
                    
                    <View className="flex-row justify-between mb-4">
                      <View className="flex-1 items-center">
                        <Text className={cn(
                          "text-xs opacity-70 mb-1",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          You're Owed
                        </Text>
                        <Text className="text-lg font-bold text-green-500">
                          ${balance.totalOwed.toFixed(2)}
                        </Text>
                      </View>
                      
                      <View className="flex-1 items-center">
                        <Text className={cn(
                          "text-xs opacity-70 mb-1",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          You Owe
                        </Text>
                        <Text className="text-lg font-bold text-red-500">
                          ${balance.totalOwing.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Text className={cn(
                        "text-xs opacity-70 mb-1",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        Net Balance
                      </Text>
                      <Text className={cn(
                        "text-2xl font-bold",
                        balance.netBalance >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        ${Math.abs(balance.netBalance).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            )}
          </View>
        )}

      {/* Action Buttons */}
      <Animated.View 
        entering={FadeInUp.delay(400)}
        className="absolute bottom-6 left-4 right-4"
      >
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => navigation.navigate('SplitBill')}
            className="flex-1 py-3 px-4 bg-green-500 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="add-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold">Add Expense</Text>
          </Pressable>
          
          <Pressable
            onPress={() => navigation.navigate('SettleUp', { groupId })}
            disabled={balance?.netBalance === 0}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center",
              balance?.netBalance === 0 
                ? "bg-gray-300 dark:bg-gray-600" 
                : "bg-blue-500"
            )}
          >
            <Ionicons name="card-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold">Settle Up</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

export default GroupDetailScreen;