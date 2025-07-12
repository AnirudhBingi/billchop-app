import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { PersonalExpense, ExpenseCategory } from '../types';
import { Picker } from '@react-native-picker/picker';
import { cn } from '../utils/cn';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

const INCOME_SOURCES = [
  { value: 'salary', label: 'Full-time Job' },
  { value: 'part_time', label: 'Part-time Job' },
  { value: 'freelance', label: 'Freelance Work' },
  { value: 'family_support', label: 'Family Support' },
  { value: 'scholarship', label: 'Scholarship/Grant' },
  { value: 'investment', label: 'Investment Returns' },
  { value: 'other', label: 'Other Income' },
];

export default function PersonalFinanceModal() {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const { addPersonalExpense } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | typeof INCOME_CATEGORIES[number]>('other');

  const handleSave = () => {
    if (!title.trim() || !amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please fill in all required fields with valid values.');
      return;
    }

    const personalTransaction: PersonalExpense = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      currency: settings.primaryCurrency,
      category: category as ExpenseCategory,
      type: selectedType,
      date: new Date(),
      isHomeCountry: false,
    };

    addPersonalExpense(personalTransaction);
    navigation.goBack();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setCategory('other');
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setSelectedType(type);
    setCategory('other');
    resetForm();
  };

  return (
    <View className={cn(
      "flex-1",
      isDark ? "bg-gray-900" : "bg-gray-50"
    )}>
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector */}
        <GlassCard className="mb-4">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Personal Finance Entry
          </Text>
          
          <View className="flex-row">
            <Pressable
              onPress={() => handleTypeChange('expense')}
              className={cn(
                "flex-1 p-4 rounded-xl mr-2 border-2",
                selectedType === 'expense'
                  ? "bg-red-500/20 border-red-500" 
                  : isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-100 border-gray-200"
              )}
            >
              <View className="items-center">
                <Ionicons 
                  name="trending-down-outline" 
                  size={28} 
                  color={selectedType === 'expense' ? "#EF4444" : isDark ? "#9CA3AF" : "#6B7280"} 
                />
                <Text className={cn(
                  "font-semibold mt-2 text-center",
                  selectedType === 'expense' ? "text-red-500" : isDark ? "text-white" : "text-gray-900"
                )}>
                  Personal Expense
                </Text>
                <Text className={cn(
                  "text-xs text-center mt-1 opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Track your spending
                </Text>
              </View>
            </Pressable>
            
            <Pressable
              onPress={() => handleTypeChange('income')}
              className={cn(
                "flex-1 p-4 rounded-xl ml-2 border-2",
                selectedType === 'income'
                  ? "bg-green-500/20 border-green-500" 
                  : isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-100 border-gray-200"
              )}
            >
              <View className="items-center">
                <Ionicons 
                  name="trending-up-outline" 
                  size={28} 
                  color={selectedType === 'income' ? "#10B981" : isDark ? "#9CA3AF" : "#6B7280"} 
                />
                <Text className={cn(
                  "font-semibold mt-2 text-center",
                  selectedType === 'income' ? "text-green-500" : isDark ? "text-white" : "text-gray-900"
                )}>
                  Income
                </Text>
                <Text className={cn(
                  "text-xs text-center mt-1 opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Log your earnings
                </Text>
              </View>
            </Pressable>
          </View>
        </GlassCard>

        {/* Transaction Details */}
        <GlassCard className="mb-4">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {selectedType === 'income' ? 'Income' : 'Expense'} Details
          </Text>
          
          <Text className={cn(
            "text-sm font-medium mb-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {selectedType === 'income' ? 'Income Source' : 'Expense Description'} *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={selectedType === 'income' ? "e.g., Part-time job at campus store" : "e.g., Coffee and lunch"}
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            className={cn(
              "p-3 rounded-xl mb-4 text-base",
              isDark ? "bg-gray-700 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-200"
            )}
          />
          
          <Text className={cn(
            "text-sm font-medium mb-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Amount * ({settings.primaryCurrency})
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            className={cn(
              "p-3 rounded-xl mb-4 text-base font-semibold",
              isDark ? "bg-gray-700 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-200"
            )}
          />
          
          <Text className={cn(
            "text-sm font-medium mb-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Notes (Optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={selectedType === 'income' ? "e.g., Weekly salary payment" : "e.g., Study session fuel"}
            multiline
            numberOfLines={2}
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            className={cn(
              "p-3 rounded-xl mb-4 text-base",
              isDark ? "bg-gray-700 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-200"
            )}
          />
        </GlassCard>

        {/* Category Selection */}
        <GlassCard className="mb-6">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {selectedType === 'income' ? 'Income Source' : 'Category'}
          </Text>
          
          <View className={cn(
            "rounded-xl overflow-hidden",
            isDark ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-200"
          )}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={{ 
                color: isDark ? "#FFFFFF" : "#111827",
                backgroundColor: isDark ? "#374151" : "#FFFFFF"
              }}
            >
              {selectedType === 'income' ? (
                INCOME_SOURCES.map(source => (
                  <Picker.Item key={source.value} label={source.label} value={source.value} />
                ))
              ) : (
                EXPENSE_CATEGORIES.map(cat => (
                  <Picker.Item 
                    key={cat} 
                    label={cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')} 
                    value={cat} 
                  />
                ))
              )}
            </Picker>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="p-4 pt-2">
        <View className="flex-row space-x-3">
          <AnimatedButton
            title="Cancel"
            variant="outline"
            className="flex-1"
            onPress={() => navigation.goBack()}
          />
          <AnimatedButton
            title={selectedType === 'income' ? "Add Income" : "Add Expense"}
            className="flex-1"
            onPress={handleSave}
          />
        </View>
      </View>
    </View>
  );
}