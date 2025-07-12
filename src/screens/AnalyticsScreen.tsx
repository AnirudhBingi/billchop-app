import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { ExpenseCategory } from '../types';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  FadeInUp,
  FadeInDown
} from 'react-native-reanimated';
import { SimpleLineChart, SimplePieChart, SimpleBarChart } from '../components/SimpleCharts';

const { width: screenWidth } = Dimensions.get('window');

interface SpendingInsight {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success' | 'tip';
  icon: string;
  amount?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface CategorySpending {
  name: string;
  amount: number;
  color: string;
}

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { currentUser, settings, friends } = useUserStore();
  const { expenses, balances } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'insights' | 'predictions'>('overview');

  // Animation values
  const scaleValue = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  // Calculate date ranges
  const getDateRange = (period: 'week' | 'month' | 'quarter') => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
    }
    
    return { start, end: now };
  };

  // Filter expenses by period
  const getFilteredExpenses = () => {
    const { start, end } = getDateRange(selectedPeriod);
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  };

  // Calculate category spending
  const getCategorySpending = (): CategorySpending[] => {
    const filteredExpenses = getFilteredExpenses();
    const categoryTotals: Record<ExpenseCategory, number> = {
      food: 0, transportation: 0, utilities: 0, entertainment: 0,
      shopping: 0, healthcare: 0, education: 0, rent: 0, groceries: 0, other: 0
    };

    filteredExpenses.forEach(expense => {
      if (expense.splitBetween.includes(currentUser?.id || '')) {
        const userShare = expense.amount / expense.splitBetween.length;
        categoryTotals[expense.category] += userShare;
      }
    });

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
    ];

    return Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount], index) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        amount: Math.round(amount),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Get spending timeline data
  const getSpendingTimeline = () => {
    const filteredExpenses = getFilteredExpenses();
    const { start } = getDateRange(selectedPeriod);
    
    // Group by days/weeks based on period
    const timePoints = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;
    const intervals = selectedPeriod === 'week' ? 1 : selectedPeriod === 'month' ? 1 : 3; // days per interval
    
    const timeline: number[] = new Array(Math.ceil(timePoints / intervals)).fill(0);
    const labels: string[] = [];
    
    filteredExpenses.forEach(expense => {
      if (expense.splitBetween.includes(currentUser?.id || '')) {
        const expenseDate = new Date(expense.date);
        const daysSinceStart = Math.floor((expenseDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const timeIndex = Math.floor(daysSinceStart / intervals);
        
        if (timeIndex >= 0 && timeIndex < timeline.length) {
          const userShare = expense.amount / expense.splitBetween.length;
          timeline[timeIndex] += userShare;
        }
      }
    });

    // Generate labels
    for (let i = 0; i < timeline.length; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i * intervals);
      
      if (selectedPeriod === 'week') {
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      } else if (selectedPeriod === 'month') {
        labels.push(date.getDate().toString());
      } else {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
    }

    return { data: timeline.map(amount => Math.round(amount)), labels };
  };

  // Generate AI-powered insights
  const generateInsights = (): SpendingInsight[] => {
    const filteredExpenses = getFilteredExpenses();
    const totalSpent = filteredExpenses.reduce((sum, exp) => {
      if (exp.splitBetween.includes(currentUser?.id || '')) {
        return sum + (exp.amount / exp.splitBetween.length);
      }
      return sum;
    }, 0);

    const categorySpending = getCategorySpending();
    const insights: SpendingInsight[] = [];

    // High spending category
    if (categorySpending.length > 0) {
      const topCategory = categorySpending[0];
      if (topCategory.amount > totalSpent * 0.4) {
        insights.push({
          id: 'high_category',
          title: `High ${topCategory.name} Spending`,
          description: `${topCategory.name} represents ${Math.round((topCategory.amount / totalSpent) * 100)}% of your spending this ${selectedPeriod}`,
          type: 'warning',
          icon: '⚠️',
          amount: topCategory.amount,
          trend: 'up'
        });
      }
    }

    // Compare to previous period
    const previousPeriodStart = new Date(getDateRange(selectedPeriod).start);
    if (selectedPeriod === 'week') {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    } else {
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 3);
    }

    const previousExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= previousPeriodStart && expDate < getDateRange(selectedPeriod).start;
    });

    const previousTotal = previousExpenses.reduce((sum, exp) => {
      if (exp.splitBetween.includes(currentUser?.id || '')) {
        return sum + (exp.amount / exp.splitBetween.length);
      }
      return sum;
    }, 0);

    if (previousTotal > 0) {
      const change = ((totalSpent - previousTotal) / previousTotal) * 100;
      if (Math.abs(change) > 10) {
        insights.push({
          id: 'period_change',
          title: change > 0 ? 'Spending Increased' : 'Spending Decreased',
          description: `You spent ${Math.abs(change).toFixed(1)}% ${change > 0 ? 'more' : 'less'} compared to the previous ${selectedPeriod}`,
          type: change > 0 ? 'warning' : 'success',
          icon: change > 0 ? '📈' : '📉',
          amount: Math.abs(totalSpent - previousTotal),
          trend: change > 0 ? 'up' : 'down'
        });
      }
    }

    // Receipt scanning tip
    const receiptExpenses = filteredExpenses.filter(exp => exp.title.includes('📸'));
    if (receiptExpenses.length === 0) {
      insights.push({
        id: 'receipt_tip',
        title: 'Try Receipt Scanning',
        description: 'Use our AI-powered receipt scanner to automatically split detailed purchases and track items better',
        type: 'tip',
        icon: '📸'
      });
    }

    // Balance insights
    const userBalance = balances[currentUser?.id || ''] || 0;
    if (userBalance < -50) {
      insights.push({
        id: 'negative_balance',
        title: 'Outstanding Debts',
        description: `You owe $${Math.abs(userBalance).toFixed(2)} to friends. Consider settling up soon`,
        type: 'warning',
        icon: '💳',
        amount: Math.abs(userBalance)
      });
    } else if (userBalance > 50) {
      insights.push({
        id: 'positive_balance',
        title: 'Money Owed to You',
        description: `Friends owe you $${userBalance.toFixed(2)}. You can send reminders from the Split tab`,
        type: 'info',
        icon: '💰',
        amount: userBalance
      });
    }

    return insights;
  };

  // Generate predictions
  const generatePredictions = () => {
    const currentSpending = getFilteredExpenses().reduce((sum, exp) => {
      if (exp.splitBetween.includes(currentUser?.id || '')) {
        return sum + (exp.amount / exp.splitBetween.length);
      }
      return sum;
    }, 0);

    const daysInPeriod = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;
    const dailyAverage = currentSpending / daysInPeriod;
    
    const predictions = [
      {
        period: 'Next Week',
        amount: dailyAverage * 7,
        confidence: 85
      },
      {
        period: 'Next Month',
        amount: dailyAverage * 30,
        confidence: 70
      },
      {
        period: 'Rest of Year',
        amount: dailyAverage * 365,
        confidence: 60
      }
    ];

    return predictions;
  };

  const categoryData = getCategorySpending();
  const timelineData = getSpendingTimeline();
  const insights = generateInsights();
  const predictions = generatePredictions();

  const totalSpent = getFilteredExpenses().reduce((sum, exp) => {
    if (exp.splitBetween.includes(currentUser?.id || '')) {
      return sum + (exp.amount / exp.splitBetween.length);
    }
    return sum;
  }, 0);

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
            🧠 Smart Analytics
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            AI-powered insights into your spending patterns
          </Text>
        </Animated.View>

        {/* Period Selection */}
        <Animated.View 
          entering={FadeInUp.delay(100)}
          style={{ 
            flexDirection: 'row', 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}
        >
          {(['week', 'month', 'quarter'] as const).map(period => (
            <Pressable
              key={period}
              onPress={() => setSelectedPeriod(period)}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: selectedPeriod === period ? '#3B82F6' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontWeight: '600',
                color: selectedPeriod === period ? 'white' : (isDark ? '#9CA3AF' : '#6B7280')
              }}>
                {period === 'week' ? 'Last 7 Days' : period === 'month' ? 'Last Month' : 'Last Quarter'}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Tab Selection */}
        <Animated.View 
          entering={FadeInUp.delay(200)}
          style={{ 
            flexDirection: 'row', 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}
        >
          {(['overview', 'insights', 'predictions'] as const).map(tab => (
            <Pressable
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: selectedTab === tab ? '#3B82F6' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontWeight: '600',
                color: selectedTab === tab ? 'white' : (isDark ? '#9CA3AF' : '#6B7280')
              }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
            {/* Total Spending Card */}
            <Animated.View 
              entering={FadeInUp.delay(300)}
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
                marginBottom: 8
              }}>
                💰 Total Spending
              </Text>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: 'bold', 
                color: '#3B82F6',
                marginBottom: 8
              }}>
                ${totalSpent.toFixed(2)}
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: isDark ? '#9CA3AF' : '#6B7280'
              }}>
                Your share for the selected {selectedPeriod}
              </Text>
            </Animated.View>

            {/* Spending Timeline */}
            {timelineData.data.length > 0 && (
              <Animated.View 
                entering={FadeInUp.delay(400)}
              >
                <SimpleLineChart
                  data={{
                    labels: timelineData.labels,
                    data: timelineData.data
                  }}
                  width={screenWidth - 40}
                  height={220}
                  isDark={isDark}
                />
              </Animated.View>
            )}

            {/* Category Breakdown */}
            {categoryData.length > 0 && (
              <Animated.View 
                entering={FadeInUp.delay(500)}
              >
                <SimplePieChart
                  data={categoryData}
                  width={screenWidth - 40}
                  height={240}
                  isDark={isDark}
                />
              </Animated.View>
            )}
          </>
        )}

        {/* Insights Tab */}
        {selectedTab === 'insights' && (
          <Animated.View entering={FadeInUp.delay(300)}>
            {insights.map((insight, index) => (
              <Animated.View 
                key={insight.id}
                entering={FadeInUp.delay(300 + index * 100)}
                style={{ 
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                  borderLeftWidth: 4,
                  borderLeftColor: 
                    insight.type === 'warning' ? '#EF4444' :
                    insight.type === 'success' ? '#10B981' :
                    insight.type === 'info' ? '#3B82F6' : '#F59E0B'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>
                    {insight.icon}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '600', 
                      color: isDark ? '#FFFFFF' : '#111827',
                      marginBottom: 4
                    }}>
                      {insight.title}
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: isDark ? '#9CA3AF' : '#6B7280',
                      lineHeight: 20
                    }}>
                      {insight.description}
                    </Text>
                    {insight.amount && (
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: 'bold', 
                        color: 
                          insight.type === 'warning' ? '#EF4444' :
                          insight.type === 'success' ? '#10B981' : '#3B82F6',
                        marginTop: 8
                      }}>
                        ${insight.amount.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  {insight.trend && (
                    <Ionicons 
                      name={insight.trend === 'up' ? 'trending-up' : 'trending-down'} 
                      size={20} 
                      color={insight.trend === 'up' ? '#EF4444' : '#10B981'} 
                    />
                  )}
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Predictions Tab */}
        {selectedTab === 'predictions' && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              🔮 AI Spending Predictions
            </Text>
            
            {predictions.map((prediction, index) => (
              <Animated.View 
                key={prediction.period}
                entering={FadeInUp.delay(300 + index * 100)}
                style={{ 
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '600', 
                      color: isDark ? '#FFFFFF' : '#111827',
                      marginBottom: 4
                    }}>
                      {prediction.period}
                    </Text>
                    <Text style={{ 
                      fontSize: 24, 
                      fontWeight: 'bold', 
                      color: '#3B82F6'
                    }}>
                      ${prediction.amount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ 
                      fontSize: 12, 
                      color: isDark ? '#9CA3AF' : '#6B7280',
                      marginBottom: 4
                    }}>
                      Confidence
                    </Text>
                    <View style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: `rgba(59, 130, 246, 0.1)`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 3,
                      borderColor: '#3B82F6'
                    }}>
                      <Text style={{ 
                        fontSize: 14, 
                        fontWeight: 'bold', 
                        color: '#3B82F6'
                      }}>
                        {prediction.confidence}%
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
            
            <View style={{ 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}>
              <Text style={{ 
                fontSize: 14, 
                color: isDark ? '#9CA3AF' : '#6B7280',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                💡 Predictions are based on your current spending patterns and may vary based on lifestyle changes
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}