import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService, PrivacySettings } from '../services/SettingsService';

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

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
  lightGray: '#9CA3AF',
};

export default function PrivacySettingsModal({
  visible,
  onClose,
  userId,
}: PrivacySettingsModalProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    shareExpenses: true,
    shareChores: true,
    shareBudgets: false,
    allowFriendRequests: true,
    showOnlineStatus: true,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPrivacySettings();
    }
  }, [visible]);

  const loadPrivacySettings = async () => {
    try {
      const privacySettings = await settingsService.getPrivacySettings(userId);
      setSettings(privacySettings);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const success = await settingsService.updatePrivacySettings(userId, settings);
      
      if (success) {
        Alert.alert('Success', 'Privacy settings updated successfully!');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update privacy settings. Please try again.');
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    loadPrivacySettings(); // Reset to original values
    onClose();
  };

  const PrivacyItem = ({ 
    title, 
    description, 
    value, 
    onToggle 
  }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-700">
      <View className="flex-1 mr-4">
        <Text className="font-medium" style={{ color: THEME_COLORS.white }}>
          {title}
        </Text>
        <Text className="text-sm mt-1" style={{ color: THEME_COLORS.gray }}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#374151', true: THEME_COLORS.primary + '50' }}
        thumbColor={value ? THEME_COLORS.primary : '#9CA3AF'}
      />
    </View>
  );

  if (initialLoading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: THEME_COLORS.background }}>
          <ActivityIndicator size="large" color={THEME_COLORS.primary} />
          <Text className="mt-4" style={{ color: THEME_COLORS.white }}>
            Loading privacy settings...
          </Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View className="flex-1" style={{ backgroundColor: THEME_COLORS.background }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-700">
          <Pressable
            onPress={handleCancel}
            className="p-2 rounded-full"
            style={{ backgroundColor: THEME_COLORS.surface }}
          >
            <Ionicons name="close" size={24} color={THEME_COLORS.white} />
          </Pressable>
          <Text className="text-xl font-bold" style={{ color: THEME_COLORS.white }}>
            Privacy Settings
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: loading ? THEME_COLORS.gray : THEME_COLORS.primary 
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={THEME_COLORS.white} />
            ) : (
              <Text className="font-semibold" style={{ color: THEME_COLORS.white }}>
                Save
              </Text>
            )}
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4">
          <View className="space-y-6">
            {/* Information Sharing */}
            <View>
              <Text className="text-lg font-semibold mb-4" style={{ color: THEME_COLORS.white }}>
                Information Sharing
              </Text>
              <View className="space-y-1">
                <PrivacyItem
                  title="Share Expenses"
                  description="Allow friends to see your expenses and balances"
                  value={settings.shareExpenses}
                  onToggle={(value) => setSettings({ ...settings, shareExpenses: value })}
                />
                <PrivacyItem
                  title="Share Chores"
                  description="Allow friends to see your chore assignments and completions"
                  value={settings.shareChores}
                  onToggle={(value) => setSettings({ ...settings, shareChores: value })}
                />
                <PrivacyItem
                  title="Share Budgets"
                  description="Allow friends to see your budget information"
                  value={settings.shareBudgets}
                  onToggle={(value) => setSettings({ ...settings, shareBudgets: value })}
                />
              </View>
            </View>

            {/* Social Settings */}
            <View>
              <Text className="text-lg font-semibold mb-4" style={{ color: THEME_COLORS.white }}>
                Social Settings
              </Text>
              <View className="space-y-1">
                <PrivacyItem
                  title="Allow Friend Requests"
                  description="Let other users send you friend requests"
                  value={settings.allowFriendRequests}
                  onToggle={(value) => setSettings({ ...settings, allowFriendRequests: value })}
                />
                <PrivacyItem
                  title="Show Online Status"
                  description="Show when you're active in the app"
                  value={settings.showOnlineStatus}
                  onToggle={(value) => setSettings({ ...settings, showOnlineStatus: value })}
                />
              </View>
            </View>

            {/* Privacy Notice */}
            <View className="p-4 rounded-lg" style={{ backgroundColor: THEME_COLORS.surface }}>
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color={THEME_COLORS.secondary} />
                <Text className="text-sm ml-2 flex-1" style={{ color: THEME_COLORS.gray }}>
                  Your privacy is important to us. These settings control what information is shared with your friends and other users. You can change these settings at any time.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
} 