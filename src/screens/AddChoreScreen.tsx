import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useChoreStore } from '../state/useChoreStore';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { Chore, ChoreCategory } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddChore'>;

export default function AddChoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const { addChore } = useChoreStore();
  
  const isDark = settings.theme === 'dark';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('10');
  
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a chore title.');
      return;
    }
    
    const chore: Chore = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      category: 'general_cleaning',
      groupId: 'default', // Mock group ID
      points: parseInt(points) || 10,
      isRecurring: false,
      status: 'pending',
    };
    
    addChore(chore);
    navigation.goBack();
  };
  
  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 p-4">
        <GlassCard className="mb-4">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Chore Details
          </Text>
          
          <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Title *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`p-3 rounded-xl mb-4 text-base ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'}`}
          />
          
          <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add details (optional)"
            multiline
            numberOfLines={2}
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`p-3 rounded-xl mb-4 text-base ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'}`}
          />
          
          <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Points
          </Text>
          <TextInput
            value={points}
            onChangeText={setPoints}
            placeholder="10"
            keyboardType="number-pad"
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            className={`p-3 rounded-xl mb-4 text-base ${isDark ? 'bg-gray-700 text-white border border-gray-600' : 'bg-white text-gray-900 border border-gray-200'}`}
          />
        </GlassCard>
      </ScrollView>
      
      <View className="p-4 pt-2">
        <View className="flex-row space-x-3">
          <AnimatedButton
            title="Cancel"
            variant="outline"
            className="flex-1"
            onPress={() => navigation.goBack()}
          />
          <AnimatedButton
            title="Add Chore"
            className="flex-1"
            onPress={handleSave}
          />
        </View>
      </View>
    </View>
  );
}