import React, { useState, useEffect } from 'react';
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
import { mockUsers, mockGroups, mockExpenses, mockChores, mockPersonalExpenses } from '../utils/mockData';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings, friends } = useUserStore();
  const { expenses, groups, addExpense, addGroup, getTotalOwed, getTotalOwing } = useExpenseStore();
  const [selectedTab, setSelectedTab] = useState<'balances' | 'groups'>('balances');
  
  const isDark = settings.theme === 'dark';
  
  const filteredExpenses = expenses.filter(e => !e.isDraft);
  const draftExpenses = expenses.filter(e => e.isDraft);
  
  // Initialize mock data if needed
  useEffect(() => {
    if (expenses.length === 0 && groups.length === 0) {
      console.log('Initializing mock data...');
      
      // Set current user if not set
      if (!currentUser) {
        useUserStore.getState().setCurrentUser(mockUsers[0]);
        
        // Add friends
        mockUsers.slice(1).forEach(user => {
          useUserStore.getState().addFriend(user);
        });
      }
      
      // Add groups first
      mockGroups.forEach(group => {
        addGroup(group);
      });
      
      // Add expenses
      mockExpenses.forEach(expense => {
        addExpense(expense);
      });
    }
  }, [expenses.length, groups.length, currentUser]);
  
  // Debug: Log the data to see what's available
  console.log('Total expenses:', expenses.length);
  console.log('Filtered expenses:', filteredExpenses.length);
  console.log('Groups:', groups.length);
  console.log('Friends:', friends.length);

  const ExpenseItem = ({ expense }: { expense: Expense }) => {
    const paidByUser = friends.find(f => f.id === expense.paidBy) || 
                      (currentUser && currentUser.id === expense.paidBy ? currentUser : null) ||
                      { id: expense.paidBy, name: 'Unknown User', email: '', createdAt: new Date() };
    const group = expense.groupId ? groups.find(g => g.id === expense.groupId) : null;
    
    // Calculate split info
    const splitCount = expense.splitBetween.length;
    const perPersonAmount = expense.amount / splitCount;
    const isCurrentUserPayer = currentUser?.id === expense.paidBy;
    const isCurrentUserInSplit = currentUser ? expense.splitBetween.includes(currentUser.id) : false;
    
    return (
      <GlassCard className="mb-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className={cn(
                "font-semibold text-base",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {expense.title}
              </Text>
              {isCurrentUserPayer && (
                <View className="px-2 py-1 bg-green-500/20 rounded-full">
                  <Text className="text-xs font-medium text-green-500">YOU PAID</Text>
                </View>
              )}
            </View>
            
            {expense.description && (
              <Text className={cn(
                "text-sm opacity-70 mt-1",
                isDark ? "text-white" : "text-gray-900"
              )}>
                {expense.description}
              </Text>
            )}
            
            {/* Split Information */}
            <View className="flex-row items-center mt-2 mb-2">
              <Ionicons name="people-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <Text className={cn(
                "text-xs ml-1 opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Split {splitCount} ways • ${perPersonAmount.toFixed(2)} each
              </Text>
            </View>
            
            <View className="flex-row items-center flex-wrap mt-1">
              <View className={cn(
                "px-2 py-1 rounded-full mr-2 mb-1",
                getCategoryColor(expense.category)
              )}>
                <Text className="text-xs font-medium text-white">
                  {expense.category.toUpperCase()}
                </Text>
              </View>
              
              {group && (
                <View className="px-2 py-1 bg-blue-500/20 rounded-full mr-2 mb-1">
                  <Text className="text-xs font-medium text-blue-500">
                    📍 {group.name}
                  </Text>
                </View>
              )}
              
              {!isCurrentUserPayer && isCurrentUserInSplit && (
                <View className="px-2 py-1 bg-orange-500/20 rounded-full mb-1">
                  <Text className="text-xs font-medium text-orange-500">
                    YOU OWE ${perPersonAmount.toFixed(2)}
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
            {isCurrentUserPayer && !isCurrentUserInSplit && (
              <Text className="text-xs text-green-500 font-medium mt-1">
                +${expense.amount.toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </GlassCard>
    );
  };

  const GroupItem = ({ group }: { group: Group }) => {
    const groupExpenses = expenses.filter(e => e.groupId === group.id && !e.isDraft);
    const totalAmount = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate user's share and balance for this group
    const userExpenses = groupExpenses.filter(e => e.paidBy === currentUser?.id);
    const userPaidTotal = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const userOwedExpenses = groupExpenses.filter(e => 
      currentUser && e.splitBetween.includes(currentUser.id)
    );
    const userOwesTotal = userOwedExpenses.reduce((sum, expense) => 
      sum + (expense.amount / expense.splitBetween.length), 0
    );
    
    const netBalance = userPaidTotal - userOwesTotal;
    
    return (
      <Pressable onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}>
        <GlassCard className="mb-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Ionicons name="home-outline" size={16} color="#3B82F6" />
                <Text className={cn(
                  "font-semibold text-base ml-2",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {group.name}
                </Text>
              </View>
              
              {group.description && (
                <Text className={cn(
                  "text-sm opacity-70 mt-1",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {group.description}
                </Text>
              )}
              
              <View className="flex-row items-center mt-2">
                <Ionicons name="people-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                <Text className={cn(
                  "text-xs opacity-60 ml-1",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  {group.members.length} roommates • {groupExpenses.length} bills split
                </Text>
              </View>
              
              {/* Balance indicator */}
              {netBalance !== 0 && (
                <View className={cn(
                  "px-2 py-1 rounded-full mt-2 self-start",
                  netBalance > 0 ? "bg-green-500/20" : "bg-red-500/20"
                )}>
                  <Text className={cn(
                    "text-xs font-medium",
                    netBalance > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {netBalance > 0 ? `You're owed ${netBalance.toFixed(2)}` : `You owe ${Math.abs(netBalance).toFixed(2)}`}
                  </Text>
                </View>
              )}
            </View>
            
            <View className="items-end">
              <Text className={cn(
                "text-lg font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                ${totalAmount.toFixed(2)}
              </Text>
              <Text className={cn(
                "text-xs opacity-60",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Total spent
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={isDark ? "#9CA3AF" : "#6B7280"}
                style={{ marginTop: 4 }}
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
          <View className="flex-1">
            <Text className={cn(
              "text-2xl font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Split Bills
            </Text>
            <Text className={cn(
              "text-sm opacity-70",
              isDark ? "text-white" : "text-gray-900"
            )}>
              AI-powered expense splitting & management
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => navigation.navigate('ExpenseHistory')}
              className={cn(
                "px-3 py-2 rounded-lg items-center justify-center",
                isDark ? "bg-purple-600" : "bg-purple-500"
              )}
            >
              <Ionicons name="time-outline" size={18} color="white" />
            </Pressable>
            
            <AnimatedButton
              title="Split"
              size="sm"
              icon={<Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />}
              onPress={() => navigation.navigate('SplitBill')}
            />
          </View>
        </View>

        {/* Revolutionary Features Banner */}
        <View style={{ 
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              flex: 1,
              color: isDark ? '#FFFFFF' : '#111827'
            }}>
              🚀 Revolutionary Features
            </Text>
            <Text style={{
              fontSize: 12,
              opacity: 0.6,
              color: isDark ? '#FFFFFF' : '#111827'
            }}>
              Try our AI-powered tools
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => navigation.navigate('SplitBill')}
              style={{
                flex: 1,
                backgroundColor: '#EF4444',
                padding: 12,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Ionicons name="camera" size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '500', fontSize: 11, marginTop: 4 }}>
                📸 Smart Split
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => navigation.navigate('Analytics')}
              style={{
                flex: 1,
                backgroundColor: '#8B5CF6',
                padding: 12,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Ionicons name="analytics" size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '500', fontSize: 11, marginTop: 4 }}>
                🧠 AI Analytics
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => navigation.navigate('ExpenseHistory')}
              style={{
                flex: 1,
                backgroundColor: '#6366F1',
                padding: 12,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Ionicons name="library" size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '500', fontSize: 11, marginTop: 4 }}>
                📜 Smart History
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-gray-200/30 rounded-xl p-1">
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'balances' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('balances')}
          >
            <Text className={cn(
              "font-medium",
              selectedTab === 'balances' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              Balances
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

      {/* Overall Balance Summary */}
      <View className="px-4 mb-4">
        <GlassCard>
          <View className="mb-4">
            <Text className={cn(
              "text-base font-medium",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Overall Balance
            </Text>
            <View className="flex-row items-baseline mt-2">
              <Text className={cn(
                "text-sm",
                isDark ? "text-white" : "text-gray-900"
              )}>
                You {getTotalOwing(currentUser?.id || '') > getTotalOwed(currentUser?.id || '') ? 'owe' : 'are owed'} 
              </Text>
              <Text className={cn(
                "text-2xl font-bold ml-2",
                getTotalOwing(currentUser?.id || '') > getTotalOwed(currentUser?.id || '') ? "text-red-500" : "text-green-500"
              )}>
                ${Math.abs(getTotalOwed(currentUser?.id || '') - getTotalOwing(currentUser?.id || '')).toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View className="flex-row">
            <View className="flex-1 items-center py-3 bg-green-500/10 rounded-l-xl">
              <Text className={cn(
                "text-xs opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                You are owed
              </Text>
              <Text className="text-lg font-bold text-green-500">
                ${getTotalOwed(currentUser?.id || '').toFixed(2)}
              </Text>
            </View>
            <View className="flex-1 items-center py-3 bg-red-500/10 rounded-r-xl">
              <Text className={cn(
                "text-xs opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                You owe
              </Text>
              <Text className="text-lg font-bold text-red-500">
                ${getTotalOwing(currentUser?.id || '').toFixed(2)}
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Draft Expenses */}
        {draftExpenses.length > 0 && selectedTab === 'balances' && (
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
        {selectedTab === 'balances' ? (
          <>
            {/* Group Balances - Splitwise Style */}
            {groups.map((group) => {
              const groupExpenses = expenses.filter(e => e.groupId === group.id && !e.isDraft);
              if (groupExpenses.length === 0) return null;
              
              // Calculate who owes what in this group
              const balances = new Map<string, number>();
              
              groupExpenses.forEach(expense => {
                const splitAmount = expense.amount / expense.splitBetween.length;
                
                // Payer gets positive balance
                balances.set(expense.paidBy, (balances.get(expense.paidBy) || 0) + expense.amount);
                
                // Splitters get negative balance
                expense.splitBetween.forEach(splitterId => {
                  balances.set(splitterId, (balances.get(splitterId) || 0) - splitAmount);
                });
              });
              
              // Find balances involving current user
              const currentUserBalance = currentUser ? balances.get(currentUser.id) || 0 : 0;
              const otherBalances = Array.from(balances.entries()).filter(([userId]) => userId !== currentUser?.id);
              
              return (
                <GlassCard key={group.id} className="mb-4">
                  <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-blue-500 rounded-xl items-center justify-center mr-3">
                      <Ionicons name="home" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className={cn(
                        "font-bold text-lg",
                        isDark ? "text-white" : "text-gray-900"
                      )}>
                        {group.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Text className={cn(
                          "text-sm opacity-70 mr-4",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          You {currentUserBalance >= 0 ? 'are owed' : 'owe'}
                        </Text>
                        <Text className={cn(
                          "font-bold text-lg",
                          currentUserBalance >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          ${Math.abs(currentUserBalance).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {otherBalances.map(([userId, balance]) => {
                    const user = friends.find(f => f.id === userId) || { id: userId, name: 'Unknown', email: '', createdAt: new Date() };
                    const relationship = currentUserBalance >= 0 && balance < 0 ? 'owes you' : 
                                       currentUserBalance < 0 && balance > 0 ? 'you owe' : 'settled';
                    const amount = Math.abs(Math.min(Math.abs(currentUserBalance), Math.abs(balance)));
                    
                    if (relationship === 'settled' || amount === 0) return null;
                    
                    return (
                      <View key={userId} className="flex-row items-center justify-between py-3 border-t border-gray-200/20">
                        <View className="flex-row items-center flex-1">
                          <View className="w-10 h-10 bg-gray-400 rounded-full items-center justify-center mr-3">
                            <Text className="text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text className={cn(
                              "font-medium",
                              isDark ? "text-white" : "text-gray-900"
                            )}>
                              {user.name}
                            </Text>
                            <Text className={cn(
                              "text-sm",
                              relationship === 'owes you' ? "text-green-600" : "text-red-600"
                            )}>
                              {relationship}
                            </Text>
                          </View>
                        </View>
                        
                        <Text className={cn(
                          "font-semibold text-lg",
                          relationship === 'owes you' ? "text-green-500" : "text-red-500"
                        )}>
                          ${amount.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                </GlassCard>
              );
            })}
            
            {groups.length === 0 && (
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
                    No balances yet
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70 text-center mt-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Start splitting bills to see your balances here
                  </Text>
                  <View className="flex-row space-x-2 mt-4">
                    <AnimatedButton
                      title="Add Sample Data"
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        console.log('Adding sample data...');
                        mockGroups.forEach(group => {
                          console.log('Adding group:', group.name);
                          addGroup(group);
                        });
                        mockExpenses.forEach(expense => {
                          console.log('Adding expense:', expense.title);
                          addExpense(expense);
                        });
                        console.log('Sample data added!');
                      }}
                    />
                    <AnimatedButton
                      title="Split a Bill"
                      size="sm"
                      onPress={() => navigation.navigate('AddSharedExpense', {})}
                    />
                  </View>
                </View>
              </GlassCard>
            )}
          </>
        ) : (
          <View>
            <Text className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}>
              My Roommate Groups
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