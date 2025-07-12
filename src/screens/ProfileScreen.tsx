import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../state/useUserStore';
import GlassCard from '../components/GlassCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  return (
    <View 
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{ paddingTop: insets.top }}
    >
      <View className="p-4">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Profile
        </Text>
        
        <GlassCard className="mb-4">
          <View className="items-center py-6">
            <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">
                {currentUser?.name.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentUser?.name || 'User'}
            </Text>
            <Text className={`text-sm opacity-70 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentUser?.email || 'user@email.com'}
            </Text>
          </View>
        </GlassCard>
        
        <GlassCard>
          <Pressable 
            onPress={() => navigation.navigate('Settings')}
            className="flex-row items-center justify-between p-2"
          >
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
              <Text className={`ml-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </Pressable>
        </GlassCard>
      </View>
    </View>
  );
}