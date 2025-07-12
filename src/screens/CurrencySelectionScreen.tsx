import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../state/useUserStore';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  region: string;
}

const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', region: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', region: 'European Union' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', region: 'United Kingdom' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', region: 'Japan' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', region: 'Australia' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', region: 'Canada' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', region: 'Switzerland' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', region: 'China' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', region: 'India' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', region: 'South Korea' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', region: 'Singapore' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', region: 'Hong Kong' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', region: 'Mexico' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', region: 'Brazil' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', region: 'South Africa' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', region: 'Russia' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', region: 'Turkey' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', region: 'Poland' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', region: 'Sweden' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', region: 'Norway' }
];

export default function CurrencySelectionScreen() {
  const navigation = useNavigation();
  const { settings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  const [selectedMode, setSelectedMode] = useState<'local' | 'home'>('local');

  const handleCurrencySelect = (currency: Currency) => {
    // Navigate to personal finance with selected currency and mode
    navigation.navigate('PersonalFinance' as any, { 
      mode: selectedMode, 
      currency: currency.code,
      currencySymbol: currency.symbol 
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            💰 Personal Finance
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Choose your location and currency
          </Text>
        </View>

        {/* Mode Selection */}
        <View style={{ 
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16
          }}>
            Select Finance Mode
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => setSelectedMode('local')}
              style={{
                flex: 1,
                padding: 20,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selectedMode === 'local' ? '#3B82F6' : '#E5E7EB',
                backgroundColor: selectedMode === 'local' ? '#EBF5FF' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons 
                name="location" 
                size={32} 
                color={selectedMode === 'local' ? '#3B82F6' : '#6B7280'} 
              />
              <Text style={{
                marginTop: 12,
                fontSize: 16,
                fontWeight: '600',
                color: selectedMode === 'local' ? '#3B82F6' : '#6B7280',
                textAlign: 'center'
              }}>
                🏠 Local Expenses
              </Text>
              <Text style={{
                marginTop: 4,
                fontSize: 12,
                color: '#6B7280',
                textAlign: 'center'
              }}>
                Where you live now
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => setSelectedMode('home')}
              style={{
                flex: 1,
                padding: 20,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selectedMode === 'home' ? '#10B981' : '#E5E7EB',
                backgroundColor: selectedMode === 'home' ? '#ECFDF5' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons 
                name="home" 
                size={32} 
                color={selectedMode === 'home' ? '#10B981' : '#6B7280'} 
              />
              <Text style={{
                marginTop: 12,
                fontSize: 16,
                fontWeight: '600',
                color: selectedMode === 'home' ? '#10B981' : '#6B7280',
                textAlign: 'center'
              }}>
                🏡 Home Country
              </Text>
              <Text style={{
                marginTop: 4,
                fontSize: 12,
                color: '#6B7280',
                textAlign: 'center'
              }}>
                Your original country
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Currency Selection */}
        <View style={{ 
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 16
          }}>
            Choose Currency for {selectedMode === 'local' ? 'Local' : 'Home Country'} Finances
          </Text>
          
          {CURRENCIES.map(currency => (
            <Pressable
              key={currency.code}
              onPress={() => handleCurrencySelect(currency)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
                backgroundColor: isDark ? '#374151' : '#F9FAFB',
                borderWidth: 1,
                borderColor: '#E5E7EB'
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>
                {currency.flag}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#111827' 
                }}>
                  {currency.name}
                </Text>
                <Text style={{ 
                  fontSize: 12, 
                  color: isDark ? '#9CA3AF' : '#6B7280'
                }}>
                  {currency.region} • {currency.code}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold',
                  color: selectedMode === 'local' ? '#3B82F6' : '#10B981'
                }}>
                  {currency.symbol}
                </Text>
                <Text style={{ 
                  fontSize: 10, 
                  color: '#6B7280'
                }}>
                  {currency.code}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}