import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useChoreStore } from '../state/useChoreStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { Chore } from '../types';
import { Picker } from '@react-native-picker/picker';
import Animated, { FadeInUp } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddChore'>;

const CHORE_CATEGORIES = [
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles', color: '#3B82F6' },
  { id: 'shopping', name: 'Shopping', icon: 'bag', color: '#10B981' },
  { id: 'maintenance', name: 'Maintenance', icon: 'hammer', color: '#F59E0B' },
  { id: 'organization', name: 'Organization', icon: 'file-tray-stacked', color: '#8B5CF6' },
  { id: 'outdoor', name: 'Outdoor', icon: 'leaf', color: '#059669' },
  { id: 'other', name: 'Other', icon: 'list', color: '#6B7280' }
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', points: 10, color: '#10B981', description: '15-30 minutes' },
  { id: 'medium', name: 'Medium', points: 15, color: '#F59E0B', description: '30-60 minutes' },
  { id: 'hard', name: 'Hard', points: 25, color: '#EF4444', description: '60+ minutes' }
];

export default function AddChoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings, friends } = useUserStore();
  const { addChore } = useChoreStore();
  const { groups } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cleaning');
  const [difficulty, setDifficulty] = useState('medium');
  const [assignedTo, setAssignedTo] = useState(currentUser?.id || '');
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [isRecurring, setIsRecurring] = useState(false);

  const selectedCategory = CHORE_CATEGORIES.find(c => c.id === category);
  const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.id === difficulty);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a chore title');
      return;
    }

    if (!assignedTo) {
      Alert.alert('Error', 'Please assign this chore to someone');
      return;
    }

    const chore: Chore = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category: category as any,
      groupId: selectedGroup,
      assignedTo,
      points: selectedDifficulty?.points || 15,
      dueDate,
      isRecurring,
      status: 'pending',
      createdBy: currentUser?.id || '',
      createdAt: new Date()
    };

    addChore(chore);
    
    Alert.alert(
      'Chore Created!',
      `"${title}" has been assigned to ${assignedTo === currentUser?.id ? 'you' : friends.find(f => f.id === assignedTo)?.name || 'Unknown'}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <Animated.View entering={FadeInUp} style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            📋 Create Chore
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Add a new task and assign it to group members
          </Text>
        </Animated.View>

        {/* Chore Details */}
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
            Chore Details
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
              placeholder="e.g., Clean Kitchen, Take out trash, Vacuum living room"
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
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add specific instructions or details"
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

        {/* Category Selection */}
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
            Category
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {CHORE_CATEGORIES.map(cat => (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={{
                  flex: 1,
                  minWidth: '30%',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: category === cat.id ? cat.color : '#E5E7EB',
                  backgroundColor: category === cat.id ? `${cat.color}15` : 'transparent',
                  alignItems: 'center'
                }}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={20} 
                  color={category === cat.id ? cat.color : '#6B7280'} 
                />
                <Text style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: '600',
                  color: category === cat.id ? cat.color : '#6B7280'
                }}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Difficulty & Points */}
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
            marginBottom: 16
          }}>
            Difficulty & Points
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {DIFFICULTY_LEVELS.map(diff => (
              <Pressable
                key={diff.id}
                onPress={() => setDifficulty(diff.id)}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: difficulty === diff.id ? diff.color : '#E5E7EB',
                  backgroundColor: difficulty === diff.id ? `${diff.color}15` : 'transparent',
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: difficulty === diff.id ? diff.color : '#6B7280',
                  marginBottom: 4
                }}>
                  {diff.name}
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: difficulty === diff.id ? diff.color : '#6B7280',
                  marginBottom: 2
                }}>
                  {diff.points} pts
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: '#6B7280',
                  textAlign: 'center'
                }}>
                  {diff.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Assignment */}
        <Animated.View 
          entering={FadeInUp.delay(400)}
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827'
            }}>
              Assign To
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => navigation.navigate('AddFriend' as any)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: '#10B981'
                }}
              >
                <Ionicons name="person-add" size={16} color="white" />
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('Import Contacts', 'Contact import feature coming soon!')}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: '#3B82F6'
                }}
              >
                <Ionicons name="people" size={16} color="white" />
              </Pressable>
            </View>
          </View>
          
          {/* Assign to yourself */}
          <Pressable
            onPress={() => setAssignedTo(currentUser?.id || '')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: 2,
              borderColor: assignedTo === currentUser?.id ? '#3B82F6' : '#E5E7EB',
              backgroundColor: assignedTo === currentUser?.id ? '#EBF5FF' : (isDark ? '#374151' : '#F9FAFB')
            }}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: assignedTo === currentUser?.id ? '#3B82F6' : '#6B7280',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {currentUser?.name.charAt(0) || 'Y'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500',
                color: isDark ? '#FFFFFF' : '#111827' 
              }}>
                {currentUser?.name || 'You'}
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: '#6B7280'
              }}>
                Assign to yourself
              </Text>
            </View>
            <Ionicons
              name={assignedTo === currentUser?.id ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color="#3B82F6"
            />
          </Pressable>
          
          {/* Friends list */}
          {friends.length > 0 ? (
            friends.map(friend => (
              <Pressable
                key={friend.id}
                onPress={() => setAssignedTo(friend.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 2,
                  borderColor: assignedTo === friend.id ? '#3B82F6' : '#E5E7EB',
                  backgroundColor: assignedTo === friend.id ? '#EBF5FF' : (isDark ? '#374151' : '#F9FAFB')
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: assignedTo === friend.id ? '#3B82F6' : '#6B7280',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ color: 'white', fontWeight: '600' }}>
                    {friend.name.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '500',
                    color: isDark ? '#FFFFFF' : '#111827' 
                  }}>
                    {friend.name}
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#6B7280'
                  }}>
                    {friend.email}
                  </Text>
                </View>
                <Ionicons
                  name={assignedTo === friend.id ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color="#3B82F6"
                />
              </Pressable>
            ))
          ) : (
            <View style={{
              padding: 20,
              alignItems: 'center',
              backgroundColor: isDark ? '#374151' : '#F9FAFB',
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#E5E7EB',
              borderStyle: 'dashed'
            }}>
              <Ionicons name="person-add-outline" size={48} color="#9CA3AF" />
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                color: '#9CA3AF',
                marginTop: 8,
                textAlign: 'center'
              }}>
                No friends added yet
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#6B7280',
                marginTop: 4,
                textAlign: 'center'
              }}>
                Add friends to assign chores to them
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Chore Preview */}
        {title.trim() && assignedTo && (
          <Animated.View 
            entering={FadeInUp.delay(500)}
            style={{ 
              backgroundColor: selectedCategory?.color + '15',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: selectedCategory?.color
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 12
            }}>
              Chore Preview
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons 
                name={selectedCategory?.icon as any} 
                size={20} 
                color={selectedCategory?.color} 
                style={{ marginRight: 8 }}
              />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold',
                color: isDark ? '#FFFFFF' : '#111827'
              }}>
                {title}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View 
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: selectedDifficulty?.color,
                  marginRight: 8
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                  {selectedDifficulty?.name.toUpperCase()}
                </Text>
              </View>
              <View 
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: '#F59E0B',
                  marginRight: 8
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                  {selectedDifficulty?.points} POINTS
                </Text>
              </View>
            </View>
            
            <Text style={{ 
              fontSize: 14, 
              color: isDark ? '#9CA3AF' : '#6B7280'
            }}>
              Assigned to: {assignedTo === currentUser?.id ? 'You' : friends.find(f => f.id === assignedTo)?.name || 'Unknown'}
            </Text>
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
              backgroundColor: selectedCategory?.color || '#3B82F6',
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'white' 
            }}>
              📋 Create Chore
            </Text>
          </Pressable>
        </View>
              </View>
      </View>
    </KeyboardAvoidingView>
  );
}