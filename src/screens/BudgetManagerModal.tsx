import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { Budget, ExpenseCategory } from '../types';
import Animated, { FadeInUp } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, 'BudgetManager'>['route'];

const BUDGET_CATEGORIES: ExpenseCategory[] = [
  'food', 'transportation', 'utilities', 'entertainment', 'shopping',
  'healthcare', 'education', 'rent', 'groceries', 'other'
];

export default function BudgetManagerModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { currentUser, settings } = useUserStore();
  const { addBudget, updateBudget } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  const userId = currentUser?.id || '';
  // Defensive param handling
  const selectedMode = (route.params?.selectedMode === 'local' || route.params?.selectedMode === 'home') ? route.params.selectedMode : 'local';

  // Debug logging
  console.log('BudgetManagerModal - Route params:', route.params);
  console.log('BudgetManagerModal - Selected mode:', selectedMode);

  if (!route.params || !route.params.selectedMode) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 18 }}>Error: Missing navigation parameters. Please return and try again.</Text>
      </View>
    );
  }
  
  const isEditing = !!route.params?.budgetId && !!route.params?.prefill;
  const prefill = route.params?.prefill;

  const [category, setCategory] = useState<ExpenseCategory>(prefill ? prefill.category as ExpenseCategory : 'food');
  const [limit, setLimit] = useState(prefill ? prefill.limit.toString() : '');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(prefill ? prefill.period : 'monthly');
  const [alertThreshold, setAlertThreshold] = useState(prefill ? prefill.alertThreshold.toString() : '80');

  // Currency setup based on selected mode
  const localCurrency = { code: 'USD', symbol: '$' };
  const homeCurrency = { code: 'INR', symbol: '₹' };
  const currentCurrency = selectedMode === 'local' ? localCurrency : homeCurrency;
  const isHomeCountry = selectedMode === 'home';

  const handleSave = () => {
    if (!limit.trim() || parseFloat(limit) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget limit');
      return;
    }

    if (isEditing && prefill) {
      updateBudget(prefill.id, {
        category,
        limit: parseFloat(limit),
        period,
        alertThreshold: parseFloat(alertThreshold),
        currency: currentCurrency.code,
        isHomeCountry
      });
      Alert.alert(
        'Success!',
        'Budget updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    const budget: Budget = {
      id: Date.now().toString(),
      category,
      limit: parseFloat(limit),
      spent: 0,
      currency: currentCurrency.code,
      period,
      isHomeCountry,
      userId,
      createdAt: new Date(),
      alertThreshold: parseFloat(alertThreshold),
      isActive: true
    };

    addBudget(budget);
    
    Alert.alert(
      'Success!', 
      `Budget for ${category} created successfully!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      food: 'restaurant',
      transportation: 'car',
      utilities: 'flash',
      entertainment: 'game-controller',
      shopping: 'bag',
      healthcare: 'medical',
      education: 'school',
      rent: 'home',
      groceries: 'basket',
      other: 'ellipsis-horizontal'
    };
    return icons[cat] || 'ellipsis-horizontal';
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6', paddingTop: insets.top }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <Animated.View entering={FadeInUp} style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            📊 Create Budget
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Set spending limits for different categories • {currentCurrency.symbol} {currentCurrency.code}
          </Text>
        </Animated.View>

        {/* Category Selection */}
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
            Category
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {BUDGET_CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: category === cat ? '#3B82F6' : 'transparent',
                  borderWidth: 1,
                  borderColor: category === cat ? '#3B82F6' : '#E5E7EB',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Ionicons 
                  name={getCategoryIcon(cat) as any} 
                  size={16} 
                  color={category === cat ? 'white' : isDark ? '#FFFFFF' : '#111827'} 
                />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: category === cat ? 'white' : isDark ? '#FFFFFF' : '#111827'
                }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Budget Details */}
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
            Budget Details
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Monthly Limit *
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#3B82F6',
                marginRight: 8
              }}>
                {currentCurrency.symbol}
              </Text>
              <TextInput
                value={limit}
                onChangeText={setLimit}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#374151' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 18,
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#111827'
                }}
              />
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Period
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['daily', 'weekly', 'monthly'] as const).map(p => (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: period === p ? '#3B82F6' : 'transparent',
                    borderWidth: 1,
                    borderColor: period === p ? '#3B82F6' : '#E5E7EB',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: period === p ? 'white' : isDark ? '#FFFFFF' : '#111827'
                  }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Alert Threshold (%)
            </Text>
            <TextInput
              value={alertThreshold}
              onChangeText={setAlertThreshold}
              placeholder="80"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              style={{
                backgroundColor: isDark ? '#374151' : '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: isDark ? '#FFFFFF' : '#111827'
              }}
            />
          </View>
        </Animated.View>

        {/* Preview */}
        {limit.trim() && (
          <Animated.View 
            entering={FadeInUp.delay(300)}
            style={{ 
              backgroundColor: '#ECFDF5',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#10B981'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 12
            }}>
              Budget Preview
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  color: isDark ? '#FFFFFF' : '#111827',
                  marginBottom: 4
                }}>
                  {category.charAt(0).toUpperCase() + category.slice(1)} Budget
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: '#10B981',
                  fontWeight: '600'
                }}>
                  {period.charAt(0).toUpperCase() + period.slice(1)} • Alert at {alertThreshold}%
                </Text>
              </View>
              
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold',
                color: '#10B981'
              }}>
                {currentCurrency.symbol}{parseFloat(limit || '0').toFixed(2)}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 20
      }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#E5E7EB',
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827' 
            }}>
              Cancel
            </Text>
          </Pressable>
          
          <Pressable
            onPress={handleSave}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#3B82F6',
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'white' 
            }}>
              📊 Create Budget
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}