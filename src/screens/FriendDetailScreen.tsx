import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useExpenseStore } from '../state/useExpenseStore';
import { useUserStore } from '../state/useUserStore';
import { Expense } from '../types/index';
import { getUserName } from '../utils/balanceCalculator';

type FriendDetailRouteProp = RouteProp<RootStackParamList, 'FriendDetail'>;

const FriendDetailScreen = () => {
  const route = useRoute<FriendDetailRouteProp>();
  const { friendId } = route.params;
  const { expenses } = useExpenseStore();
  const { friends } = useUserStore();
  const [sharedExpenses, setSharedExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    const exps = expenses.filter(exp => !exp.groupId && exp.splitBetween.includes(friendId));
    setSharedExpenses(exps);
    // Calculate balance - use calculateFriendBalances or similar
    const friendBalance = exps.reduce((acc, exp) => {
      // Simple calculation stub
      const share = exp.amount / exp.splitBetween.length;
      return acc + (exp.paidBy === friendId ? -share : share);
    }, 0);
    setBalance(friendBalance);
  }, [friendId, expenses]);

  const friendName = getUserName(friendId, friends);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{friendName}</Text>
      <View style={styles.card}>
        <Text>Balance: {balance.toFixed(2)}</Text>
      </View>
      <Text style={styles.sectionTitle}>Shared Expenses</Text>
      <FlatList
        data={sharedExpenses}
        renderItem={({item}) => <Text>{item.title} - {item.amount}</Text>}
        keyExtractor={item => item.id}
      />
      <View style={styles.actions}>
        <Button title="Settle Up" onPress={() => {}} />
        <Button title="Add Expense" onPress={() => {}} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
});

export default FriendDetailScreen; 