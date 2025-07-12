import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { Expense, ExpenseCategory, User, PersonalExpense } from '../types';
import { Picker } from '@react-native-picker/picker';
import { cn } from '../utils/cn';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
type RouteProp_AddExpense = RouteProp<RootStackParamList, 'AddExpense'>;

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food', 'transportation', 'utilities', 'entertainment', 'shopping',
  'healthcare', 'education', 'rent', 'groceries', 'other'
];

export default function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp_AddExpense>();
  const { currentUser, settings, friends } = useUserStore();
  const { groups, addExpense, addPersonalExpense } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  const { groupId, isPersonal: routeIsPersonal, isIncome: routeIsIncome } = route.params || {};
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [selectedPayer, setSelectedPayer] = useState(currentUser?.id || '');
  const [selectedSplitters, setSelectedSplitters] = useState<string[]>([currentUser?.id || '']);
  const [isDraft, setIsDraft] = useState(false);

  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;
  const availableUsers = selectedGroup 
    ? [currentUser, ...friends].filter(u => u && selectedGroup.members.includes(u.id))
    : [currentUser, ...friends].filter(Boolean);

  const handleSave = () => {
    if (!title.trim() || !amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please fill in all required fields with valid values.');
      return;
    }

    if (selectedSplitters.length === 0) {
      Alert.alert('Error', 'Please select at least one person to split the expense with.');
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      currency: settings.primaryCurrency,
      category,
      paidBy: selectedPayer,
      splitBetween: selectedSplitters,
      groupId: selectedGroupId || undefined,
      date: new Date(),
      createdAt: new Date(),
      isDraft,
    };

    addExpense(expense);
    navigation.goBack();
  };

  const toggleSplitter = (userId: string) => {
    setSelectedSplitters(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const SplitterItem = ({ user }: { user: User }) => {
    const isSelected = selectedSplitters.includes(user.id);
    const splitAmount = selectedSplitters.length > 0 ? parseFloat(amount || '0') / selectedSplitters.length : 0;
    
    return (
      <Pressable
        onPress={() => toggleSplitter(user.id)}
        className={cn(
          "flex-row items-center justify-between p-3 rounded-xl mb-2",
          isSelected 
            ? "bg-blue-500/20 border-2 border-blue-500" 
            : isDark ? "bg-gray-700/50 border border-gray-600" : "bg-gray-100 border border-gray-200"
        )}
      >
        <View className="flex-row items-center flex-1">
          <View className={cn(
            "w-10 h-10 rounded-full items-center justify-center mr-3",
            isSelected ? "bg-blue-500" : "bg-gray-400"
          )}>
            <Text className="text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className={cn(
            "font-medium",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {user.name}
          </Text>
        </View>
        
        {isSelected && (
          <Text className={cn(
            "text-sm font-medium",
            isDark ? "text-white" : "text-gray-900"
          )}>
            ${splitAmount.toFixed(2)}
          </Text>
        )}
        
        <Ionicons
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={isSelected ? "#3B82F6" : isDark ? "#9CA3AF" : "#6B7280"}
          style={{ marginLeft: 8 }}
        />
      </Pressable>
    );
  };

  return (
    <View 
      className={cn(
        "flex-1",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Split With Section */}
        <GlassCard className="mb-4">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Split With
          </Text>
          
          <View className="flex-row">
            <Pressable
              onPress={() => setSelectedGroupId('')}
              className={cn(
                "flex-1 p-4 rounded-xl mr-2 border-2",
                !selectedGroupId 
                  ? "bg-blue-500/20 border-blue-500" 
                  : isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-100 border-gray-200"
              )}
            >
              <View className="items-center">
                <Ionicons 
                  name="person-add-outline" 
                  size={28} 
                  color={!selectedGroupId ? "#3B82F6" : isDark ? "#9CA3AF" : "#6B7280"} 
                />
                <Text className={cn(
                  "font-semibold mt-2 text-center",
                  !selectedGroupId ? "text-blue-500" : isDark ? "text-white" : "text-gray-900"
                )}>
                  Expense with Friends
                </Text>
                <Text className={cn(
                  "text-xs text-center mt-1 opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Select individual friends
                </Text>
              </View>
            </Pressable>
            
            <Pressable
              onPress={() => setSelectedGroupId(groups.length > 0 ? groups[0].id : '')}
              className={cn(
                "flex-1 p-4 rounded-xl ml-2 border-2",
                selectedGroupId 
                  ? "bg-blue-500/20 border-blue-500" 
                  : isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-100 border-gray-200"
              )}
            >
              <View className="items-center">
                <Ionicons 
                  name="home-outline" 
                  size={28} 
                  color={selectedGroupId ? "#3B82F6" : isDark ? "#9CA3AF" : "#6B7280"} 
                />
                <Text className={cn(
                  "font-semibold mt-2 text-center",
                  selectedGroupId ? "text-blue-500" : isDark ? "text-white" : "text-gray-900"
                )}>
                  Group Expense
                </Text>
                <Text className={cn(
                  "text-xs text-center mt-1 opacity-70",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Use existing group
                </Text>
              </View>
            </Pressable>
          </View>
        </GlassCard>

        {/* Expense Details */}
        <GlassCard className="mb-4">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Expense Details
          </Text>
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Expense Details
          </Text>
          
          <Text className={cn(
            "text-sm font-medium mb-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            What did you spend on? *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Grocery shopping, Dinner, Uber ride"
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
            Description (Optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note about this expense"
            multiline
            numberOfLines={2}
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            className={cn(
              "p-3 rounded-xl mb-4 text-base",
              isDark ? "bg-gray-700 text-white border border-gray-600" : "bg-white text-gray-900 border border-gray-200"
            )}
          />
        </GlassCard>

        {/* Category */}
        <GlassCard className="mb-4">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Category
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
              {EXPENSE_CATEGORIES.map(cat => (
                <Picker.Item 
                  key={cat} 
                  label={cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')} 
                  value={cat} 
                />
              ))}
            </Picker>
          </View>
        </GlassCard>

        {/* Who Paid */}
        <GlassCard className="mb-4">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Who paid?
          </Text>
          
          <View className={cn(
            "rounded-xl overflow-hidden",
            isDark ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-200"
          )}>
            <Picker
              selectedValue={selectedPayer}
              onValueChange={setSelectedPayer}
              style={{ 
                color: isDark ? "#FFFFFF" : "#111827",
                backgroundColor: isDark ? "#374151" : "#FFFFFF"
              }}
            >
              {availableUsers.map(user => (
                <Picker.Item key={user.id} label={user.name} value={user.id} />
              ))}
            </Picker>
          </View>
        </GlassCard>

        {/* Split Between */}
        <GlassCard className="mb-4">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Split between ({selectedSplitters.length} people)
          </Text>
          
          {availableUsers.map(user => (
            <SplitterItem key={user.id} user={user} />
          ))}
        </GlassCard>

        {/* Draft Toggle */}
        <GlassCard className="mb-6">
          <Pressable
            onPress={() => setIsDraft(!isDraft)}
            className="flex-row items-center justify-between"
          >
            <View>
              <Text className={cn(
                "font-semibold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Save as Draft
              </Text>
              <Text className={cn(
                "text-sm opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Don't notify others yet
              </Text>
            </View>
            <Ionicons
              name={isDraft ? "toggle" : "toggle-outline"}
              size={32}
              color={isDraft ? "#3B82F6" : isDark ? "#6B7280" : "#9CA3AF"}
            />
          </Pressable>
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
            title={isDraft ? "Save Draft" : "Split Bill"}
            className="flex-1"
            onPress={handleSave}
          />
        </View>
      </View>
    </View>
  );
}