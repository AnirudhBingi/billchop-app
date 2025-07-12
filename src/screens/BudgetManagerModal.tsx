import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { Budget, ExpenseCategory } from '../types';
import { Picker } from '@react-native-picker/picker';
import Animated, { FadeInUp } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BUDGET_CATEGORIES: ExpenseCategory[] = [
  'food', 'transportation', 'utilities', 'entertainment', 'shopping',
  'healthcare', 'education', 'rent', 'groceries', 'other'
];

export default function BudgetManagerModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const { addBudget } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  const userId = currentUser?.id || '';
  
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [alertThreshold, setAlertThreshold] = useState('80');

  const handleSave = () => {
    if (!limit.trim() || parseFloat(limit) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget limit');
      return;
    }

    const budget: Budget = {
      id: Date.now().toString(),
      category,
      limit: parseFloat(limit),
      spent: 0,
      currency: 'USD',
      period,
      isHomeCountry: false, // TODO: Make this dynamic based on selected mode
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
            Set spending limits and get smart alerts
          </Text>
        </Animated.View>

        {/* Budget Details */}
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
            Budget Configuration
          </Text>
          
          <View style={{ marginBottom: 16 }}>
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
                style={{ 
                  color: isDark ? '#FFFFFF' : '#111827',
                  backgroundColor: 'transparent'
                }}
              >
                {BUDGET_CATEGORIES.map(cat => (
                  <Picker.Item 
                    key={cat} 
                    label={`${cat.charAt(0).toUpperCase() + cat.slice(1)}`} 
                    value={cat}
                    color={isDark ? '#FFFFFF' : '#111827'}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Budget Limit
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#3B82F6',
                marginRight: 8
              }}>
                $
              </Text>
              <TextInput
                value={limit}
                onChangeText={setLimit}
                placeholder="500.00"
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
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: period === p ? '#3B82F6' : '#E5E7EB',
                    backgroundColor: period === p ? '#3B82F6' : 'transparent',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontWeight: '600',
                    color: period === p ? 'white' : isDark ? '#FFFFFF' : '#111827',
                    textTransform: 'capitalize'
                  }}>
                    {p}
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
              keyboardType="number-pad"
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
            <Text style={{ 
              fontSize: 12, 
              color: isDark ? '#9CA3AF' : '#6B7280',
              marginTop: 4
            }}>
              Get notified when you reach this percentage of your budget
            </Text>
          </View>
        </Animated.View>

        {/* Preview */}
        {limit.trim() && (
          <Animated.View 
            entering={FadeInUp.delay(200)}
            style={{ 
              backgroundColor: '#EBF8FF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#3B82F6'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: '#1E3A8A',
              marginBottom: 12
            }}>
              Budget Preview
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons 
                name={getCategoryIcon(category) as any} 
                size={24} 
                color="#3B82F6" 
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  color: '#1E3A8A',
                  textTransform: 'capitalize'
                }}>
                  {category} Budget
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: '#3B82F6'
                }}>
                  {period.charAt(0).toUpperCase() + period.slice(1)} • Alert at {alertThreshold}%
                </Text>
              </View>
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold',
                color: '#3B82F6'
              }}>
                ${parseFloat(limit || '0').toFixed(2)}
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