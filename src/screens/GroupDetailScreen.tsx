import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useExpenseStore } from '../state/useExpenseStore';
import { useUserStore } from '../state/useUserStore';
import { calculateGroupBalances, getUserName, GroupBalance } from '../utils/balanceCalculator';
import { Expense, Group, User } from '../types/index';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;

const GroupDetailScreen = () => {
  const route = useRoute<GroupDetailRouteProp>();
  const navigation = useNavigation();
  const { groupId } = route.params;
  const { groups, expenses, loading: expensesLoading } = useExpenseStore();
  const { users, currentUser, fetchUsers, loading: usersLoading } = useUserStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<GroupBalance | null>(null);
  const [tab, setTab] = useState<'overview' | 'expenses' | 'members'>('overview');

  useEffect(() => {
    const foundGroup = groups.find(g => g.id === groupId);
    setGroup(foundGroup || null);

    if (foundGroup) {
      const exps = expenses.filter(exp => exp.groupId === groupId && !exp.isDraft);
      setGroupExpenses(exps);

      if (currentUser?.id) {
        const bal = calculateGroupBalances(foundGroup, exps, users, currentUser.id);
        setBalance(bal);
      }
    }
  }, [groupId, groups, expenses, users, currentUser]);

  useEffect(() => {
    const userIds = group?.members || [];
    fetchUsers(userIds);
  }, [group]);

  const renderExpenseCard = useCallback(({ item }: { item: Expense }) => {
    const payerName = getUserName(item.paidBy, users);
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ExpenseDetail' as never, { expenseId: item.id })}
      >
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text>Amount: {item.amount} {item.currency}</Text>
        <Text>Paid by: {payerName}</Text>
        <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
      </TouchableOpacity>
    );
  }, [users, navigation]);

  const renderMemberCard = useCallback(({ item: memberId }: { item: string }) => {
    const member = users.find(u => u.id === memberId);
    const memberBalance = balance?.detailedBalances[memberId] || 0;
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{member?.name || 'Unknown'}</Text>
        <Text>Balance: {memberBalance.toFixed(2)} USD</Text>
      </View>
    );
  }, [users, balance]);

  if (expensesLoading || usersLoading || !group) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group.name}</Text>
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setTab('overview')} style={[styles.tab, tab === 'overview' && styles.activeTab]}>
          <Text>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('expenses')} style={[styles.tab, tab === 'expenses' && styles.activeTab]}>
          <Text>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('members')} style={[styles.tab, tab === 'members' && styles.activeTab]}>
          <Text>Members</Text>
        </TouchableOpacity>
      </View>

      {tab === 'overview' && balance && (
        <View>
          <Text>You are owed: {balance.totalOwed.toFixed(2)}</Text>
          <Text>You owe: {balance.totalOwing.toFixed(2)}</Text>
          <Text>Net: {balance.netBalance.toFixed(2)}</Text>
        </View>
      )}

      {tab === 'expenses' && (
        <FlatList
          data={groupExpenses}
          renderItem={renderExpenseCard}
          keyExtractor={item => item.id}
        />
      )}

      {tab === 'members' && (
        <FlatList
          data={group.members}
          renderItem={renderMemberCard}
          keyExtractor={item => item}
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('SplitBill' as never)}
        >
          <Text>Add Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('SettleUp' as never, { groupId })}
        >
          <Text>Settle Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  tabBar: { flexDirection: 'row', marginBottom: 16 },
  tab: { padding: 8, marginRight: 8 },
  activeTab: { borderBottomWidth: 2, borderColor: 'blue' },
  card: { padding: 16, backgroundColor: '#f0f0f0', marginBottom: 8, borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  button: { padding: 12, backgroundColor: '#ddd', borderRadius: 8 },
});

export default GroupDetailScreen;