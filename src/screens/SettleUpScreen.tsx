import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ScrollView, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useExpenseStore } from '../state/useExpenseStore';
import { useUserStore } from '../state/useUserStore';
import { calculateTotalBalances, GroupBalance, FriendBalance, calculateGroupBalances, calculateFriendBalances, BalanceCalculation } from '../utils/balanceCalculator';

type SettleUpRouteProp = RouteProp<RootStackParamList, 'SettleUp'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettleUpScreen = () => {
  const route = useRoute<SettleUpRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { groupId, friendId } = route.params || {};
  const { groups, expenses, balances, settleBalance } = useExpenseStore();
  const { currentUser, friends, settings } = useUserStore();

  const isDark = settings.theme === 'dark';

  const [totalBalance, setTotalBalance] = useState<BalanceCalculation | null>(null);
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([]);
  const [friendBalances, setFriendBalances] = useState<FriendBalance[]>([]);
  const [activeTab, setActiveTab] = useState<'total' | 'groups' | 'friends'>('total');
  const [settlementAmount, setSettlementAmount] = useState<string>('');
  const [settlementTarget, setSettlementTarget] = useState<string>('');
  const [showSettlementModal, setShowSettlementModal] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      // Calculate group balances
      const gBalances = groups.map(group => 
        calculateGroupBalances(group, expenses, friends, currentUser.id)
      );
      setGroupBalances(gBalances);

      // Calculate friend balances
      const fBalances = calculateFriendBalances(expenses, friends, currentUser.id);
      setFriendBalances(fBalances);

      // Total
      const total = calculateTotalBalances(gBalances, fBalances);
      setTotalBalance(total);

      if (groupId) {
        setActiveTab('groups');
        setSettlementTarget(groupId);
      } else if (friendId) {
        setActiveTab('friends');
        setSettlementTarget(friendId);
      }
    }
  }, [groupId, friendId, groups, expenses, friends, currentUser]);

  const handleSettle = (targetId: string, amount: number) => {
    if (currentUser?.id) {
      settleBalance(currentUser.id, targetId, amount);
      setSettlementAmount('');
      setShowSettlementModal(false);
      Alert.alert('Success', 'Settlement recorded successfully!');
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return '#10B981'; // Green for positive
    if (balance < 0) return '#EF4444'; // Red for negative
    return '#6B7280'; // Gray for zero
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return 'arrow-down-circle';
    if (balance < 0) return 'arrow-up-circle';
    return 'checkmark-circle';
  };

  const renderBalanceCard = (item: GroupBalance | FriendBalance, index: number) => {
    const balance = 'netBalance' in item ? item.netBalance : item.balance;
    const name = 'groupName' in item ? item.groupName : item.friendName;
    const id = 'groupId' in item ? item.groupId : item.friendId;
    
    return (
      <View style={[styles.balanceCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {name}
            </Text>
            <Text style={[styles.cardSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {balance === 0 ? 'All settled' : balance > 0 ? 'You are owed' : 'You owe'}
            </Text>
          </View>
          <View style={styles.balanceContainer}>
            <Ionicons 
              name={getBalanceIcon(balance)} 
              size={24} 
              color={getBalanceColor(balance)} 
            />
            <Text style={[styles.balanceAmount, { color: getBalanceColor(balance) }]}>
              ${Math.abs(balance).toFixed(2)}
            </Text>
          </View>
        </View>
        
        {balance !== 0 && (
          <TouchableOpacity
            style={[styles.settleButton, { backgroundColor: getBalanceColor(balance) }]}
            onPress={() => {
              setSettlementTarget(id);
              setSettlementAmount(Math.abs(balance).toString());
              setShowSettlementModal(true);
            }}
          >
            <Ionicons name="cash-outline" size={16} color="white" />
            <Text style={styles.settleButtonText}>
              {balance > 0 ? 'Request Payment' : 'Pay Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTabButton = (tab: 'total' | 'groups' | 'friends', label: string, count?: number) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && { backgroundColor: isDark ? '#374151' : '#F3F4F6' }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        { color: isDark ? '#FFFFFF' : '#111827' },
        activeTab === tab && { fontWeight: '600' }
      ]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          Settle Up
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        {renderTabButton('total', 'Overview', totalBalance ? 1 : 0)}
        {renderTabButton('groups', 'Groups', groupBalances.length)}
        {renderTabButton('friends', 'Friends', friendBalances.length)}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'total' && totalBalance && (
          <View style={[styles.totalCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
            <View style={styles.totalHeader}>
              <Ionicons name="wallet-outline" size={24} color="#3B82F6" />
              <Text style={[styles.totalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Overall Balance
              </Text>
            </View>
            
            <View style={styles.totalStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  You Are Owed
                </Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  ${totalBalance.totalOwed.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  You Owe
                </Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  ${totalBalance.totalOwing.toFixed(2)}
                </Text>
              </View>
              
              <View style={[styles.statItem, styles.netBalance]}>
                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Net Balance
                </Text>
                <Text style={[styles.statValue, { color: getBalanceColor(totalBalance.netBalance) }]}>
                  ${totalBalance.netBalance.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'groups' && (
          <View style={styles.listContainer}>
            {groupBalances.length > 0 ? (
              groupBalances.map((item, index) => renderBalanceCard(item, index))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={[styles.emptyStateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  No group balances to settle
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'friends' && (
          <View style={styles.listContainer}>
            {friendBalances.length > 0 ? (
              friendBalances.map((item, index) => renderBalanceCard(item, index))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
                <Ionicons name="person-outline" size={48} color="#9CA3AF" />
                <Text style={[styles.emptyStateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  No friend balances to settle
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Settlement Modal */}
      {showSettlementModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Record Settlement
            </Text>
            
            <TextInput
              value={settlementAmount}
              onChangeText={setSettlementAmount}
              placeholder="Amount"
              keyboardType="numeric"
              style={[styles.modalInput, { 
                backgroundColor: isDark ? '#374151' : '#F9FAFB',
                color: isDark ? '#FFFFFF' : '#111827',
                borderColor: isDark ? '#4B5563' : '#E5E7EB'
              }]}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSettlementModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  const amount = parseFloat(settlementAmount);
                  if (!isNaN(amount) && amount > 0) {
                    handleSettle(settlementTarget, amount);
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  totalCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalTitle: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  netBalance: {
    marginTop: 10,
  },
  listContainer: {
    marginBottom: 16,
  },
  balanceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  settleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettleUpScreen;