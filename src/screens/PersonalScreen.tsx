import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '../state/useUserStore';
import GlassCard from '../components/GlassCard';

export default function PersonalScreen() {
  const insets = useSafeAreaInsets();
  const { settings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  return (
    <View 
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      style={{ paddingTop: insets.top }}
    >
      <View className="p-4">
        <Text className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Personal Finance
        </Text>
        
        <GlassCard>
          <View className="items-center py-8">
            <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Personal Expense Tracker
            </Text>
            <Text className={`text-sm opacity-70 text-center mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Track your personal expenses and income separately from shared expenses
            </Text>
          </View>
        </GlassCard>
      </View>
    </View>
  );
}