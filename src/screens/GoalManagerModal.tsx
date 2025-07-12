import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { FinancialGoal } from '../types';
import { Picker } from '@react-native-picker/picker';
import Animated, { FadeInUp } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GOAL_CATEGORIES = [
  { id: 'savings', name: 'Emergency Savings', icon: 'shield-checkmark', color: '#10B981' },
  { id: 'travel', name: 'Travel & Vacation', icon: 'airplane', color: '#3B82F6' },
  { id: 'education', name: 'Education', icon: 'school', color: '#8B5CF6' },
  { id: 'shopping', name: 'Shopping & Gadgets', icon: 'bag', color: '#EC4899' },
  { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#F59E0B' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical', color: '#EF4444' },
  { id: 'home', name: 'Home & Living', icon: 'home', color: '#06B6D4' },
  { id: 'other', name: 'Other Goals', icon: 'star', color: '#6B7280' }
];

const GOAL_TEMPLATES = [
  { title: 'Emergency Fund', amount: 5000, category: 'savings', months: 12 },
  { title: 'New Laptop', amount: 1500, category: 'shopping', months: 6 },
  { title: 'Summer Vacation', amount: 3000, category: 'travel', months: 8 },
  { title: 'Course Certification', amount: 800, category: 'education', months: 4 },
  { title: 'Investment Portfolio', amount: 10000, category: 'investment', months: 18 }
];

export default function GoalManagerModal() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const { addGoal } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  const userId = currentUser?.id || '';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('savings');
  const [targetMonths, setTargetMonths] = useState('12');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

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
      currency: 'USD',
      category,
      targetDate,
      isHomeCountry: false, // TODO: Make this dynamic
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
    setTargetAmount(template.amount.toString());
    setCategory(template.category);
    setTargetMonths(template.months.toString());
    setSelectedTemplate(template.title);
    setDescription(`Save ${template.amount} for ${template.title.toLowerCase()} over ${template.months} months`);
  };

  const getCategoryData = (catId: string) => {
    return GOAL_CATEGORIES.find(c => c.id === catId) || GOAL_CATEGORIES[0];
  };

  const monthlyTarget = targetAmount ? (parseFloat(targetAmount) / parseInt(targetMonths || '1')).toFixed(2) : '0';

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
            🎯 Create Financial Goal
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Set targets and track your progress
          </Text>
        </Animated.View>

        {/* Quick Templates */}
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
            ⚡ Quick Start Templates
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {GOAL_TEMPLATES.map(template => (
                <Pressable
                  key={template.title}
                  onPress={() => applyTemplate(template)}
                  style={{
                    width: 160,
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selectedTemplate === template.title ? '#3B82F6' : '#E5E7EB',
                    backgroundColor: selectedTemplate === template.title ? '#EBF8FF' : 'transparent'
                  }}
                >
                  <Ionicons 
                    name={getCategoryData(template.category).icon as any} 
                    size={24} 
                    color={getCategoryData(template.category).color} 
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={{
                    fontWeight: '600',
                    color: isDark ? '#FFFFFF' : '#111827',
                    marginBottom: 4
                  }}>
                    {template.title}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    marginBottom: 8
                  }}>
                    ${template.amount} • {template.months} months
                  </Text>
                  <Text style={{
                    fontSize: 10,
                    color: '#3B82F6',
                    fontWeight: '500'
                  }}>
                    ${(template.amount / template.months).toFixed(0)}/month
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
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
            Goal Configuration
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
              placeholder="e.g., Emergency Fund, New iPhone, Vacation"
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
                color: '#10B981',
                marginRight: 8
              }}>
                $
              </Text>
              <TextInput
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="5000.00"
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
                {GOAL_CATEGORIES.map(cat => (
                  <Picker.Item 
                    key={cat.id} 
                    label={cat.name} 
                    value={cat.id}
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
              Time Frame (Months)
            </Text>
            <TextInput
              value={targetMonths}
              onChangeText={setTargetMonths}
              placeholder="12"
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
            {targetAmount && targetMonths && (
              <Text style={{ 
                fontSize: 12, 
                color: '#10B981',
                marginTop: 4,
                fontWeight: '500'
              }}>
                💡 You'll need to save ${monthlyTarget} per month
              </Text>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Priority Level
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: priority === p ? 
                      (p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981') : '#E5E7EB',
                    backgroundColor: priority === p ? 
                      (p === 'high' ? '#FEF2F2' : p === 'medium' ? '#FEF3C7' : '#ECFDF5') : 'transparent',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontWeight: '600',
                    color: priority === p ? 
                      (p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981') : 
                      (isDark ? '#FFFFFF' : '#111827'),
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
              color: '#047857',
              marginBottom: 12
            }}>
              🎯 Goal Preview
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons 
                name={getCategoryData(category).icon as any} 
                size={24} 
                color={getCategoryData(category).color} 
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  color: '#047857',
                  marginBottom: 4
                }}>
                  {title}
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: '#059669'
                }}>
                  {getCategoryData(category).name} • {priority} priority
                </Text>
              </View>
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold',
                color: '#047857'
              }}>
                ${parseFloat(targetAmount || '0').toFixed(2)}
              </Text>
            </View>
            
            <View style={{ 
              backgroundColor: '#DCFCE7', 
              borderRadius: 8, 
              padding: 12 
            }}>
              <Text style={{ 
                fontSize: 12, 
                color: '#047857',
                textAlign: 'center'
              }}>
                💰 Save ${monthlyTarget}/month for {targetMonths} months
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
              backgroundColor: '#10B981',
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