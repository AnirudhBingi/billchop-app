import React from 'react';
import { Pressable, Text, PressableProps } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useUserStore } from '../state/useUserStore';
import { cn } from '../utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

export default function AnimatedButton({
  title,
  variant = 'primary',
  size = 'md',
  className,
  icon,
  onPress,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const { settings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return cn(
          "bg-blue-500 border border-blue-500",
          disabled && "bg-gray-400 border-gray-400"
        );
      case 'secondary':
        return cn(
          isDark ? "bg-gray-700 border border-gray-600" : "bg-gray-100 border border-gray-200",
          disabled && "bg-gray-300 border-gray-300"
        );
      case 'outline':
        return cn(
          "bg-transparent border-2 border-blue-500",
          disabled && "border-gray-400"
        );
      case 'ghost':
        return "bg-transparent border border-transparent";
      default:
        return "bg-blue-500 border border-blue-500";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return "px-4 py-2 rounded-lg";
      case 'md':
        return "px-6 py-3 rounded-xl";
      case 'lg':
        return "px-8 py-4 rounded-2xl";
      default:
        return "px-6 py-3 rounded-xl";
    }
  };

  const getTextStyles = () => {
    const baseStyle = "font-semibold text-center";
    const sizeStyle = size === 'sm' ? "text-sm" : size === 'lg' ? "text-lg" : "text-base";
    
    let colorStyle = "";
    if (disabled) {
      colorStyle = "text-gray-500";
    } else {
      switch (variant) {
        case 'primary':
          colorStyle = "text-white";
          break;
        case 'secondary':
          colorStyle = isDark ? "text-white" : "text-gray-900";
          break;
        case 'outline':
          colorStyle = "text-blue-500";
          break;
        case 'ghost':
          colorStyle = isDark ? "text-white" : "text-gray-900";
          break;
        default:
          colorStyle = "text-white";
      }
    }
    
    return cn(baseStyle, sizeStyle, colorStyle);
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      className={cn(
        "flex-row items-center justify-center",
        getVariantStyles(),
        getSizeStyles(),
        disabled && "opacity-50",
        className
      )}
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...props}
    >
      {icon && <>{icon}</>}
      <Text className={getTextStyles()}>
        {title}
      </Text>
    </AnimatedPressable>
  );
}