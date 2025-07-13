import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { FinancialGoal } from '../types';
import Animated, { FadeInUp } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProp = NativeStackScreenProps<RootStackParamList, 'GoalManager'>['route'];

const GOAL_TEMPLATES = [
  {
    title: 'Emergency Fund',
    description: 'Save 3-6 months of expenses for emergencies',
    targetAmount: 5000,
    category: 'savings',
    months: 12
  },
  {
    title: 'Travel Fund',
    description: 'Save for your next vacation or trip home',
    targetAmount: 2000,
    category: 'travel',
    months: 6
  },
  {
    title: 'New Laptop',
    description: 'Save for a new computer or device',
    targetAmount: 1500,
    category: 'technology',
    months: 8
  },
  {
    title: 'Graduation Gift',
    description: 'Save for a special graduation celebration',
    targetAmount: 1000,
    category: 'celebration',
    months: 4
  }
];

export default function GoalManagerModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { currentUser, settings } = useUserStore();
  const { addGoal } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  const userId = currentUser?.id || '';
  // Defensive param handling
  const selectedMode = (route.params?.selectedMode === 'local' || route.params?.selectedMode === 'home') ? route.params.selectedMode : 'local';

  // Debug logging
  console.log('GoalManagerModal - Route params:', route.params);
  console.log('GoalManagerModal - Selected mode:', selectedMode);

  if (!route.params || !route.params.selectedMode) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 18 }}>Error: Missing navigation parameters. Please return and try again.</Text>
      </View>
    );
  }
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('savings');
  const [targetMonths, setTargetMonths] = useState('12');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Currency setup based on selected mode
  const localCurrency = { code: 'USD', symbol: '$' };
  const homeCurrency = { code: 'INR', symbol: '₹' };
  const currentCurrency = selectedMode === 'local' ? localCurrency : homeCurrency;
  const isHomeCountry = selectedMode === 'home';

  const handleSave = () => {
    if (!title.trim() || !targetAmount.trim() || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please fill in title and target amount');
      return;
    }

    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + parseInt(targetMonths));

    const goal: FinancialGoal = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      currency: currentCurrency.code,
      category,
      targetDate,
      isHomeCountry,
      userId,
      createdAt: new Date(),
      isCompleted: false,
      priority
    };

    addGoal(goal);
    
    Alert.alert(
      'Success!', 
      `Goal "${title}" created successfully!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const applyTemplate = (template: typeof GOAL_TEMPLATES[0]) => {
    setTitle(template.title);
    setDescription(template.description);
    setTargetAmount(template.targetAmount.toString());
    setCategory(template.category);
    setTargetMonths(template.months.toString());
    setSelectedTemplate(template.title);
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
            🎯 Create Goal
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Set financial goals and track your progress • {currentCurrency.symbol} {currentCurrency.code}
          </Text>
        </Animated.View>

        {/* Goal Templates */}
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
            Quick Templates
          </Text>
          
          <View style={{ gap: 12 }}>
            {GOAL_TEMPLATES.map(template => (
              <Pressable
                key={template.title}
                onPress={() => applyTemplate(template)}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: selectedTemplate === template.title ? '#FEF3C7' : isDark ? '#374151' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: selectedTemplate === template.title ? '#F59E0B' : '#E5E7EB'
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '600',
                      color: isDark ? '#FFFFFF' : '#111827',
                      marginBottom: 4
                    }}>
                      {template.title}
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: isDark ? '#9CA3AF' : '#6B7280'
                    }}>
                      {template.description}
                    </Text>
                  </View>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    color: '#F59E0B'
                  }}>
                    {currentCurrency.symbol}{template.targetAmount.toLocaleString()}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Goal Details */}
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
            Goal Details
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Goal Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Emergency Fund, Travel Savings"
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
              Target Amount *
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#F59E0B',
                marginRight: 8
              }}>
                {currentCurrency.symbol}
              </Text>
              <TextInput
                value={targetAmount}
                onChangeText={setTargetAmount}
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
              {['savings', 'travel', 'technology', 'education', 'celebration', 'other'].map(cat => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: category === cat ? '#F59E0B' : 'transparent',
                    borderWidth: 1,
                    borderColor: category === cat ? '#F59E0B' : '#E5E7EB'
                  }}
                >
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
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Target Months
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['3', '6', '12', '18', '24'].map(months => (
                <Pressable
                  key={months}
                  onPress={() => setTargetMonths(months)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: targetMonths === months ? '#F59E0B' : 'transparent',
                    borderWidth: 1,
                    borderColor: targetMonths === months ? '#F59E0B' : '#E5E7EB',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: targetMonths === months ? 'white' : isDark ? '#FFFFFF' : '#111827'
                  }}>
                    {months} months
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
              Priority
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: priority === p ? '#F59E0B' : 'transparent',
                    borderWidth: 1,
                    borderColor: priority === p ? '#F59E0B' : '#E5E7EB',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: priority === p ? 'white' : isDark ? '#FFFFFF' : '#111827'
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
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes about your goal"
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
        {title.trim() && targetAmount.trim() && (
          <Animated.View 
            entering={FadeInUp.delay(300)}
            style={{ 
              backgroundColor: '#FEF3C7',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#F59E0B'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 12
            }}>
              Goal Preview
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
                <Text style={{ 
                  fontSize: 12, 
                  color: '#F59E0B',
                  fontWeight: '600'
                }}>
                  {category.charAt(0).toUpperCase() + category.slice(1)} • {targetMonths} months • {priority.charAt(0).toUpperCase() + priority.slice(1)} priority
                </Text>
              </View>
              
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold',
                color: '#F59E0B'
              }}>
                {currentCurrency.symbol}{parseFloat(targetAmount || '0').toFixed(2)}
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
              backgroundColor: '#F59E0B',
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'white' 
            }}>
              🎯 Create Goal
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}