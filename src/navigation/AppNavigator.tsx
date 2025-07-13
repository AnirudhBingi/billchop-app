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
import SplitBillScreen from '../screens/SplitBillScreen';

import AnalyticsScreen from '../screens/AnalyticsScreen';
import ExpenseHistoryScreen from '../screens/ExpenseHistoryScreen';
import AddFriendScreen from '../screens/AddFriendScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import AddChoreScreen from '../screens/AddChoreScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PersonalFinanceModal from '../screens/PersonalFinanceModal';
import BudgetManagerModal from '../screens/BudgetManagerModal';
import GoalManagerModal from '../screens/GoalManagerModal';
import CreateRideScreen from '../screens/CreateRideScreen';
import RideLogScreen from '../screens/RideLogScreen';
import AIChatScreen from '../screens/AIChatScreen';
import SettleUpScreen from '../screens/SettleUpScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import FriendDetailScreen from '../screens/FriendDetailScreen';
import CurrencySelectionScreen from '../screens/CurrencySelectionScreen';
import ReceiptScanScreen from '../screens/ReceiptScanScreen';
import { PersonalExpense, Budget, FinancialGoal } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  SplitBill: undefined;

  Analytics: undefined;
  ExpenseHistory: undefined;
  AddFriend: undefined;
  CreateGroup: undefined;
  AddChore: { groupId?: string };
  GroupDetail: { groupId: string };
  Settings: undefined;
  PersonalFinance: { initialType?: 'income' | 'expense'; selectedMode?: 'local' | 'home'; expenseId?: string; prefill?: PersonalExpense };
  BudgetManager: { selectedMode?: 'local' | 'home'; budgetId?: string; prefill?: Budget };
  GoalManager: { selectedMode?: 'local' | 'home'; goalId?: string; prefill?: FinancialGoal };
  CreateRide: { selectedPassenger?: string; rideDescription?: string };
  RideLog: undefined;
  AIChat: undefined;
  SettleUp: { groupId?: string; friendId?: string };
  ExpenseDetail: { expenseId: string };
  FriendDetail: { friendId: string };
  CurrencySelection: undefined;
  ReceiptScan: undefined;
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
        name="SplitBill" 
        component={SplitBillScreen}
        options={{ 
          title: 'Split Bill',
          headerShown: true
        }}
      />

      <Stack.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ 
          title: 'Smart Analytics',
          headerShown: true
        }}
      />
      <Stack.Screen 
        name="ExpenseHistory" 
        component={ExpenseHistoryScreen}
        options={{ 
          title: 'Expense History',
          headerShown: true
        }}
      />
      <Stack.Screen 
        name="AddFriend" 
        component={AddFriendScreen}
        options={{ 
          title: 'Add Friend',
          headerShown: true
        }}
      />
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
        options={{ 
          title: 'Create Group',
          headerShown: true
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
      <Stack.Screen 
        name="BudgetManager" 
        component={BudgetManagerModal}
        options={{ 
          title: 'Budget Manager',
          presentation: 'formSheet',
          sheetAllowedDetents: [0.7, 1.0]
        }}
      />
      <Stack.Screen 
        name="GoalManager" 
        component={GoalManagerModal}
        options={{ 
          title: 'Goal Manager',
          presentation: 'formSheet',
          sheetAllowedDetents: [0.8, 1.0]
        }}
      />
      <Stack.Screen 
        name="CreateRide" 
        component={CreateRideScreen}
        options={{ 
          title: 'Log Ride',
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="RideLog" 
        component={RideLogScreen}
        options={{ 
          title: 'Ride History',
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="AIChat" 
        component={AIChatScreen}
        options={{ 
          title: 'AI Assistant',
          headerShown: false
        }}
      />
      <Stack.Screen 
        name="SettleUp" 
        component={SettleUpScreen}
        options={{ title: 'Settle Up' }}
      />
      <Stack.Screen 
        name="ExpenseDetail" 
        component={ExpenseDetailScreen}
        options={{ title: 'Expense Details' }}
      />
      <Stack.Screen 
        name="FriendDetail" 
        component={FriendDetailScreen}
        options={{ title: 'Friend Details' }}
      />
      <Stack.Screen 
        name="CurrencySelection" 
        component={CurrencySelectionScreen}
        options={{ title: 'Select Currency' }}
      />
      <Stack.Screen 
        name="ReceiptScan" 
        component={ReceiptScanScreen}
        options={{ title: 'Scan Receipt' }}
      />
    </Stack.Navigator>
  );
}