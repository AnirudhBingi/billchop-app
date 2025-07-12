import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { format } from 'date-fns';
import Animated, { FadeInUp } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Refined Color Palette
const THEME_COLORS = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  primary: '#6366F1',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#F3F4F6'
};

export default function RideLogScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, friends } = useUserStore();
  const { expenses } = useExpenseStore();
  
  const [selectedTab, setSelectedTab] = useState<'recent' | 'favorites'>('recent');

  // Get ride-related expenses
  const rideExpenses = expenses.filter(e => 
    e.category === 'transportation' && 
    e.title.includes('🚗')
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Mock favorite riders data - in real app this would come from user preferences
  const [favoriteRiders] = useState([
    { id: '1', name: 'Sarah Chen', avatar: '👩🏻‍💼', rides: 12, totalAmount: 245.50, commonTrips: ['Airport', 'Grocery'] },
    { id: '2', name: 'Mike Rodriguez', avatar: '👨🏽‍🎓', rides: 8, totalAmount: 120.00, commonTrips: ['Campus', 'Mall'] },
    { id: '3', name: 'Emma Wilson', avatar: '👩🏼‍🦰', rides: 15, totalAmount: 380.25, commonTrips: ['Doctor', 'Grocery'] },
    { id: '4', name: 'David Kim', avatar: '👨🏻‍💻', rides: 6, totalAmount: 95.75, commonTrips: ['Airport', 'Campus'] }
  ]);

  const RideExpenseItem = ({ expense }: { expense: any }) => (
    <View 
      className="rounded-xl p-4 mb-3"
      style={{ 
        backgroundColor: THEME_COLORS.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: THEME_COLORS.border
      }}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text 
          className="font-semibold flex-1"
          style={{ color: THEME_COLORS.text }}
        >
          {expense.title}
        </Text>
        <Text 
          className="font-bold"
          style={{ color: THEME_COLORS.primary }}
        >
          ${expense.amount.toFixed(2)}
        </Text>
      </View>
      
      <Text 
        className="text-sm mb-2"
        style={{ color: THEME_COLORS.textSecondary }}
      >
        {expense.description}
      </Text>
      
      <View className="flex-row justify-between items-center">
        <Text 
          className="text-xs"
          style={{ color: THEME_COLORS.textLight }}
        >
          {format(new Date(expense.date), 'MMM dd, yyyy')}
        </Text>
        <Text 
          className="text-xs"
          style={{ color: THEME_COLORS.textLight }}
        >
          Split between {expense.splitBetween.length} people
        </Text>
      </View>
    </View>
  );

  const FavoriteRiderItem = ({ rider }: { rider: any }) => (
    <View 
      className="rounded-xl p-4 mb-3"
      style={{ 
        backgroundColor: THEME_COLORS.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: THEME_COLORS.border
      }}
    >
      <View className="flex-row items-center mb-3">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          <Text className="text-lg">{rider.avatar}</Text>
        </View>
        <View className="flex-1">
          <Text 
            className="font-semibold"
            style={{ color: THEME_COLORS.text }}
          >
            {rider.name}
          </Text>
          <Text 
            className="text-sm"
            style={{ color: THEME_COLORS.textSecondary }}
          >
            {rider.rides} rides • ${rider.totalAmount.toFixed(2)} total
          </Text>
        </View>
        <Pressable
          onPress={() => {
            // Quick ride with this person
            navigation.navigate('CreateRide');
          }}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: THEME_COLORS.primary }}
        >
          <Ionicons name="add" size={16} color="white" />
        </Pressable>
      </View>
      
      <View className="flex-row gap-2">
        {rider.commonTrips.map((trip: string, index: number) => (
          <View 
            key={index}
            className="rounded-lg px-2 py-1"
            style={{ backgroundColor: THEME_COLORS.surface }}
          >
            <Text 
              className="text-xs"
              style={{ color: THEME_COLORS.textSecondary }}
            >
              {trip}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: THEME_COLORS.background,
        paddingTop: insets.top 
      }}
    >
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="mr-4 p-2 rounded-full"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          <Ionicons name="arrow-back" size={24} color={THEME_COLORS.text} />
        </Pressable>
        <Text className="text-2xl font-bold flex-1" style={{ color: THEME_COLORS.text }}>
          🚗 Ride History
        </Text>
        <Pressable
          onPress={() => navigation.navigate('CreateRide')}
          className="p-2 rounded-full"
          style={{ backgroundColor: THEME_COLORS.primary }}
        >
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      {/* Tab Selector */}
      <View className="px-6 mb-4">
        <View 
          className="flex-row rounded-xl p-1"
          style={{ backgroundColor: THEME_COLORS.surface }}
        >
          {(['recent', 'favorites'] as const).map(tab => (
            <Pressable
              key={tab}
              className="flex-1 py-2 rounded-lg items-center"
              style={{
                backgroundColor: selectedTab === tab ? THEME_COLORS.primary : 'transparent'
              }}
              onPress={() => setSelectedTab(tab)}
            >
              <Text 
                className="font-medium"
                style={{
                  color: selectedTab === tab ? 'white' : THEME_COLORS.text
                }}
              >
                {tab === 'recent' ? '📋 Recent Rides' : '⭐ Favorites'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {selectedTab === 'recent' ? (
          <>
            {rideExpenses.length > 0 ? (
              <FlatList
                data={rideExpenses}
                renderItem={({ item }) => <RideExpenseItem expense={item} />}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Animated.View 
                entering={FadeInUp}
                className="items-center py-12"
              >
                <View 
                  className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: THEME_COLORS.surface }}
                >
                  <Ionicons name="car-outline" size={32} color={THEME_COLORS.textLight} />
                </View>
                <Text 
                  className="text-lg font-semibold mb-2"
                  style={{ color: THEME_COLORS.text }}
                >
                  No rides logged yet
                </Text>
                <Text 
                  className="text-center mb-6"
                  style={{ color: THEME_COLORS.textSecondary }}
                >
                  Start logging rides with friends to track and split transportation costs
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('CreateRide')}
                  className="rounded-xl px-6 py-3"
                  style={{ backgroundColor: THEME_COLORS.primary }}
                >
                  <Text className="text-white font-semibold">Log Your First Ride</Text>
                </Pressable>
              </Animated.View>
            )}
          </>
        ) : (
          <FlatList
            data={favoriteRiders}
            renderItem={({ item }) => <FavoriteRiderItem rider={item} />}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}