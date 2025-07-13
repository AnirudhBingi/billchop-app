import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useExpenseStore } from '../state/useExpenseStore';
import { Expense } from '../types/index';

type ExpenseDetailRouteProp = RouteProp<RootStackParamList, 'ExpenseDetail'>;

const ExpenseDetailScreen = () => {
  const route = useRoute<ExpenseDetailRouteProp>();
  const { expenseId } = route.params;
  const { expenses } = useExpenseStore();
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    const foundExpense = expenses.find(e => e.id === expenseId);
    setExpense(foundExpense || null);
  }, [expenseId, expenses]);

  if (!expense) {
    return <View><Text>Expense not found</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{expense.title}</Text>
      <View style={styles.card}>
        <Text>Amount: {expense.amount} {expense.currency}</Text>
        <Text>Category: {expense.category}</Text>
        <Text>Date: {new Date(expense.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.sectionTitle}>Description</Text>
      <Text>{expense.description || 'No description'}</Text>
      <Text style={styles.sectionTitle}>Split Between</Text>
      <View>
        {expense.splitBetween.map(id => (
          <Text key={id}>User ID: {id}</Text> // Replace with name
        ))}
      </View>
      <View style={styles.actions}>
        <Button title="Edit" onPress={() => {}} />
        <Button title="Delete" onPress={() => {}} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 16, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 },
});

export default ExpenseDetailScreen; 