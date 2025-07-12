import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { Expense, ExpenseCategory } from '../types';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

interface FilterOptions {
  category?: ExpenseCategory;
  dateRange?: 'week' | 'month' | 'quarter' | 'year';
  amountRange?: 'low' | 'medium' | 'high';
  people?: string[];
  searchText?: string;
}

export default function ExpenseHistoryScreen() {
  const navigation = useNavigation();
  const { currentUser, settings, friends } = useUserStore();
  const { expenses, balances } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);

  // Smart filtering logic
  const filteredExpenses = useMemo(() => {
    let filtered = expenses.filter(expense => 
      expense.splitBetween.includes(currentUser?.id || '')
    );

    // Search text filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.title.toLowerCase().includes(search) ||
        expense.description.toLowerCase().includes(search) ||
        expense.category.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(expense => expense.category === filters.category);
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date();
      const cutoff = new Date();
      
      switch (filters.dateRange) {
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoff.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(expense => new Date(expense.date) >= cutoff);
    }

    // Amount range filter
    if (filters.amountRange) {
      const userShare = (expense: Expense) => expense.amount / expense.splitBetween.length;
      
      switch (filters.amountRange) {
        case 'low':
          filtered = filtered.filter(expense => userShare(expense) < 25);
          break;
        case 'medium':
          filtered = filtered.filter(expense => userShare(expense) >= 25 && userShare(expense) < 100);
          break;
        case 'high':
          filtered = filtered.filter(expense => userShare(expense) >= 100);
          break;
      }
    }

    // People filter
    if (filters.people && filters.people.length > 0) {
      filtered = filtered.filter(expense => 
        filters.people!.some(personId => expense.splitBetween.includes(personId))
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = (a.amount / a.splitBetween.length) - (b.amount / b.splitBetween.length);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, currentUser, searchText, filters, sortBy, sortOrder]);

  // Smart insights about the filtered data
  const getSmartInsights = () => {
    if (filteredExpenses.length === 0) return null;

    const totalSpent = filteredExpenses.reduce((sum, exp) => 
      sum + (exp.amount / exp.splitBetween.length), 0
    );
    
    const avgExpense = totalSpent / filteredExpenses.length;
    const mostExpensiveCategory = filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + (exp.amount / exp.splitBetween.length);
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(mostExpensiveCategory)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalSpent,
      avgExpense,
      topCategory: topCategory ? topCategory[0] : null,
      topCategoryAmount: topCategory ? topCategory[1] : 0,
      expenseCount: filteredExpenses.length
    };
  };

  const insights = getSmartInsights();

  const getCategoryIcon = (category: ExpenseCategory) => {
    const icons: Record<ExpenseCategory, string> = {
      food: '🍽️',
      groceries: '🛒',
      transportation: '🚗',
      entertainment: '🎬',
      shopping: '🛍️',
      utilities: '💡',
      healthcare: '🏥',
      education: '📚',
      rent: '🏠',
      other: '📋'
    };
    return icons[category] || '📋';
  };

  const getPeopleName = (userId: string) => {
    if (userId === currentUser?.id) return 'You';
    const friend = friends.find(f => f.id === userId);
    return friend?.name || 'Unknown';
  };

  const toggleFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchText('');
  };

  const sendReminder = (expense: Expense) => {
    const owedAmount = expense.amount / expense.splitBetween.length;
    const payer = expense.paidBy === currentUser?.id ? 'You' : getPeopleName(expense.paidBy);
    
    Alert.alert(
      'Send Reminder',
      `Send a friendly reminder about "${expense.title}" ($${owedAmount.toFixed(2)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Reminder', 
          onPress: () => {
            Alert.alert('Reminder Sent!', 'Your friends have been notified about this expense');
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <Animated.View 
          entering={FadeInUp}
          style={{ marginBottom: 24 }}
        >
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            📜 Expense History
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Smart filtering and insights for your expenses
          </Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View 
          entering={FadeInUp.delay(100)}
          style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search expenses..."
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                fontSize: 16,
                color: isDark ? '#FFFFFF' : '#111827'
              }}
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Smart Insights */}
        {insights && (
          <Animated.View 
            entering={FadeInUp.delay(200)}
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
              🧠 Smart Insights
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ 
                backgroundColor: '#EBF5FF', 
                padding: 12, 
                borderRadius: 12, 
                minWidth: '45%',
                borderLeftWidth: 4,
                borderLeftColor: '#3B82F6'
              }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Total Spent</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3B82F6' }}>
                  ${insights.totalSpent.toFixed(2)}
                </Text>
              </View>
              
              <View style={{ 
                backgroundColor: '#F0FDF4', 
                padding: 12, 
                borderRadius: 12, 
                minWidth: '45%',
                borderLeftWidth: 4,
                borderLeftColor: '#10B981'
              }}>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>Avg per Expense</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10B981' }}>
                  ${insights.avgExpense.toFixed(2)}
                </Text>
              </View>
              
              {insights.topCategory && (
                <View style={{ 
                  backgroundColor: '#FEF3C7', 
                  padding: 12, 
                  borderRadius: 12, 
                  minWidth: '90%',
                  borderLeftWidth: 4,
                  borderLeftColor: '#F59E0B'
                }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Top Category</Text>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#F59E0B' }}>
                    {getCategoryIcon(insights.topCategory as ExpenseCategory)} {insights.topCategory} - ${insights.topCategoryAmount.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Quick Filters */}
        <Animated.View 
          entering={FadeInUp.delay(300)}
          style={{ marginBottom: 20 }}
        >
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 12
          }}>
            🎯 Quick Filters
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
              {/* Date Range Filters */}
              {(['week', 'month', 'quarter'] as const).map(range => (
                <Pressable
                  key={range}
                  onPress={() => toggleFilter('dateRange', range)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: filters.dateRange === range ? '#3B82F6' : (isDark ? '#374151' : '#F3F4F6'),
                    borderWidth: 1,
                    borderColor: filters.dateRange === range ? '#3B82F6' : '#E5E7EB'
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: filters.dateRange === range ? 'white' : (isDark ? '#D1D5DB' : '#374151')
                  }}>
                    {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Quarter'}
                  </Text>
                </Pressable>
              ))}
              
              {/* Amount Range Filters */}
              {(['low', 'medium', 'high'] as const).map(amount => (
                <Pressable
                  key={amount}
                  onPress={() => toggleFilter('amountRange', amount)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: filters.amountRange === amount ? '#10B981' : (isDark ? '#374151' : '#F3F4F6'),
                    borderWidth: 1,
                    borderColor: filters.amountRange === amount ? '#10B981' : '#E5E7EB'
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: filters.amountRange === amount ? 'white' : (isDark ? '#D1D5DB' : '#374151')
                  }}>
                    {amount === 'low' ? '<$25' : amount === 'medium' ? '$25-$100' : '>$100'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          
          {/* Clear Filters */}
          {(Object.keys(filters).length > 0 || searchText.length > 0) && (
            <Pressable
              onPress={clearFilters}
              style={{
                alignSelf: 'flex-start',
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                backgroundColor: '#EF4444'
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                Clear All Filters
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Sort Options */}
        <Animated.View 
          entering={FadeInUp.delay(400)}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: 20,
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 12,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}
        >
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: isDark ? '#D1D5DB' : '#374151',
            marginRight: 12
          }}>
            Sort by:
          </Text>
          
          {(['date', 'amount', 'category'] as const).map(sort => (
            <Pressable
              key={sort}
              onPress={() => {
                if (sortBy === sort) {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortBy(sort);
                  setSortOrder('desc');
                }
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: sortBy === sort ? '#3B82F6' : 'transparent',
                marginRight: 8
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: sortBy === sort ? 'white' : (isDark ? '#D1D5DB' : '#374151')
              }}>
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
              {sortBy === sort && (
                <Ionicons 
                  name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="white" 
                  style={{ marginLeft: 4 }}
                />
              )}
            </Pressable>
          ))}
        </Animated.View>

        {/* Expense List */}
        <Animated.View entering={FadeInUp.delay(500)}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 12
          }}>
            📋 Expenses ({filteredExpenses.length})
          </Text>
          
          {filteredExpenses.length === 0 ? (
            <View style={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#9CA3AF',
                marginTop: 12,
                textAlign: 'center'
              }}>
                No expenses found
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                marginTop: 4,
                textAlign: 'center'
              }}>
                Try adjusting your filters or search terms
              </Text>
            </View>
          ) : (
            filteredExpenses.map((expense, index) => {
              const userShare = expense.amount / expense.splitBetween.length;
              const isExpanded = selectedExpense === expense.id;
              const paidByCurrentUser = expense.paidBy === currentUser?.id;
              
              return (
                <Animated.View
                  key={expense.id}
                  entering={FadeInUp.delay(500 + index * 50)}
                  style={{
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    borderWidth: expense.title.includes('📸') ? 2 : 0,
                    borderColor: expense.title.includes('📸') ? '#8B5CF6' : 'transparent'
                  }}
                >
                  <Pressable
                    onPress={() => setSelectedExpense(isExpanded ? null : expense.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 20, marginRight: 12 }}>
                        {getCategoryIcon(expense.category)}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: '600',
                          color: isDark ? '#FFFFFF' : '#111827'
                        }}>
                          {expense.title}
                        </Text>
                        <Text style={{ 
                          fontSize: 12, 
                          color: isDark ? '#9CA3AF' : '#6B7280'
                        }}>
                          {new Date(expense.date).toLocaleDateString()} • {expense.category}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ 
                          fontSize: 18, 
                          fontWeight: 'bold',
                          color: paidByCurrentUser ? '#10B981' : '#3B82F6'
                        }}>
                          ${userShare.toFixed(2)}
                        </Text>
                        <Text style={{ 
                          fontSize: 10, 
                          color: isDark ? '#9CA3AF' : '#6B7280'
                        }}>
                          {paidByCurrentUser ? 'You paid' : 'Your share'}
                        </Text>
                      </View>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color="#9CA3AF" 
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  </Pressable>
                  
                  {isExpanded && (
                    <Animated.View entering={FadeInDown}>
                      <View style={{ 
                        borderTopWidth: 1, 
                        borderTopColor: '#E5E7EB', 
                        paddingTop: 12,
                        marginTop: 8 
                      }}>
                        {expense.description && (
                          <Text style={{ 
                            fontSize: 14, 
                            color: isDark ? '#D1D5DB' : '#374151',
                            marginBottom: 8
                          }}>
                            {expense.description}
                          </Text>
                        )}
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>Total Amount:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>
                            ${expense.amount.toFixed(2)}
                          </Text>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>Paid by:</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>
                            {getPeopleName(expense.paidBy)}
                          </Text>
                        </View>
                        
                        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                          Split between ({expense.splitBetween.length}):
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          {expense.splitBetween.map(personId => (
                            <View 
                              key={personId}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 12,
                                backgroundColor: personId === currentUser?.id ? '#3B82F6' : '#E5E7EB'
                              }}
                            >
                              <Text style={{
                                fontSize: 10,
                                fontWeight: '500',
                                color: personId === currentUser?.id ? 'white' : '#374151'
                              }}>
                                {getPeopleName(personId)}
                              </Text>
                            </View>
                          ))}
                        </View>
                        
                        {!paidByCurrentUser && (
                          <Pressable
                            onPress={() => sendReminder(expense)}
                            style={{
                              backgroundColor: '#F59E0B',
                              padding: 10,
                              borderRadius: 8,
                              alignItems: 'center'
                            }}
                          >
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                              💬 Send Reminder
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })
          )}
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}