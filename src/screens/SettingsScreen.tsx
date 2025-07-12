import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../state/useUserStore';
import GlassCard from '../components/GlassCard';

export default function SettingsScreen() {
  const { settings, updateSettings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  const toggleTheme = () => {
    updateSettings({
      theme: isDark ? 'light' : 'dark'
    });
  };
  
  return (
    <View className={`flex-1 p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <GlassCard className="mb-4">
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Appearance
        </Text>
        
        <Pressable
          onPress={toggleTheme}
          className="flex-row items-center justify-between p-2"
        >
          <View className="flex-row items-center">
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={24} color={isDark ? '#FFFFFF' : '#111827'} />
            <Text className={`ml-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Ionicons
            name={isDark ? 'toggle' : 'toggle-outline'}
            size={32}
            color={isDark ? '#3B82F6' : '#6B7280'}
          />
        </Pressable>
      </GlassCard>
      
      <GlassCard>
        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Currency
        </Text>
        
        <View className="p-2">
          <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Primary Currency: {settings.primaryCurrency}
          </Text>
          <Text className={`text-sm opacity-70 mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Home Currency: {settings.homeCurrency}
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}