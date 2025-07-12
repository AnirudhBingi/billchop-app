import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../state/useUserStore';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ChoresScreen from '../screens/ChoresScreen';
import PersonalScreen from '../screens/PersonalScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddChoreScreen from '../screens/AddChoreScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PersonalFinanceModal from '../screens/PersonalFinanceModal';

export type RootStackParamList = {
  MainTabs: undefined;
  AddExpense: { groupId?: string; isPersonal?: boolean; isIncome?: boolean };
  AddChore: { groupId?: string };
  GroupDetail: { groupId: string };
  Settings: undefined;
  PersonalFinance: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Split: undefined;
  Chores: undefined;
  Personal: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { settings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Split') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Chores') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Personal') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderTopColor: isDark ? '#374151' : '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Split" component={ExpensesScreen} />
      <Tab.Screen name="Chores" component={ChoresScreen} />
      <Tab.Screen name="Personal" component={PersonalScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { settings } = useUserStore();
  const isDark = settings.theme === 'dark';
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#111827',
        headerTitleStyle: {
          fontWeight: '600',
        },
        presentation: 'modal',
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddExpense" 
        component={AddExpenseScreen}
        options={{ 
          title: 'Add Expense',
          presentation: 'formSheet',
          sheetAllowedDetents: [0.7, 1.0]
        }}
      />
      <Stack.Screen 
        name="AddChore" 
        component={AddChoreScreen}
        options={{ 
          title: 'Add Chore',
          presentation: 'formSheet',
          sheetAllowedDetents: [0.6, 1.0]
        }}
      />
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={{ title: 'Group Details' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="PersonalFinance" 
        component={PersonalFinanceModal}
        options={{ 
          title: 'Personal Finance',
          presentation: 'formSheet',
          sheetAllowedDetents: [0.8, 1.0]
        }}
      />
    </Stack.Navigator>
  );
}