import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { Group } from '../types';

export default function CreateGroupScreen() {
  const navigation = useNavigation();
  const { currentUser, settings, friends } = useUserStore();
  const { addGroup } = useExpenseStore();
  const isDark = settings.theme === 'dark';
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUser?.id || '']);
  const [groupType, setGroupType] = useState<'apartment' | 'trip' | 'event' | 'other'>('apartment');

  const groupTypes = [
    { id: 'apartment', name: 'Apartment/House', icon: 'home', color: '#3B82F6' },
    { id: 'trip', name: 'Trip/Vacation', icon: 'airplane', color: '#10B981' },
    { id: 'event', name: 'Event/Party', icon: 'musical-notes', color: '#F59E0B' },
    { id: 'other', name: 'Other', icon: 'people', color: '#8B5CF6' }
  ];

  const toggleMember = (friendId: string) => {
    setSelectedMembers(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedMembers.length < 2) {
      Alert.alert('Error', 'A group needs at least 2 members (including you)');
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: groupName.trim(),
      description: description.trim(),
      members: selectedMembers,
      createdBy: currentUser?.id || '',
      createdAt: new Date(),
      isActive: true,
      type: groupType,
      currency: 'USD',
      settings: {
        allowMemberExpenses: true,
        requireApproval: false,
        splitMethod: 'equal'
      }
    };

    addGroup(newGroup);
    
    Alert.alert(
      'Group Created!', 
      `"${groupName}" has been created with ${selectedMembers.length} members.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const selectedTypeData = groupTypes.find(t => t.id === groupType);

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
            🏠 Create Group
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Set up a new expense sharing group
          </Text>
        </View>

        {/* Group Type Selection */}
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
            What type of group is this?
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {groupTypes.map(type => (
              <Pressable
                key={type.id}
                onPress={() => setGroupType(type.id as any)}
                style={{
                  flex: 1,
                  minWidth: '45%',
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: groupType === type.id ? type.color : '#E5E7EB',
                  backgroundColor: groupType === type.id ? `${type.color}15` : 'transparent',
                  alignItems: 'center'
                }}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={24} 
                  color={groupType === type.id ? type.color : '#6B7280'} 
                />
                <Text style={{
                  marginTop: 8,
                  fontWeight: '600',
                  color: groupType === type.id ? type.color : '#6B7280',
                  textAlign: 'center',
                  fontSize: 12
                }}>
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Group Details */}
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
            Group Details
          </Text>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 8
            }}>
              Group Name *
            </Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder={`Enter ${selectedTypeData?.name.toLowerCase()} name`}
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
              placeholder="Add a description for your group"
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
        </View>

        {/* Member Selection */}
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827'
            }}>
              Add Members ({selectedMembers.length} selected)
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
          
          {/* Current user (always included) */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderRadius: 12,
            marginBottom: 8,
            borderWidth: 2,
            borderColor: '#3B82F6',
            backgroundColor: '#EBF5FF'
          }}>
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
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500',
                color: isDark ? '#FFFFFF' : '#111827' 
              }}>
                {currentUser?.name || 'You'} (Admin)
              </Text>
              <Text style={{ 
                fontSize: 12, 
                color: '#6B7280'
              }}>
                Group creator
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
          </View>
          
          {/* Friends list */}
          {friends.length > 0 ? (
            friends.map(friend => (
              <Pressable
                key={friend.id}
                onPress={() => toggleMember(friend.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 2,
                  borderColor: selectedMembers.includes(friend.id) ? '#3B82F6' : '#E5E7EB',
                  backgroundColor: selectedMembers.includes(friend.id) ? 
                    '#EBF5FF' : (isDark ? '#374151' : '#F9FAFB')
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: selectedMembers.includes(friend.id) ? '#3B82F6' : '#6B7280',
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
                  name={selectedMembers.includes(friend.id) ? 
                    "checkmark-circle" : "ellipse-outline"}
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
                Add friends first to create a group
              </Text>
            </View>
          )}
        </View>

        {/* Group Preview */}
        {groupName.trim() && selectedMembers.length > 1 && (
          <View style={{ 
            backgroundColor: selectedTypeData?.color + '15',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: selectedTypeData?.color
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons 
                name={selectedTypeData?.icon as any} 
                size={24} 
                color={selectedTypeData?.color} 
                style={{ marginRight: 12 }}
              />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: isDark ? '#FFFFFF' : '#111827'
              }}>
                {groupName}
              </Text>
            </View>
            <Text style={{ 
              fontSize: 14, 
              color: isDark ? '#9CA3AF' : '#6B7280',
              marginBottom: 8
            }}>
              {selectedTypeData?.name} • {selectedMembers.length} members
            </Text>
            {description.trim() && (
              <Text style={{ 
                fontSize: 14, 
                color: isDark ? '#9CA3AF' : '#6B7280',
                fontStyle: 'italic'
              }}>
                "{description}"
              </Text>
            )}
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
            onPress={handleCreateGroup}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              backgroundColor: selectedTypeData?.color || '#3B82F6',
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'white' 
            }}>
              🏠 Create Group
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}