import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Button, FlatList } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useExpenseStore } from '../state/useExpenseStore';
import { useUserStore } from '../state/useUserStore';
import { calculateTotalBalances, GroupBalance, FriendBalance, calculateGroupBalances, calculateFriendBalances, BalanceCalculation } from '../utils/balanceCalculator';

type SettleUpRouteProp = RouteProp<RootStackParamList, 'SettleUp'>;

const SettleUpScreen = () => {
  const route = useRoute<SettleUpRouteProp>();
  const navigation = useNavigation();
  const { groupId, friendId } = route.params || {};
  const { groups, expenses, balances, settleBalance } = useExpenseStore();
  const { currentUser, friends } = useUserStore();

  const [totalBalance, setTotalBalance] = useState<BalanceCalculation | null>(null);
  const [groupBalances, setGroupBalances] = useState<GroupBalance[]>([]);
  const [friendBalances, setFriendBalances] = useState<FriendBalance[]>([]);
  const [tab, setTab] = useState<'total' | 'groups' | 'friends'>('total');
  const [settlementAmount, setSettlementAmount] = useState<string>('');
  const [settlementTarget, setSettlementTarget] = useState<string>('');

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
        setTab('groups');
        setSettlementTarget(groupId);
      } else if (friendId) {
        setTab('friends');
        setSettlementTarget(friendId);
      }
    }
  }, [groupId, friendId, groups, expenses, friends, currentUser]);

  const handleSettle = () => {
    if (settlementTarget && currentUser?.id) {
      const amount = parseFloat(settlementAmount);
      if (!isNaN(amount)) {
        settleBalance(currentUser.id, settlementTarget, amount);
        setSettlementAmount('');
        // Refresh balances
      }
    }
  };

  const renderBalanceCard = (item: GroupBalance | FriendBalance) => (
    <View style={styles.card}>
      <Text>{'groupName' in item ? item.groupName : item.friendName}</Text>
      <Text>Net: {('netBalance' in item ? item.netBalance : item.balance).toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setTab('total')}><Text>Total</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('groups')}><Text>Groups</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('friends')}><Text>Friends</Text></TouchableOpacity>
      </View>

      {tab === 'total' && totalBalance && (
        <View>
          <Text>Total Owed: {totalBalance.totalOwed.toFixed(2)}</Text>
          <Text>Total Owing: {totalBalance.totalOwing.toFixed(2)}</Text>
          <Text>Net: {totalBalance.netBalance.toFixed(2)}</Text>
        </View>
      )}

      {tab === 'groups' && (
        <FlatList data={groupBalances} renderItem={({item}) => renderBalanceCard(item)} keyExtractor={item => item.groupId} />
      )}

      {tab === 'friends' && (
        <FlatList data={friendBalances} renderItem={({item}) => renderBalanceCard(item)} keyExtractor={item => item.friendId} />
      )}

      <View style={styles.settlementForm}>
        <TextInput 
          value={settlementAmount}
          onChangeText={setSettlementAmount}
          placeholder="Amount to settle"
          keyboardType="numeric"
        />
        <Button title="Settle" onPress={handleSettle} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  card: { padding: 16, backgroundColor: '#f0f0f0', marginBottom: 8 },
  settlementForm: { marginTop: 16 },
});

export default SettleUpScreen;