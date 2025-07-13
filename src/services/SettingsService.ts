import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { User, AppSettings } from '../types';

export interface ProfileData {
  name: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
}

export interface PrivacySettings {
  shareExpenses: boolean;
  shareChores: boolean;
  shareBudgets: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
}

export interface ExportData {
  expenses: any[];
  chores: any[];
  budgets: any[];
  goals: any[];
  friends: any[];
  groups: any[];
  settings: any;
  exportDate: Date;
}

class SettingsService {
  // Profile Management
  async updateProfile(userId: string, profileData: ProfileData): Promise<boolean> {
    try {
      // TODO: Implement actual API call to update profile
      console.log('Updating profile for user:', userId, profileData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local storage
      const userData = await AsyncStorage.getItem(`user-${userId}`);
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, ...profileData };
        await AsyncStorage.setItem(`user-${userId}`, JSON.stringify(updatedUser));
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  // Privacy Settings
  async updatePrivacySettings(userId: string, privacySettings: PrivacySettings): Promise<boolean> {
    try {
      // TODO: Implement actual API call
      console.log('Updating privacy settings for user:', userId, privacySettings);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save to local storage
      await AsyncStorage.setItem(`privacy-${userId}`, JSON.stringify(privacySettings));
      
      return true;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return false;
    }
  }

  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    try {
      const settings = await AsyncStorage.getItem(`privacy-${userId}`);
      if (settings) {
        return JSON.parse(settings);
      }
      
      // Default privacy settings
      return {
        shareExpenses: true,
        shareChores: true,
        shareBudgets: false,
        allowFriendRequests: true,
        showOnlineStatus: true,
      };
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return {
        shareExpenses: true,
        shareChores: true,
        shareBudgets: false,
        allowFriendRequests: true,
        showOnlineStatus: true,
      };
    }
  }

  // Data Export
  async exportUserData(userId: string): Promise<string | null> {
    try {
      // Collect all user data
      const exportData: ExportData = {
        expenses: [],
        chores: [],
        budgets: [],
        goals: [],
        friends: [],
        groups: [],
        settings: {},
        exportDate: new Date(),
      };

      // Get expenses
      const expensesData = await AsyncStorage.getItem(`expenses-${userId}`);
      if (expensesData) {
        exportData.expenses = JSON.parse(expensesData);
      }

      // Get chores
      const choresData = await AsyncStorage.getItem(`chores-${userId}`);
      if (choresData) {
        exportData.chores = JSON.parse(choresData);
      }

      // Get budgets
      const budgetsData = await AsyncStorage.getItem(`budgets-${userId}`);
      if (budgetsData) {
        exportData.budgets = JSON.parse(budgetsData);
      }

      // Get goals
      const goalsData = await AsyncStorage.getItem(`goals-${userId}`);
      if (goalsData) {
        exportData.goals = JSON.parse(goalsData);
      }

      // Get friends
      const friendsData = await AsyncStorage.getItem(`friends-${userId}`);
      if (friendsData) {
        exportData.friends = JSON.parse(friendsData);
      }

      // Get groups
      const groupsData = await AsyncStorage.getItem(`groups-${userId}`);
      if (groupsData) {
        exportData.groups = JSON.parse(groupsData);
      }

      // Get settings
      const settingsData = await AsyncStorage.getItem(`settings-${userId}`);
      if (settingsData) {
        exportData.settings = JSON.parse(settingsData);
      }

      // Create export file
      const fileName = `billchop-export-${userId}-${Date.now()}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));
      
      return filePath;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  async shareExportedData(filePath: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
        return false;
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export BillChop Data',
      });
      
      return true;
    } catch (error) {
      console.error('Error sharing exported data:', error);
      return false;
    }
  }

  // Cache Management
  async clearCache(): Promise<boolean> {
    try {
      // Clear AsyncStorage cache
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.includes('cache') || 
        key.includes('temp') || 
        key.includes('image')
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }

      // Clear FileSystem cache
      const cacheDir = `${FileSystem.cacheDirectory}`;
      const cacheContents = await FileSystem.readDirectoryAsync(cacheDir);
      
      for (const item of cacheContents) {
        const itemPath = `${cacheDir}${item}`;
        const itemInfo = await FileSystem.getInfoAsync(itemPath);
        if (itemInfo.exists && !itemInfo.isDirectory) {
          await FileSystem.deleteAsync(itemPath);
        }
      }

      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Currency Management
  async updatePrimaryCurrency(userId: string, currency: string): Promise<boolean> {
    try {
      // TODO: Implement actual API call
      console.log('Updating primary currency for user:', userId, currency);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local storage
      const settingsData = await AsyncStorage.getItem(`settings-${userId}`);
      const settings = settingsData ? JSON.parse(settingsData) : {};
      settings.primaryCurrency = currency;
      await AsyncStorage.setItem(`settings-${userId}`, JSON.stringify(settings));
      
      return true;
    } catch (error) {
      console.error('Error updating primary currency:', error);
      return false;
    }
  }

  async updateHomeCurrency(userId: string, currency: string): Promise<boolean> {
    try {
      // TODO: Implement actual API call
      console.log('Updating home currency for user:', userId, currency);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local storage
      const settingsData = await AsyncStorage.getItem(`settings-${userId}`);
      const settings = settingsData ? JSON.parse(settingsData) : {};
      settings.homeCurrency = currency;
      await AsyncStorage.setItem(`settings-${userId}`, JSON.stringify(settings));
      
      return true;
    } catch (error) {
      console.error('Error updating home currency:', error);
      return false;
    }
  }

  // Language Management
  async updateLanguage(userId: string, language: string): Promise<boolean> {
    try {
      // TODO: Implement actual API call
      console.log('Updating language for user:', userId, language);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local storage
      const settingsData = await AsyncStorage.getItem(`settings-${userId}`);
      const settings = settingsData ? JSON.parse(settingsData) : {};
      settings.language = language;
      await AsyncStorage.setItem(`settings-${userId}`, JSON.stringify(settings));
      
      return true;
    } catch (error) {
      console.error('Error updating language:', error);
      return false;
    }
  }

  // Support Functions
  async contactSupport(): Promise<boolean> {
    try {
      // TODO: Implement actual support contact
      console.log('Contacting support...');
      
      // For now, just show an alert
      Alert.alert(
        'Contact Support',
        'Support feature coming soon. Please email support@billchop.com for assistance.',
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error) {
      console.error('Error contacting support:', error);
      return false;
    }
  }

  async rateApp(): Promise<boolean> {
    try {
      // TODO: Implement actual app store rating
      console.log('Opening app store for rating...');
      
      Alert.alert(
        'Rate BillChop',
        'Thank you for using BillChop! Please rate us on the App Store.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Rate Now', onPress: () => {
            // TODO: Open app store
            console.log('Opening app store...');
          }}
        ]
      );
      
      return true;
    } catch (error) {
      console.error('Error rating app:', error);
      return false;
    }
  }

  async openHelpCenter(): Promise<boolean> {
    try {
      // TODO: Implement actual help center
      console.log('Opening help center...');
      
      Alert.alert(
        'Help Center',
        'Help center feature coming soon. Check our documentation at help.billchop.com',
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error) {
      console.error('Error opening help center:', error);
      return false;
    }
  }

  // Get app version
  getAppVersion(): string {
    // TODO: Get actual app version from app.json or package.json
    return '1.0.0';
  }
}

export const settingsService = new SettingsService(); 