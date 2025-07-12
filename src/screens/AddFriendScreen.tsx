import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../state/useUserStore';
import { User } from '../types';

export default function AddFriendScreen() {
  const navigation = useNavigation();
  const { settings, addFriend } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'manual' | 'email' | 'phone' | 'qr'>('manual');

  const handleAddFriend = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a friend name');
      return;
    }

    if (method === 'email' && !email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (method === 'phone' && !phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    const newFriend: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phoneNumber: phone.trim(),
      avatar: '',
      isActive: true,
      joinedAt: new Date(),
      preferences: {
        currency: 'USD',
        language: 'en',
        notifications: true
      }
    };

    addFriend(newFriend);
    
    Alert.alert(
      'Friend Added!', 
      `${name} has been added to your friends list.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const generateQR = () => {
    Alert.alert(
      'QR Code Feature',
      'QR code sharing will be available in the next update!',
      [{ text: 'OK' }]
    );
  };

  const sendInvite = () => {
    if (method === 'email') {
      Alert.alert(
        'Email Invite Sent!',
        `Invitation sent to ${email}. They will receive a link to join BillChop.`,
        [{ text: 'OK' }]
      );
    } else if (method === 'phone') {
      Alert.alert(
        'SMS Invite Sent!',
        `Invitation sent to ${phone}. They will receive a text with download link.`,
        [{ text: 'OK' }]
      );
    }
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
            👥 Add Friend
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            Invite friends to split expenses together
          </Text>
        </View>

        {/* Add Method Selection */}
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
            How would you like to add them?
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Pressable
              onPress={() => setMethod('manual')}
              style={{
                flex: 1,
                minWidth: '45%',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: method === 'manual' ? '#3B82F6' : '#E5E7EB',
                backgroundColor: method === 'manual' ? '#EBF5FF' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons name="person-add" size={24} color={method === 'manual' ? '#3B82F6' : '#6B7280'} />
              <Text style={{
                marginTop: 8,
                fontWeight: '600',
                color: method === 'manual' ? '#3B82F6' : '#6B7280',
                textAlign: 'center'
              }}>
                Add Manually
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => setMethod('email')}
              style={{
                flex: 1,
                minWidth: '45%',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: method === 'email' ? '#3B82F6' : '#E5E7EB',
                backgroundColor: method === 'email' ? '#EBF5FF' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons name="mail" size={24} color={method === 'email' ? '#3B82F6' : '#6B7280'} />
              <Text style={{
                marginTop: 8,
                fontWeight: '600',
                color: method === 'email' ? '#3B82F6' : '#6B7280',
                textAlign: 'center'
              }}>
                Email Invite
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMethod('phone')}
              style={{
                flex: 1,
                minWidth: '45%',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: method === 'phone' ? '#3B82F6' : '#E5E7EB',
                backgroundColor: method === 'phone' ? '#EBF5FF' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons name="call" size={24} color={method === 'phone' ? '#3B82F6' : '#6B7280'} />
              <Text style={{
                marginTop: 8,
                fontWeight: '600',
                color: method === 'phone' ? '#3B82F6' : '#6B7280',
                textAlign: 'center'
              }}>
                SMS Invite
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMethod('qr')}
              style={{
                flex: 1,
                minWidth: '45%',
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: method === 'qr' ? '#3B82F6' : '#E5E7EB',
                backgroundColor: method === 'qr' ? '#EBF5FF' : 'transparent',
                alignItems: 'center'
              }}
            >
              <Ionicons name="qr-code" size={24} color={method === 'qr' ? '#3B82F6' : '#6B7280'} />
              <Text style={{
                marginTop: 8,
                fontWeight: '600',
                color: method === 'qr' ? '#3B82F6' : '#6B7280',
                textAlign: 'center'
              }}>
                QR Code
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Friend Details Form */}
        {method !== 'qr' && (
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
              Friend Details
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '500', 
                color: isDark ? '#FFFFFF' : '#111827',
                marginBottom: 8
              }}>
                Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter friend's name"
                placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: isDark ? '#374151' : '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: isDark ? '#FFFFFF' : '#111827'
                }}
              />
            </View>

            {method === 'email' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: isDark ? '#FFFFFF' : '#111827',
                  marginBottom: 8
                }}>
                  Email Address *
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="friend@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: isDark ? '#FFFFFF' : '#111827'
                  }}
                />
              </View>
            )}

            {method === 'phone' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: isDark ? '#FFFFFF' : '#111827',
                  marginBottom: 8
                }}>
                  Phone Number *
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: isDark ? '#FFFFFF' : '#111827'
                  }}
                />
              </View>
            )}

            {method === 'manual' && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: isDark ? '#FFFFFF' : '#111827',
                  marginBottom: 8
                }}>
                  Email (Optional)
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="friend@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: isDark ? '#FFFFFF' : '#111827'
                  }}
                />
              </View>
            )}
          </View>
        )}

        {/* QR Code Section */}
        {method === 'qr' && (
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            alignItems: 'center'
          }}>
            <Ionicons name="qr-code" size={120} color="#3B82F6" />
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginTop: 16,
              marginBottom: 8
            }}>
              Share Your QR Code
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: isDark ? '#9CA3AF' : '#6B7280',
              textAlign: 'center',
              marginBottom: 16
            }}>
              Let your friend scan this code to add you instantly
            </Text>
            <Pressable
              onPress={generateQR}
              style={{
                backgroundColor: '#3B82F6',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                Generate New QR Code
              </Text>
            </Pressable>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 20
      }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#E5E7EB',
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827' 
            }}>
              Cancel
            </Text>
          </Pressable>
          
          <Pressable
            onPress={method === 'qr' ? generateQR : 
                     method === 'manual' ? handleAddFriend : sendInvite}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              backgroundColor: '#3B82F6',
              alignItems: 'center'
            }}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'white' 
            }}>
              {method === 'qr' ? '📱 Share QR' : 
               method === 'manual' ? '👥 Add Friend' : '📤 Send Invite'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}