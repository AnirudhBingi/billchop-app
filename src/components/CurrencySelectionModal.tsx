import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../services/SettingsService';

interface CurrencySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentCurrency: string;
  type: 'primary' | 'home';
  onCurrencyUpdated: (currency: string) => void;
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

const POPULAR_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

export default function CurrencySelectionModal({
  visible,
  onClose,
  userId,
  currentCurrency,
  type,
  onCurrencyUpdated,
}: CurrencySelectionModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = async () => {
    if (selectedCurrency === currentCurrency) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      let success = false;
      
      if (type === 'primary') {
        success = await settingsService.updatePrimaryCurrency(userId, selectedCurrency);
      } else {
        success = await settingsService.updateHomeCurrency(userId, selectedCurrency);
      }
      
      if (success) {
        onCurrencyUpdated(selectedCurrency);
        Alert.alert('Success', `${type === 'primary' ? 'Primary' : 'Home'} currency updated successfully!`);
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update currency. Please try again.');
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    setSelectedCurrency(currentCurrency);
    setSearchQuery('');
    onClose();
  };

  const filteredCurrencies = POPULAR_CURRENCIES.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CurrencyItem = ({ currency }: { currency: typeof POPULAR_CURRENCIES[0] }) => (
    <Pressable
      onPress={() => setSelectedCurrency(currency.code)}
      className={`flex-row items-center p-4 rounded-lg ${
        selectedCurrency === currency.code ? 'bg-purple-600' : 'bg-gray-800'
      }`}
    >
      <View className="flex-1">
        <Text className="font-semibold" style={{ color: THEME_COLORS.white }}>
          {currency.symbol} {currency.code}
        </Text>
        <Text className="text-sm" style={{ color: THEME_COLORS.gray }}>
          {currency.name}
        </Text>
      </View>
      {selectedCurrency === currency.code && (
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
            Select {type === 'primary' ? 'Primary' : 'Home'} Currency
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

        {/* Search */}
        <View className="p-4 border-b border-gray-700">
          <View className="flex-row items-center bg-gray-800 rounded-lg px-3">
            <Ionicons name="search" size={20} color={THEME_COLORS.gray} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 p-3 text-base"
              style={{ color: THEME_COLORS.white }}
              placeholder="Search currencies..."
              placeholderTextColor={THEME_COLORS.gray}
            />
          </View>
        </View>

        {/* Currency List */}
        <ScrollView className="flex-1 p-4">
          <View className="space-y-3">
            {filteredCurrencies.map((currency) => (
              <CurrencyItem key={currency.code} currency={currency} />
            ))}
            
            {filteredCurrencies.length === 0 && (
              <View className="items-center py-8">
                <Ionicons name="search-outline" size={48} color={THEME_COLORS.gray} />
                <Text className="text-lg font-medium mt-2" style={{ color: THEME_COLORS.white }}>
                  No currencies found
                </Text>
                <Text className="text-sm mt-1" style={{ color: THEME_COLORS.gray }}>
                  Try adjusting your search terms
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Current Selection */}
        {selectedCurrency && (
          <View className="p-4 border-t border-gray-700">
            <Text className="text-sm font-medium mb-2" style={{ color: THEME_COLORS.gray }}>
              Selected Currency
            </Text>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: THEME_COLORS.primary }}>
                <Text className="text-white font-bold">
                  {POPULAR_CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$'}
                </Text>
              </View>
              <View>
                <Text className="font-semibold" style={{ color: THEME_COLORS.white }}>
                  {selectedCurrency}
                </Text>
                <Text className="text-sm" style={{ color: THEME_COLORS.gray }}>
                  {POPULAR_CURRENCIES.find(c => c.code === selectedCurrency)?.name || 'Unknown Currency'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
} 