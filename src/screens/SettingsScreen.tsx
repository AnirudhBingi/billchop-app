import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useNotificationStore } from '../state/useNotificationStore';
import Animated, { FadeInUp } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Enhanced Color Palette
const THEME_COLORS = {
  background: '#0A0A0B',
  surface: '#1A1A1D',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#9CA3AF'
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings, updateSettings } = useUserStore();
  const { 
    settings: notificationSettings, 
    updateSettings: updateNotificationSettings,
    updateCategorySettings,
    clearAllNotifications 
  } = useNotificationStore();
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SettingsSection = ({ 
    title, 
    icon, 
    children, 
    sectionKey,
    color = THEME_COLORS.primary 
  }: {
    title: string;
    icon: string;
    children: React.ReactNode;
    sectionKey: string;
    color?: string;
  }) => (
    <Animated.View 
      entering={FadeInUp}
      className="mb-4"
      style={{ backgroundColor: THEME_COLORS.surface, borderRadius: 16 }}
    >
      <Pressable
        onPress={() => toggleSection(sectionKey)}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: color + '20' }}
          >
            <Ionicons name={icon as any} size={20} color={color} />
          </View>
          <Text className="text-lg font-semibold" style={{ color: THEME_COLORS.white }}>
            {title}
          </Text>
        </View>
        <Ionicons 
          name={expandedSection === sectionKey ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={THEME_COLORS.gray} 
        />
      </Pressable>
      
      {expandedSection === sectionKey && (
        <View className="px-4 pb-4">
          {children}
        </View>
      )}
    </Animated.View>
  );

  const SettingsItem = ({ 
    title, 
    description, 
    value, 
    onToggle, 
    type = 'switch' 
  }: {
    title: string;
    description?: string;
    value?: boolean;
    onToggle?: (value: boolean) => void;
    type?: 'switch' | 'button';
  }) => (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-700">
      <View className="flex-1 mr-3">
        <Text className="font-medium" style={{ color: THEME_COLORS.white }}>
          {title}
        </Text>
        {description && (
          <Text className="text-sm mt-1" style={{ color: THEME_COLORS.gray }}>
            {description}
          </Text>
        )}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#374151', true: THEME_COLORS.primary + '50' }}
          thumbColor={value ? THEME_COLORS.primary : '#9CA3AF'}
        />
      )}
    </View>
  );

  return (
    <View 
      className="flex-1"
      style={{ 
        backgroundColor: THEME_COLORS.background,
        paddingTop: insets.top 
      }}
    >
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-4 p-2 rounded-full"
            style={{ backgroundColor: THEME_COLORS.surface }}
          >
            <Ionicons name="arrow-back" size={24} color={THEME_COLORS.white} />
          </Pressable>
          <Text className="text-2xl font-bold" style={{ color: THEME_COLORS.white }}>
            Settings
          </Text>
        </View>

        {/* Profile Section */}
        <SettingsSection
          title="Profile & Account"
          icon="person"
          sectionKey="profile"
          color={THEME_COLORS.primary}
        >
          <View className="space-y-3">
            <View className="flex-row items-center py-3">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <Text className="text-white font-bold text-lg">
                  {currentUser?.name?.charAt(0) || 'A'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold" style={{ color: THEME_COLORS.white }}>
                  {currentUser?.name || 'Alex Student'}
                </Text>
                <Text className="text-sm" style={{ color: THEME_COLORS.gray }}>
                  {currentUser?.email || 'alex@example.com'}
                </Text>
              </View>
            </View>
            
            <SettingsItem
              title="Edit Profile"
              description="Update your name, email, and profile picture"
              type="button"
            />
            <SettingsItem
              title="Privacy Settings"
              description="Control who can see your expenses and activities"
              type="button"
            />
          </View>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection
          title="Notifications"
          icon="notifications"
          sectionKey="notifications"
          color={THEME_COLORS.secondary}
        >
          <SettingsItem
            title="Enable Notifications"
            description="Turn on/off all notifications"
            value={notificationSettings.enabled}
            onToggle={(value) => updateNotificationSettings({ enabled: value })}
          />
          
          {notificationSettings.enabled && (
            <>
              <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: THEME_COLORS.white }}>
                📊 Expense Notifications
              </Text>
              <SettingsItem
                title="New Expenses"
                description="When someone adds a new expense"
                value={notificationSettings.expenses.newExpense}
                onToggle={(value) => updateCategorySettings('expenses', { ...notificationSettings.expenses, newExpense: value })}
              />
              <SettingsItem
                title="Payment Reminders"
                description="Reminders to pay your share"
                value={notificationSettings.expenses.paymentReminder}
                onToggle={(value) => updateCategorySettings('expenses', { ...notificationSettings.expenses, paymentReminder: value })}
              />
              <SettingsItem
                title="Weekly Reports"
                description="Summary of your weekly expenses"
                value={notificationSettings.expenses.weeklyReport}
                onToggle={(value) => updateCategorySettings('expenses', { ...notificationSettings.expenses, weeklyReport: value })}
              />

              <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: THEME_COLORS.white }}>
                ✅ Chore Notifications
              </Text>
              <SettingsItem
                title="Chore Assignments"
                description="When you're assigned a new chore"
                value={notificationSettings.chores.choreAssigned}
                onToggle={(value) => updateCategorySettings('chores', { ...notificationSettings.chores, choreAssigned: value })}
              />
              <SettingsItem
                title="Chore Completions"
                description="When others complete chores"
                value={notificationSettings.chores.choreCompleted}
                onToggle={(value) => updateCategorySettings('chores', { ...notificationSettings.chores, choreCompleted: value })}
              />
              <SettingsItem
                title="Overdue Reminders"
                description="Reminders for overdue chores"
                value={notificationSettings.chores.choreOverdue}
                onToggle={(value) => updateCategorySettings('chores', { ...notificationSettings.chores, choreOverdue: value })}
              />
              <SettingsItem
                title="Points Earned"
                description="When you earn chore points"
                value={notificationSettings.chores.pointsEarned}
                onToggle={(value) => updateCategorySettings('chores', { ...notificationSettings.chores, pointsEarned: value })}
              />

              <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: THEME_COLORS.white }}>
                💰 Budget Notifications
              </Text>
              <SettingsItem
                title="Budget Warnings"
                description="When you're close to budget limits"
                value={notificationSettings.budgets.budgetWarning}
                onToggle={(value) => updateCategorySettings('budgets', { ...notificationSettings.budgets, budgetWarning: value })}
              />
              <SettingsItem
                title="Budget Exceeded"
                description="When you exceed budget limits"
                value={notificationSettings.budgets.budgetExceeded}
                onToggle={(value) => updateCategorySettings('budgets', { ...notificationSettings.budgets, budgetExceeded: value })}
              />

              <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: THEME_COLORS.white }}>
                🎯 Goal Notifications
              </Text>
              <SettingsItem
                title="Goal Completed"
                description="When you complete a financial goal"
                value={notificationSettings.goals.goalCompleted}
                onToggle={(value) => updateCategorySettings('goals', { ...notificationSettings.goals, goalCompleted: value })}
              />
              <SettingsItem
                title="Milestone Reached"
                description="When you reach goal milestones"
                value={notificationSettings.goals.milestoneReached}
                onToggle={(value) => updateCategorySettings('goals', { ...notificationSettings.goals, milestoneReached: value })}
              />

              <Text className="text-lg font-semibold mt-4 mb-2" style={{ color: THEME_COLORS.white }}>
                🔊 Sound & Vibration
              </Text>
              <SettingsItem
                title="Sound"
                description="Play notification sounds"
                value={notificationSettings.general.sound}
                onToggle={(value) => updateCategorySettings('general', { ...notificationSettings.general, sound: value })}
              />
              <SettingsItem
                title="Vibration"
                description="Vibrate for notifications"
                value={notificationSettings.general.vibration}
                onToggle={(value) => updateCategorySettings('general', { ...notificationSettings.general, vibration: value })}
              />
            </>
          )}
        </SettingsSection>

        {/* App Preferences */}
        <SettingsSection
          title="App Preferences"
          icon="options"
          sectionKey="preferences"
          color={THEME_COLORS.accent}
        >
          <SettingsItem
            title="Dark Mode"
            description="Use dark theme throughout the app"
            value={settings.theme === 'dark'}
            onToggle={(value) => updateSettings({ theme: value ? 'dark' : 'light' })}
          />
          <SettingsItem
            title="Primary Currency"
            description="Set your main currency for calculations"
            type="button"
          />
          <SettingsItem
            title="Home Country Currency"
            description="Set your home country currency"
            type="button"
          />
          <SettingsItem
            title="Language"
            description="Choose your preferred language"
            type="button"
          />
        </SettingsSection>

        {/* Data & Privacy */}
        <SettingsSection
          title="Data & Privacy"
          icon="shield-checkmark"
          sectionKey="privacy"
          color={THEME_COLORS.success}
        >
          <SettingsItem
            title="Export Data"
            description="Download all your data"
            type="button"
          />
          <SettingsItem
            title="Clear Cache"
            description="Clear app cache and temporary files"
            type="button"
          />
          <Pressable
            onPress={() => {
              Alert.alert(
                'Clear All Notifications',
                'This will delete all your notifications. This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Clear', 
                    style: 'destructive',
                    onPress: () => clearAllNotifications(currentUser?.id || '')
                  }
                ]
              );
            }}
            className="flex-row items-center justify-between py-3 border-b border-gray-700"
          >
            <View className="flex-1">
              <Text className="font-medium" style={{ color: THEME_COLORS.error }}>
                Clear All Notifications
              </Text>
              <Text className="text-sm mt-1" style={{ color: THEME_COLORS.gray }}>
                Delete all notification history
              </Text>
            </View>
          </Pressable>
        </SettingsSection>

        {/* Support */}
        <SettingsSection
          title="Support & Help"
          icon="help-circle"
          sectionKey="support"
          color={THEME_COLORS.secondary}
        >
          <SettingsItem
            title="Help Center"
            description="Get help and find answers"
            type="button"
          />
          <SettingsItem
            title="Contact Support"
            description="Get in touch with our team"
            type="button"
          />
          <SettingsItem
            title="Rate BillChop"
            description="Rate us on the App Store"
            type="button"
          />
          <SettingsItem
            title="App Version"
            description="Version 1.0.0"
            type="button"
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}