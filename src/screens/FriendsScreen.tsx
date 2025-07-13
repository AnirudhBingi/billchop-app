import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useExpenseStore } from '../state/useExpenseStore';
import { useUserStore } from '../state/useUserStore';
import { calculateFriendBalances, calculateTotalBalances, getUserName, FriendBalance, BalanceCalculation } from '../utils/balanceCalculator';
import { Expense, User } from '../types/index';

const FriendsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { expenses, loading: expensesLoading } = useExpenseStore();
  const { friends, currentUser, fetchFriends, loading: friendsLoading } = useUserStore();

  const [friendBalances, setFriendBalances] = useState<FriendBalance[]>([]);
  const [totalBalance, setTotalBalance] = useState<BalanceCalculation | null>(null);
  const [recentActivity, setRecentActivity] = useState<Expense[]>([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (currentUser?.id && friends.length > 0) {
      const balances = calculateFriendBalances(expenses, friends, currentUser.id);
      setFriendBalances(balances);

      // Assuming no groups for friends screen, but can add if needed
      const total = calculateTotalBalances([], balances);
      setTotalBalance(total);

      // Get recent activity
      const friendExpenses = expenses
        .filter(exp => !exp.groupId && exp.splitBetween.some(id => friends.some(f => f.id === id)))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      setRecentActivity(friendExpenses);
    }
  }, [expenses, friends, currentUser]);

  const renderFriendCard = useCallback(({ item }: { item: FriendBalance }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('FriendDetail', { friendId: item.friendId })}
    >
      <Text style={styles.cardTitle}>{item.friendName}</Text>
      <Text>Balance: {item.balance.toFixed(2)} {'USD' /* Add currency */}</Text>
      <Text>Last: {item.lastTransaction.toLocaleDateString()}</Text>
    </TouchableOpacity>
  ), [navigation]);

  const renderActivityItem = useCallback(({ item }: { item: Expense }) => {
    const payerName = getUserName(item.paidBy, friends);
    return (
      <View style={styles.activityItem}>
        <Text>{item.title} - {payerName} paid {item.amount}</Text>
      </View>
    );
  }, [friends]);

  if (expensesLoading || friendsLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>

      {totalBalance && (
        <View style={styles.summary}>
          <Text>You are owed: {totalBalance.totalOwed.toFixed(2)}</Text>
          <Text>You owe: {totalBalance.totalOwing.toFixed(2)}</Text>
          <Text>Net: {totalBalance.netBalance.toFixed(2)}</Text>
        </View>
      )}

      <FlatList
        data={friendBalances}
        renderItem={renderFriendCard}
        keyExtractor={item => item.friendId}
        ListHeaderComponent={(
          <View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <FlatList
              data={recentActivity}
              renderItem={renderActivityItem}
              keyExtractor={item => item.id}
            />
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('AddFriend')}
      >
        <Text>Add Friend</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  summary: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
  card: { padding: 16, backgroundColor: '#f0f0f0', marginBottom: 8, borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  activityItem: { padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  button: { padding: 12, backgroundColor: '#ddd', borderRadius: 8, marginTop: 16 },
});

export default FriendsScreen;