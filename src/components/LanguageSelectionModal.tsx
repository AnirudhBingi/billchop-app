import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../services/SettingsService';

interface LanguageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentLanguage: string;
  onLanguageUpdated: (language: string) => void;
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

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
];

export default function LanguageSelectionModal({
  visible,
  onClose,
  userId,
  currentLanguage,
  onLanguageUpdated,
}: LanguageSelectionModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (selectedLanguage === currentLanguage) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const success = await settingsService.updateLanguage(userId, selectedLanguage);
      
      if (success) {
        onLanguageUpdated(selectedLanguage);
        Alert.alert('Success', 'Language updated successfully!');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update language. Please try again.');
      }
    } catch (error) {
      console.error('Error updating language:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    setSelectedLanguage(currentLanguage);
    onClose();
  };

  const LanguageItem = ({ language }: { language: typeof SUPPORTED_LANGUAGES[0] }) => (
    <Pressable
      onPress={() => setSelectedLanguage(language.code)}
      className={`flex-row items-center p-4 rounded-lg ${
        selectedLanguage === language.code ? 'bg-purple-600' : 'bg-gray-800'
      }`}
    >
      <View className="flex-1">
        <Text className="font-semibold" style={{ color: THEME_COLORS.white }}>
          {language.nativeName}
        </Text>
        <Text className="text-sm" style={{ color: THEME_COLORS.gray }}>
          {language.name}
        </Text>
      </View>
      {selectedLanguage === language.code && (
        <Ionicons name="checkmark-circle" size={24} color={THEME_COLORS.white} />
      )}
    </Pressable>
  );

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
            Select Language
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

        {/* Language List */}
        <ScrollView className="flex-1 p-4">
          <View className="space-y-3">
            {SUPPORTED_LANGUAGES.map((language) => (
              <LanguageItem key={language.code} language={language} />
            ))}
          </View>
        </ScrollView>

        {/* Current Selection */}
        {selectedLanguage && (
          <View className="p-4 border-t border-gray-700">
            <Text className="text-sm font-medium mb-2" style={{ color: THEME_COLORS.gray }}>
              Selected Language
            </Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: THEME_COLORS.primary }}>
                <Text className="text-white font-bold">
                  {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName.charAt(0) || 'L'}
                </Text>
              </View>
              <View>
                <Text className="font-semibold" style={{ color: THEME_COLORS.white }}>
                  {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName || 'Unknown Language'}
                </Text>
                <Text className="text-sm" style={{ color: THEME_COLORS.gray }}>
                  {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'Unknown Language'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
} 