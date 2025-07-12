import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { useChoreStore } from '../state/useChoreStore';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { cn } from '../utils/cn';
import { format } from 'date-fns';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings, friends } = useUserStore();
  const { expenses, getTotalOwed, getTotalOwing } = useExpenseStore();
  const { getUserPoints, getUserRank } = useChoreStore();
  const isDark = settings.theme === 'dark';
  
  if (!currentUser) return null;
  
  const totalOwed = getTotalOwed(currentUser.id);
  const totalOwing = getTotalOwing(currentUser.id);
  const userPoints = getUserPoints(currentUser.id);
  const userRank = getUserRank(currentUser.id);
  const myExpenses = expenses.filter(e => e.paidBy === currentUser.id).length;
  const memberSince = format(new Date(currentUser.createdAt), 'MMMM yyyy');

  const StatCard = ({ title, value, icon, color = "#3B82F6" }: {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
  }) => (
    <GlassCard className="flex-1 mx-1">
      <View className="items-center py-4">
        <Ionicons name={icon} size={24} color={color} />
        <Text className={cn(
          "text-xs opacity-70 mt-2 text-center",
          isDark ? "text-white" : "text-gray-900"
        )}>
          {title}
        </Text>
        <Text className={cn(
          "text-lg font-bold mt-1",
          isDark ? "text-white" : "text-gray-900"
        )}>
          {value}
        </Text>
      </View>
    </GlassCard>
  );

  const MenuButton = ({ icon, title, onPress, showChevron = true, color }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    onPress: () => void;
    showChevron?: boolean;
    color?: string;
  }) => (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center justify-between p-4 border-b border-gray-200/10"
    >
      <View className="flex-row items-center">
        <Ionicons 
          name={icon} 
          size={24} 
          color={color || (isDark ? '#FFFFFF' : '#111827')} 
        />
        <Text className={cn(
          "ml-4 font-medium text-base",
          isDark ? "text-white" : "text-gray-900"
        )}>
          {title}
        </Text>
      </View>
      {showChevron && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isDark ? '#9CA3AF' : '#6B7280'} 
        />
      )}
    </Pressable>
  );

  const handleInviteFriend = () => {
    Alert.alert(
      'Invite Friends',
      'Share BillChop with your roommates and friends to start splitting expenses together!',
      [
        { text: 'Share Link', onPress: () => console.log('Share functionality') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your expense and chore data to CSV or PDF format.',
      [
        { text: 'Export CSV', onPress: () => console.log('Export CSV') },
        { text: 'Export PDF', onPress: () => console.log('Export PDF') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'Need help? Contact our support team or check out the FAQ.',
      [
        { text: 'Contact Support', onPress: () => console.log('Contact support') },
        { text: 'FAQ', onPress: () => console.log('Open FAQ') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View 
      className={cn(
        "flex-1",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className={cn(
            "text-2xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Profile
          </Text>
          <Pressable onPress={() => navigation.navigate('Settings')}>
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={isDark ? "#FFFFFF" : "#111827"} 
            />
          </Pressable>
        </View>
        
        {/* Profile Info */}
        <GlassCard className="mb-6">
          <View className="items-center py-6">
            <View className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-4 shadow-lg">
              <Text className="text-white text-3xl font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className={cn(
              "text-2xl font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {currentUser.name}
            </Text>
            <Text className={cn(
              "text-sm opacity-70 mt-1",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {currentUser.email}
            </Text>
            <Text className={cn(
              "text-xs opacity-60 mt-2",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Member since {memberSince}
            </Text>
          </View>
        </GlassCard>

        {/* Stats Overview */}
        <View className="flex-row mb-6">
          <StatCard 
            title="Expenses Paid" 
            value={myExpenses} 
            icon="receipt-outline"
            color="#10B981"
          />
          <StatCard 
            title="Chore Points" 
            value={userPoints} 
            icon="trophy-outline"
            color="#F59E0B"
          />
          <StatCard 
            title="Leaderboard" 
            value={userRank > 0 ? `#${userRank}` : '-'} 
            icon="podium-outline"
            color="#8B5CF6"
          />
        </View>

        {/* Balance Summary */}
        <GlassCard className="mb-6">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Balance Summary
          </Text>
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className={cn(
                "text-sm opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                You owe
              </Text>
              <Text className="text-xl font-bold text-red-500 mt-1">
                ${totalOwing.toFixed(2)}
              </Text>
            </View>
            <View className="w-px h-12 bg-gray-300/30 mx-4" />
            <View className="flex-1 items-end">
              <Text className={cn(
                "text-sm opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                You're owed
              </Text>
              <Text className="text-xl font-bold text-green-500 mt-1">
                ${totalOwed.toFixed(2)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Friends & Groups */}
        <GlassCard className="mb-6">
          <Text className={cn(
            "text-lg font-semibold mb-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Social
          </Text>
          <View className="flex-row items-center justify-between mb-3">
            <Text className={cn(
              "font-medium",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Friends: {friends.length}
            </Text>
            <AnimatedButton
              title="Invite"
              size="sm"
              variant="outline"
              onPress={handleInviteFriend}
            />
          </View>
          <Text className={cn(
            "text-sm opacity-70",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Invite more friends to split expenses and share chores
          </Text>
        </GlassCard>

        {/* Menu Options */}
        <GlassCard className="mb-6">
          <Text className={cn(
            "text-lg font-semibold mb-4 px-4 pt-4",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Account
          </Text>
          
          <MenuButton
            icon="person-outline"
            title="Edit Profile"
            onPress={() => Alert.alert('Feature Coming Soon', 'Profile editing will be available in the next update!')}
          />
          
          <MenuButton
            icon="card-outline"
            title="Payment Methods"
            onPress={() => Alert.alert('Feature Coming Soon', 'Payment method management coming soon!')}
          />
          
          <MenuButton
            icon="notifications-outline"
            title="Notifications"
            onPress={() => navigation.navigate('Settings')}
          />
          
          <MenuButton
            icon="download-outline"
            title="Export Data"
            onPress={handleExportData}
          />
          
          <MenuButton
            icon="help-circle-outline"
            title="Help & Support"
            onPress={handleSupport}
          />
          
          <MenuButton
            icon="information-circle-outline"
            title="About BillChop"
            onPress={() => Alert.alert('BillChop v1.0', 'The smart way to manage shared expenses and chores for students and roommates.')}
            showChevron={false}
          />
        </GlassCard>

        {/* App Info */}
        <View className="items-center pb-8">
          <Text className={cn(
            "text-xs opacity-50",
            isDark ? "text-white" : "text-gray-900"
          )}>
            BillChop v1.0.0 • Made for students
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}