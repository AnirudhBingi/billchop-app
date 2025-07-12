import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useUserStore } from '../state/useUserStore';
import { cn } from '../utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  intensity?: number;
  onPress?: () => void;
}

export default function GlassCard({ 
  children, 
  className, 
  style, 
  intensity = 20,
  onPress 
}: GlassCardProps) {
  const { settings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  return (
    <View 
      className={cn(
        "rounded-2xl overflow-hidden",
        isDark ? "bg-white/10" : "bg-white/20",
        className
      )}
      style={[
        {
          shadowColor: isDark ? '#FFFFFF' : '#000000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: isDark ? 0.1 : 0.15,
          shadowRadius: 12,
          elevation: 8,
        },
        style
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        className="flex-1 p-4"
      >
        {children}
      </BlurView>
    </View>
  );
}