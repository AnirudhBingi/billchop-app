import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { Expense, ExpenseCategory } from '../types';
import { Picker } from '@react-native-picker/picker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food', 'transportation', 'utilities', 'entertainment', 'shopping',
  'healthcare', 'education', 'rent', 'groceries', 'other'
];

export default function SplitBillScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings, friends } = useUserStore();
  const { groups, addExpense } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [splitType, setSplitType] = useState<'friends' | 'group'>('friends');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPayer, setSelectedPayer] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Initialize data
  useEffect(() => {
    if (currentUser) {
      setSelectedPayer(currentUser.id);
      setSelectedFriends([currentUser.id]);
    }
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0].id);
    }
  }, [currentUser, groups]);

  const availableFriends = friends.length > 0 ? friends : [];
  const groupMembers = selectedGroup ? 
    groups.find(g => g.id === selectedGroup)?.members.map(id => 
      friends.find(f => f.id === id) || (currentUser?.id === id ? currentUser : null)
    ).filter(Boolean) || [] : [];

  const handleSave = () => {
    if (!title.trim() || !amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please fill in title and amount');
      return;
    }

    const splitters = splitType === 'group' ? 
      groups.find(g => g.id === selectedGroup)?.members || [] : selectedFriends;

    if (splitters.length === 0) {
      Alert.alert('Error', 'Please select people to split with');
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      currency: 'USD',
      category,
      paidBy: selectedPayer,
      splitBetween: splitters,
      groupId: splitType === 'group' ? selectedGroup : undefined,
      date: new Date(),
      createdAt: new Date(),
      isDraft: false,
    };

    addExpense(expense);
    Alert.alert('Success', 'Bill split successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            Split a Bill
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Add an expense and split it with friends
          </Text>
        </View>

        {/* Split Type Selection */}
        <View style={{ 
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16
          }}>
            Who are you splitting with?
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => setSplitType('friends')}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: splitType === 'friends' ? '#3B82F6' : '#E5E7EB',
                backgroundColor: splitType === 'friends' ? '#EBF5FF' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons 
                name="people-outline" 
                size={24} 
                color={splitType === 'friends' ? '#3B82F6' : '#6B7280'} 
              />
              <Text style={{
                marginTop: 8,
                fontWeight: '600',
                color: splitType === 'friends' ? '#3B82F6' : '#6B7280'
              }}>
                Individual Friends
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => setSplitType('group')}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: splitType === 'group' ? '#3B82F6' : '#E5E7EB',
                backgroundColor: splitType === 'group' ? '#EBF5FF' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons 
                name="home-outline" 
                size={24} 
                color={splitType === 'group' ? '#3B82F6' : '#6B7280'} 
              />
              <Text style={{
                marginTop: 8,
                fontWeight: '600',
                color: splitType === 'group' ? '#3B82F6' : '#6B7280'
              }}>
                Roommate Group
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Expense Details */}
        <View style={{ 
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16
          }}>
            What did you spend on?
          </Text>
          
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Groceries, Dinner, Uber"
            placeholderTextColor="#9CA3AF"
            style={{
              backgroundColor: isDark ? '#374151' : '#F9FAFB',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 16
            }}
          />
          
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '500', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            Amount (USD)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#9CA3AF"
            style={{
              backgroundColor: isDark ? '#374151' : '#F9FAFB',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 12,
              padding: 16,
              fontSize: 18,
              fontWeight: '600',
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 16
            }}
          />
          
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '500', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            Category
          </Text>
          <View style={{
            backgroundColor: isDark ? '#374151' : '#F9FAFB',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={{ color: isDark ? '#FFFFFF' : '#111827' }}
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <Picker.Item 
                  key={cat} 
                  label={cat.charAt(0).toUpperCase() + cat.slice(1)} 
                  value={cat} 
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Group Selection (if group type selected) */}
        {splitType === 'group' && groups.length > 0 && (
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 16
            }}>
              Select Group
            </Text>
            
            <View style={{
              backgroundColor: isDark ? '#374151' : '#F9FAFB',
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 12,
              overflow: 'hidden'
            }}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={setSelectedGroup}
                style={{ color: isDark ? '#FFFFFF' : '#111827' }}
              >
                {groups.map(group => (
                  <Picker.Item key={group.id} label={group.name} value={group.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Friend Selection (if friends type selected) */}
        {splitType === 'friends' && availableFriends.length > 0 && (
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 16
            }}>
              Select Friends ({selectedFriends.length} selected)
            </Text>
            
            {/* Include current user */}
            <Pressable
              onPress={() => toggleFriend(currentUser?.id || '')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 12,
                marginBottom: 8,
                backgroundColor: selectedFriends.includes(currentUser?.id || '') ? 
                  '#EBF5FF' : (isDark ? '#374151' : '#F9FAFB')
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#3B82F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {currentUser?.name.charAt(0) || 'Y'}
                </Text>
              </View>
              <Text style={{ 
                flex: 1, 
                fontSize: 16, 
                color: isDark ? '#FFFFFF' : '#111827' 
              }}>
                {currentUser?.name || 'You'}
              </Text>
              <Ionicons
                name={selectedFriends.includes(currentUser?.id || '') ? 
                  "checkmark-circle" : "ellipse-outline"}
                size={24}
                color="#3B82F6"
              />
            </Pressable>
            
            {availableFriends.map(friend => (
              <Pressable
                key={friend.id}
                onPress={() => toggleFriend(friend.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: selectedFriends.includes(friend.id) ? 
                    '#EBF5FF' : (isDark ? '#374151' : '#F9FAFB')
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#6B7280',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {friend.name.charAt(0)}
                  </Text>
                </View>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: isDark ? '#FFFFFF' : '#111827' 
                }}>
                  {friend.name}
                </Text>
                <Ionicons
                  name={selectedFriends.includes(friend.id) ? 
                    "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color="#3B82F6"
                />
              </Pressable>
            ))}
          </View>
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
              Split Bill
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}