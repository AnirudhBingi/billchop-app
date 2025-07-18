import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { PersonalExpense, ExpenseCategory, IncomeCategory } from '../types';
import Animated, { FadeInUp } from 'react-native-reanimated';
import CurrencyService from '../services/CurrencyService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, 'PersonalFinance'>['route'];

const INCOME_CATEGORIES = [
  'salary',
  'freelance', 
  'part_time',
  'family_support',
  'scholarship',
  'investment',
  'other'
] as const;

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food', 'transportation', 'utilities', 'entertainment', 'shopping',
  'healthcare', 'education', 'rent', 'groceries', 'other'
];

export default function PersonalFinanceModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { currentUser, settings } = useUserStore();
  const { addPersonalExpense, updatePersonalExpense } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  // Defensive param handling
  const initialType = (route.params?.initialType === 'income' || route.params?.initialType === 'expense') ? route.params.initialType : 'expense';
  const selectedMode = (route.params?.selectedMode === 'local' || route.params?.selectedMode === 'home') ? route.params.selectedMode : 'local';

  const isEditing = !!route.params?.expenseId && !!route.params?.prefill;
  const prefill = route.params?.prefill;

  // Debug logging
  console.log('PersonalFinanceModal - Route params:', route.params);
  console.log('PersonalFinanceModal - Selected mode:', selectedMode);
  console.log('PersonalFinanceModal - Initial type:', initialType);

  if (!route.params || !route.params.selectedMode) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 18 }}>Error: Missing navigation parameters. Please return and try again.</Text>
      </View>
    );
  }
  
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(prefill ? prefill.type : initialType);
  const [title, setTitle] = useState(prefill ? prefill.title : '');
  const [amount, setAmount] = useState(prefill ? prefill.amount.toString() : '');
  const [description, setDescription] = useState(prefill ? prefill.description || '' : '');
  const [category, setCategory] = useState<string>(prefill ? prefill.category : (selectedType === 'income' ? 'salary' : 'food'));
  
  // Currency setup based on selected mode
  const localCurrency = { code: 'USD', symbol: '$' };
  const homeCurrency = { code: 'INR', symbol: '₹' };
  const currentCurrency = selectedMode === 'local' ? localCurrency : homeCurrency;
  const isHomeCountry = selectedMode === 'home';

  const handleSave = async () => {
    if (!title.trim() || !amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please fill in title and amount');
      return;
    }

    let lockedExchangeRate: number | undefined = prefill?.lockedExchangeRate;
    if (currentCurrency.code !== 'USD' && !lockedExchangeRate) {
      try {
        const currencyService = CurrencyService.getInstance();
        lockedExchangeRate = await currencyService.getExchangeRate(currentCurrency.code, 'USD');
      } catch (error) {
        console.warn('Could not fetch exchange rate, will fallback to current rate on calculation.');
      }
    }

    if (isEditing && prefill) {
      updatePersonalExpense(prefill.id, {
        title: title.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        currency: currentCurrency.code,
        category: category as (ExpenseCategory | IncomeCategory),
        type: selectedType,
        isHomeCountry,
        lockedExchangeRate
      });
      Alert.alert(
        'Success!',
        'Transaction updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    const personalExpense: PersonalExpense = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      currency: currentCurrency.code,
      category: category as (ExpenseCategory | IncomeCategory),
      type: selectedType,
      date: new Date(),
      createdAt: new Date(),
      userId: currentUser?.id || '',
      isHomeCountry,
      lockedExchangeRate
    };

    addPersonalExpense(personalExpense);
    
    Alert.alert(
      'Success!', 
      `${selectedType === 'income' ? 'Income' : 'Expense'} added successfully!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      salary: '#10B981',
      freelance: '#3B82F6',
      part_time: '#8B5CF6',
      family_support: '#F59E0B',
      scholarship: '#EF4444',
      investment: '#06B6D4',
      food: '#EF4444',
      transportation: '#3B82F6',
      utilities: '#F59E0B',
      entertainment: '#8B5CF6',
      shopping: '#EC4899',
      healthcare: '#EF4444',
      education: '#10B981',
      rent: '#6366F1',
      groceries: '#059669',
      other: '#6B7280'
    };
    return colors[cat] || '#6B7280';
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <Animated.View entering={FadeInUp} style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            💰 Add {selectedType === 'income' ? 'Income' : 'Expense'}
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Track your personal {selectedType === 'income' ? 'income' : 'expenses'} • {currentCurrency.symbol} {currentCurrency.code}
          </Text>
        </Animated.View>

        {/* Type Selection */}
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
            Transaction Type
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => {
                setSelectedType('income');
                setCategory('salary');
              }}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selectedType === 'income' ? '#10B981' : '#E5E7EB',
                backgroundColor: selectedType === 'income' ? '#ECFDF5' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons 
                name="add-circle" 
                size={24} 
                color={selectedType === 'income' ? '#10B981' : '#6B7280'} 
              />
              <Text style={{
                marginTop: 8,
                fontWeight: '600',
                color: selectedType === 'income' ? '#10B981' : '#6B7280'
              }}>
                💰 Income
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                setSelectedType('expense');
                setCategory('food');
              }}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selectedType === 'expense' ? '#EF4444' : '#E5E7EB',
                backgroundColor: selectedType === 'expense' ? '#FEF2F2' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons 
                name="remove-circle" 
                size={24} 
                color={selectedType === 'expense' ? '#EF4444' : '#6B7280'} 
              />
              <Text style={{
                marginTop: 8,
                fontWeight: '600',
                color: selectedType === 'expense' ? '#EF4444' : '#6B7280'
              }}>
                💸 Expense
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Transaction Details */}
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
            {selectedType === 'income' ? 'Income' : 'Expense'} Details
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={selectedType === 'income' ? 'e.g., Salary, Freelance work' : 'e.g., Groceries, Rent, Transport'}
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

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Amount *
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: selectedType === 'income' ? '#10B981' : '#EF4444',
                marginRight: 8
              }}>
                {currentCurrency.symbol}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
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
              Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: category === cat ? getCategoryColor(cat) : 'transparent',
                    borderWidth: 1,
                    borderColor: category === cat ? getCategoryColor(cat) : '#E5E7EB'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: category === cat ? 'white' : isDark ? '#FFFFFF' : '#111827'
                  }}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
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
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes about this transaction"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: isDark ? '#374151' : '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: isDark ? '#FFFFFF' : '#111827',
                textAlignVertical: 'top'
              }}
            />
          </View>
        </Animated.View>

        {/* Preview */}
        {title.trim() && amount.trim() && (
          <Animated.View 
            entering={FadeInUp.delay(300)}
            style={{ 
              backgroundColor: selectedType === 'income' ? '#ECFDF5' : '#FEF2F2',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: selectedType === 'income' ? '#10B981' : '#EF4444'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 12
            }}>
              Preview
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  color: isDark ? '#FFFFFF' : '#111827',
                  marginBottom: 4
                }}>
                  {title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View 
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: getCategoryColor(category),
                      marginRight: 8
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                      {category.toUpperCase().replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={{ 
                    fontSize: 12, 
                    color: selectedType === 'income' ? '#10B981' : '#EF4444',
                    fontWeight: '600'
                  }}>
                    {selectedType.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold',
                color: selectedType === 'income' ? '#10B981' : '#EF4444'
              }}>
                {selectedType === 'income' ? '+' : '-'}{currentCurrency.symbol}{parseFloat(amount || '0').toFixed(2)}
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
              backgroundColor: selectedType === 'income' ? '#10B981' : '#EF4444',
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'white' 
            }}>
              {selectedType === 'income' ? '💰 Add Income' : '💸 Add Expense'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}