import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { RideShare } from '../types';
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

const RIDE_TEMPLATES = [
  { title: 'Airport Pickup/Drop', icon: '✈️', distance: 25, rate: 0.60 },
  { title: 'Grocery Run', icon: '🛒', distance: 8, rate: 0.50 },
  { title: 'Campus Commute', icon: '🎓', distance: 12, rate: 0.45 },
  { title: 'Mall/Shopping', icon: '🏬', distance: 15, rate: 0.55 },
  { title: 'Doctor Visit', icon: '🏥', distance: 10, rate: 0.50 },
  { title: 'Custom Ride', icon: '🚗', distance: 0, rate: 0.50 }
];

export default function CreateRideScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, friends } = useUserStore();
  const { addExpense } = useExpenseStore();
  
  const [rideDescription, setRideDescription] = useState('');
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
  const [costType, setCostType] = useState<'fixed' | 'per_mile'>('per_mile');
  const [fixedCost, setFixedCost] = useState('');
  const [distance, setDistance] = useState('');
  const [perMileRate, setPerMileRate] = useState('0.50');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const userId = currentUser?.id || '';
  const totalCost = costType === 'fixed' 
    ? parseFloat(fixedCost || '0') 
    : parseFloat(distance || '0') * parseFloat(perMileRate || '0');
  const costPerPerson = selectedPassengers.length > 0 ? totalCost / selectedPassengers.length : 0;

  const handleTemplateSelect = (template: typeof RIDE_TEMPLATES[0]) => {
    setRideDescription(template.title);
    setSelectedTemplate(template.title);
    if (template.distance > 0) {
      setDistance(template.distance.toString());
      setPerMileRate(template.rate.toString());
      setCostType('per_mile');
    }
  };

  const togglePassenger = (friendId: string) => {
    setSelectedPassengers(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSaveRide = () => {
    if (!rideDescription.trim()) {
      Alert.alert('Error', 'Please enter a ride description');
      return;
    }

    if (selectedPassengers.length === 0) {
      Alert.alert('Error', 'Please select at least one passenger');
      return;
    }

    if (totalCost <= 0) {
      Alert.alert('Error', 'Please enter a valid cost or distance');
      return;
    }

    // Create the ride expense
    const rideExpense = {
      id: Date.now().toString(),
      title: `🚗 ${rideDescription}`,
      description: `Ride expense - ${costType === 'fixed' ? `$${totalCost.toFixed(2)} total` : `${distance} miles @ $${perMileRate}/mile`}`,
      amount: totalCost,
      currency: 'USD',
      category: 'transportation',
      paidBy: userId,
      splitBetween: selectedPassengers,
      date: new Date(),
      createdAt: new Date(),
      isDraft: false
    };

    addExpense(rideExpense);

    Alert.alert(
      'Ride Logged Successfully!',
      `${rideDescription} - $${totalCost.toFixed(2)} split between ${selectedPassengers.length} passenger${selectedPassengers.length > 1 ? 's' : ''}`,
      [
        {
          text: 'View Expenses',
          onPress: () => navigation.navigate('MainTabs', { screen: 'Split' })
        },
        {
          text: 'Add Another',
          onPress: () => {
            setRideDescription('');
            setSelectedPassengers([]);
            setFixedCost('');
            setDistance('');
            setSelectedTemplate(null);
          }
        },
        {
          text: 'Done',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: THEME_COLORS.background,
        paddingTop: insets.top 
      }}
    >
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp} className="flex-row items-center mb-6">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-4 p-2 rounded-full"
            style={{ backgroundColor: THEME_COLORS.surface }}
          >
            <Ionicons name="arrow-back" size={24} color={THEME_COLORS.text} />
          </Pressable>
          <Text className="text-2xl font-bold" style={{ color: THEME_COLORS.text }}>
            🚗 Log New Ride
          </Text>
        </Animated.View>

        {/* Quick Templates */}
        <Animated.View 
          entering={FadeInUp.delay(100)}
          className="mb-6"
        >
          <Text className="text-lg font-bold mb-4" style={{ color: THEME_COLORS.text }}>
            Quick Templates
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {RIDE_TEMPLATES.map((template, index) => (
              <Pressable
                key={template.title}
                onPress={() => handleTemplateSelect(template)}
                className="rounded-xl p-3 flex-1 min-w-[45%]"
                style={{
                  backgroundColor: selectedTemplate === template.title ? THEME_COLORS.primary + '15' : THEME_COLORS.surface,
                  borderWidth: 1,
                  borderColor: selectedTemplate === template.title ? THEME_COLORS.primary : THEME_COLORS.border
                }}
              >
                <Text className="text-lg mb-1">{template.icon}</Text>
                <Text 
                  className="font-medium text-sm"
                  style={{ color: THEME_COLORS.text }}
                >
                  {template.title}
                </Text>
                {template.distance > 0 && (
                  <Text 
                    className="text-xs mt-1"
                    style={{ color: THEME_COLORS.textSecondary }}
                  >
                    ~{template.distance} miles
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Ride Details */}
        <Animated.View 
          entering={FadeInUp.delay(200)}
          className="rounded-2xl p-4 mb-6"
          style={{ 
            backgroundColor: THEME_COLORS.card,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: THEME_COLORS.border
          }}
        >
          <Text className="text-lg font-bold mb-4" style={{ color: THEME_COLORS.text }}>
            Ride Details
          </Text>
          
          <View className="mb-4">
            <Text className="font-medium mb-2" style={{ color: THEME_COLORS.text }}>
              Description *
            </Text>
            <TextInput
              value={rideDescription}
              onChangeText={setRideDescription}
              placeholder="e.g., Airport pickup, Grocery run"
              placeholderTextColor={THEME_COLORS.textLight}
              className="rounded-xl p-4"
              style={{
                backgroundColor: THEME_COLORS.surface,
                borderWidth: 1,
                borderColor: THEME_COLORS.border,
                color: THEME_COLORS.text
              }}
            />
          </View>

          {/* Cost Type Selection */}
          <Text className="font-medium mb-3" style={{ color: THEME_COLORS.text }}>
            Pricing Mode
          </Text>
          <View className="flex-row gap-3 mb-4">
            <Pressable
              onPress={() => setCostType('per_mile')}
              className="flex-1 rounded-xl p-3"
              style={{
                backgroundColor: costType === 'per_mile' ? THEME_COLORS.primary + '15' : THEME_COLORS.surface,
                borderWidth: 1,
                borderColor: costType === 'per_mile' ? THEME_COLORS.primary : THEME_COLORS.border
              }}
            >
              <Text 
                className="font-medium text-center"
                style={{ color: costType === 'per_mile' ? THEME_COLORS.primary : THEME_COLORS.text }}
              >
                📏 Per Mile
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setCostType('fixed')}
              className="flex-1 rounded-xl p-3"
              style={{
                backgroundColor: costType === 'fixed' ? THEME_COLORS.primary + '15' : THEME_COLORS.surface,
                borderWidth: 1,
                borderColor: costType === 'fixed' ? THEME_COLORS.primary : THEME_COLORS.border
              }}
            >
              <Text 
                className="font-medium text-center"
                style={{ color: costType === 'fixed' ? THEME_COLORS.primary : THEME_COLORS.text }}
              >
                💰 Fixed Rate
              </Text>
            </Pressable>
          </View>

          {/* Cost Input */}
          {costType === 'per_mile' ? (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: THEME_COLORS.text }}>
                  Distance (miles) *
                </Text>
                <TextInput
                  value={distance}
                  onChangeText={setDistance}
                  placeholder="25"
                  keyboardType="decimal-pad"
                  placeholderTextColor={THEME_COLORS.textLight}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: THEME_COLORS.surface,
                    borderWidth: 1,
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.text
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="font-medium mb-2" style={{ color: THEME_COLORS.text }}>
                  Rate per mile *
                </Text>
                <View className="flex-row items-center">
                  <Text 
                    className="mr-2 font-bold"
                    style={{ color: THEME_COLORS.primary }}
                  >
                    $
                  </Text>
                  <TextInput
                    value={perMileRate}
                    onChangeText={setPerMileRate}
                    placeholder="0.50"
                    keyboardType="decimal-pad"
                    placeholderTextColor={THEME_COLORS.textLight}
                    className="flex-1 rounded-xl p-4"
                    style={{
                      backgroundColor: THEME_COLORS.surface,
                      borderWidth: 1,
                      borderColor: THEME_COLORS.border,
                      color: THEME_COLORS.text
                    }}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text className="font-medium mb-2" style={{ color: THEME_COLORS.text }}>
                Fixed Cost *
              </Text>
              <View className="flex-row items-center">
                <Text 
                  className="mr-2 font-bold"
                  style={{ color: THEME_COLORS.primary }}
                >
                  $
                </Text>
                <TextInput
                  value={fixedCost}
                  onChangeText={setFixedCost}
                  placeholder="25.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={THEME_COLORS.textLight}
                  className="flex-1 rounded-xl p-4"
                  style={{
                    backgroundColor: THEME_COLORS.surface,
                    borderWidth: 1,
                    borderColor: THEME_COLORS.border,
                    color: THEME_COLORS.text
                  }}
                />
              </View>
            </View>
          )}
        </Animated.View>

        {/* Passenger Selection */}
        <Animated.View 
          entering={FadeInUp.delay(300)}
          className="rounded-2xl p-4 mb-6"
          style={{ 
            backgroundColor: THEME_COLORS.card,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: THEME_COLORS.border
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold" style={{ color: THEME_COLORS.text }}>
              Select Passengers ({selectedPassengers.length})
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => navigation.navigate('AddFriend')}
                className="flex-row items-center rounded-lg px-3 py-2"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <Ionicons name="person-add" size={16} color={THEME_COLORS.primary} />
                <Text 
                  className="ml-1 text-sm font-medium"
                  style={{ color: THEME_COLORS.primary }}
                >
                  Add Friend
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  // Invite from contacts functionality
                  Alert.alert('Invite Friends', 'This feature will allow you to invite friends from your contacts to join BillChop.');
                }}
                className="flex-row items-center rounded-lg px-3 py-2"
                style={{ backgroundColor: THEME_COLORS.secondary + '15' }}
              >
                <Ionicons name="mail" size={16} color={THEME_COLORS.secondary} />
                <Text 
                  className="ml-1 text-sm font-medium"
                  style={{ color: THEME_COLORS.secondary }}
                >
                  Invite
                </Text>
              </Pressable>
            </View>
          </View>
          
          {friends.length > 0 ? (
            friends.map(friend => (
              <Pressable
                key={friend.id}
                onPress={() => togglePassenger(friend.id)}
                className="flex-row items-center justify-between py-3 border-b"
                style={{ borderColor: THEME_COLORS.divider }}
              >
                <View className="flex-row items-center flex-1">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <Text className="text-white font-bold">
                      {friend.name.charAt(0)}
                    </Text>
                  </View>
                  <Text 
                    className="font-medium"
                    style={{ color: THEME_COLORS.text }}
                  >
                    {friend.name}
                  </Text>
                </View>
                <View 
                  className="w-6 h-6 rounded-full border-2 items-center justify-center"
                  style={{ 
                    borderColor: selectedPassengers.includes(friend.id) ? THEME_COLORS.primary : THEME_COLORS.border,
                    backgroundColor: selectedPassengers.includes(friend.id) ? THEME_COLORS.primary : 'transparent'
                  }}
                >
                  {selectedPassengers.includes(friend.id) && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
              </Pressable>
            ))
          ) : (
            <View className="items-center py-8">
              <View 
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <Ionicons name="people-outline" size={32} color={THEME_COLORS.textLight} />
              </View>
              <Text 
                className="text-center font-medium mb-2"
                style={{ color: THEME_COLORS.text }}
              >
                No friends added yet
              </Text>
              <Text 
                className="text-center text-sm mb-4"
                style={{ color: THEME_COLORS.textSecondary }}
              >
                Add friends to split ride costs with them
              </Text>
              <Pressable
                onPress={() => navigation.navigate('AddFriend')}
                className="rounded-xl px-4 py-2"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <Text className="text-white font-semibold">Add Your First Friend</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Cost Summary */}
        {totalCost > 0 && selectedPassengers.length > 0 && (
          <Animated.View 
            entering={FadeInUp.delay(400)}
            className="rounded-2xl p-4 mb-6"
            style={{ 
              backgroundColor: THEME_COLORS.success + '10',
              borderWidth: 1,
              borderColor: THEME_COLORS.success
            }}
          >
            <Text className="text-lg font-bold mb-3" style={{ color: THEME_COLORS.success }}>
              💰 Cost Summary
            </Text>
            <View className="flex-row justify-between items-center mb-2">
              <Text style={{ color: THEME_COLORS.text }}>Total Cost:</Text>
              <Text className="font-bold" style={{ color: THEME_COLORS.success }}>
                ${totalCost.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text style={{ color: THEME_COLORS.text }}>Passengers:</Text>
              <Text className="font-bold" style={{ color: THEME_COLORS.text }}>
                {selectedPassengers.length}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text style={{ color: THEME_COLORS.text }}>Cost per person:</Text>
              <Text className="font-bold" style={{ color: THEME_COLORS.success }}>
                ${costPerPerson.toFixed(2)}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View 
        className="absolute bottom-0 left-0 right-0 p-5"
        style={{ 
          backgroundColor: THEME_COLORS.background,
          borderTopWidth: 1,
          borderTopColor: THEME_COLORS.border
        }}
      >
        <Pressable
          onPress={handleSaveRide}
          className="rounded-2xl p-4"
          style={{ backgroundColor: THEME_COLORS.primary }}
        >
          <Text className="text-white font-bold text-center text-lg">
            💾 Log Ride - ${totalCost.toFixed(2)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}