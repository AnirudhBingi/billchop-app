import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import AnimatedButton from '../components/AnimatedButton';
import { Expense, ExpenseCategory, User } from '../types';
import { Picker } from '@react-native-picker/picker';

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

  // Reset form when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Reset form state when screen comes into focus
      setTitle('');
      setDescription('');
      setAmount('');
      setCategory('other');
      setSelectedGroupId(groupId || '');
      setSelectedPayer(currentUser?.id || '');
      setSelectedSplitters([currentUser?.id || '']);
      setIsDraft(false);
    }, [groupId, currentUser?.id])
  );

  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;
  const availableUsers = selectedGroup 
    ? [currentUser, ...friends].filter(u => u && selectedGroup.members.includes(u.id))
    : [currentUser, ...friends].filter(Boolean);

  // Debug logging
  console.log('AddExpenseScreen rendering:', {
    currentUser: !!currentUser,
    friends: friends.length,
    groups: groups.length,
    availableUsers: availableUsers.length,
    title,
    selectedGroupId
  });

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

  // Ensure we have a fallback user list even if data isn't loaded
  const safeAvailableUsers = availableUsers.length > 0 ? availableUsers : [
    { id: '1', name: 'You', email: '', createdAt: new Date() }
  ];

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: isDark ? '#111827' : '#F9FAFB' 
      }}
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {/* Split With Section */}
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.1 : 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16 
          }}>
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
        </View>

        {/* Expense Details */}
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16 
          }}>
            Expense Details
          </Text>
          
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8 
          }}>
            What did you spend on? *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Grocery shopping, Dinner, Uber ride"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            style={{
              padding: 12,
              borderRadius: 12,
              marginBottom: 16,
              fontSize: 16,
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#111827',
              borderWidth: 1,
              borderColor: isDark ? '#6B7280' : '#E5E7EB'
            }}
          />
          
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8 
          }}>
            Amount * ({settings.primaryCurrency})
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            style={{
              padding: 12,
              borderRadius: 12,
              marginBottom: 16,
              fontSize: 16,
              fontWeight: '600',
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#111827',
              borderWidth: 1,
              borderColor: isDark ? '#6B7280' : '#E5E7EB'
            }}
          />
          
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8 
          }}>
            Description (Optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note about this expense"
            multiline
            numberOfLines={3}
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
            style={{
              padding: 12,
              borderRadius: 12,
              marginBottom: 16,
              fontSize: 16,
              height: 80,
              textAlignVertical: 'top',
              backgroundColor: isDark ? '#374151' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#111827',
              borderWidth: 1,
              borderColor: isDark ? '#6B7280' : '#E5E7EB'
            }}
          />
        </View>

        {/* Category */}
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16 
          }}>
            Category
          </Text>
          
          <View style={{
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: isDark ? '#374151' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? '#6B7280' : '#E5E7EB'
          }}>
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
        </View>

        {/* Who Paid */}
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16 
          }}>
            Who paid?
          </Text>
          
          <View style={{
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: isDark ? '#374151' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? '#6B7280' : '#E5E7EB'
          }}>
            <Picker
              selectedValue={selectedPayer}
              onValueChange={setSelectedPayer}
              style={{ 
                color: isDark ? "#FFFFFF" : "#111827",
                backgroundColor: isDark ? "#374151" : "#FFFFFF"
              }}
            >
              {safeAvailableUsers.map(user => (
                <Picker.Item key={user.id} label={user.name} value={user.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Split Between */}
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16 
          }}>
            Split between ({selectedSplitters.length} people)
          </Text>
          
          {safeAvailableUsers.map(user => (
            <SplitterItem key={user.id} user={user} />
          ))}
        </View>

        {/* Draft Toggle */}
        <View style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 24,
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Pressable
            onPress={() => setIsDraft(!isDraft)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <View>
              <Text style={{
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#111827'
              }}>
                Save as Draft
              </Text>
              <Text style={{
                fontSize: 14,
                opacity: 0.7,
                color: isDark ? '#FFFFFF' : '#111827'
              }}>
                Don't notify others yet
              </Text>
            </View>
            <Ionicons
              name={isDraft ? "toggle" : "toggle-outline"}
              size={32}
              color={isDraft ? "#3B82F6" : "#9CA3AF"}
            />
          </Pressable>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={{ 
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: isDark ? '#111827' : '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#374151' : '#E5E7EB'
      }}>
        <View style={{ flexDirection: 'row' }}>
          <AnimatedButton
            title="Cancel"
            variant="outline"
            className="flex-1 mr-2"
            onPress={() => navigation.goBack()}
          />
          <AnimatedButton
            title={isDraft ? "Save Draft" : "Split Bill"}
            className="flex-1 ml-2"
            onPress={handleSave}
          />
        </View>
      </View>
    </View>
  );
}