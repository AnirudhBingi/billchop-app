import React from 'react';
import { View, Text } from 'react-native';
import { useUserStore } from '../state/useUserStore';
import GlassCard from '../components/GlassCard';

export default function GroupDetailScreen() {
  const { settings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  return (
    <View className={`flex-1 p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <GlassCard>
        <View className="items-center py-8">
          <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Group Details
          </Text>
          <Text className={`text-sm opacity-70 text-center mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            View and manage group expenses and members
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}