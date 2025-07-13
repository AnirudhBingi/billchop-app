import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService, ProfileData } from '../services/SettingsService';
import { User } from '../types';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onProfileUpdated: (updatedUser: User) => void;
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

export default function ProfileEditModal({
  visible,
  onClose,
  user,
  onProfileUpdated,
}: ProfileEditModalProps) {
  const [formData, setFormData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    profilePicture: user?.profilePicture || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const success = await settingsService.updateProfile(user.id, formData);
      
      if (success) {
        const updatedUser = { ...user, ...formData };
        onProfileUpdated(updatedUser);
        Alert.alert('Success', 'Profile updated successfully!');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    
    // Reset form data to original values
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      profilePicture: user?.profilePicture || '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        style={{ backgroundColor: THEME_COLORS.background }}
      >
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
            Edit Profile
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

        {/* Form */}
        <View className="flex-1 p-4">
          <View className="space-y-4">
            {/* Profile Picture */}
            <View className="items-center mb-6">
              <View 
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <Text className="text-white font-bold text-2xl">
                  {formData.name.charAt(0) || 'A'}
                </Text>
              </View>
              <Pressable
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: THEME_COLORS.surface }}
              >
                <Text style={{ color: THEME_COLORS.primary }}>
                  Change Photo
                </Text>
              </Pressable>
            </View>

            {/* Name */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: THEME_COLORS.white }}>
                Full Name *
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                className="p-3 rounded-lg text-base"
                style={{ 
                  backgroundColor: THEME_COLORS.surface,
                  color: THEME_COLORS.white,
                  borderColor: errors.name ? THEME_COLORS.error : THEME_COLORS.gray,
                  borderWidth: 1,
                }}
                placeholder="Enter your full name"
                placeholderTextColor={THEME_COLORS.gray}
              />
              {errors.name && (
                <Text className="text-sm mt-1" style={{ color: THEME_COLORS.error }}>
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Email */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: THEME_COLORS.white }}>
                Email Address *
              </Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                className="p-3 rounded-lg text-base"
                style={{ 
                  backgroundColor: THEME_COLORS.surface,
                  color: THEME_COLORS.white,
                  borderColor: errors.email ? THEME_COLORS.error : THEME_COLORS.gray,
                  borderWidth: 1,
                }}
                placeholder="Enter your email address"
                placeholderTextColor={THEME_COLORS.gray}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <Text className="text-sm mt-1" style={{ color: THEME_COLORS.error }}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Phone Number */}
            <View>
              <Text className="text-sm font-medium mb-2" style={{ color: THEME_COLORS.white }}>
                Phone Number
              </Text>
              <TextInput
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                className="p-3 rounded-lg text-base"
                style={{ 
                  backgroundColor: THEME_COLORS.surface,
                  color: THEME_COLORS.white,
                  borderColor: errors.phoneNumber ? THEME_COLORS.error : THEME_COLORS.gray,
                  borderWidth: 1,
                }}
                placeholder="Enter your phone number"
                placeholderTextColor={THEME_COLORS.gray}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && (
                <Text className="text-sm mt-1" style={{ color: THEME_COLORS.error }}>
                  {errors.phoneNumber}
                </Text>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
} 