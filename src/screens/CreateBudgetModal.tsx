import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { getCurrencySymbol, getCurrencyForMode } from '../utils/currencyUtils';

interface CreateBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMode?: 'local' | 'home';
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  category: string;
  period: string;
  startDate: Date;
  endDate: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({ visible, onClose, selectedMode = 'local' }) => {
  const { currentUser, settings } = useUserStore();
  const { addBudget } = useExpenseStore();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [period, setPeriod] = useState('monthly');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'general', label: '📊 General Budget' },
    { value: 'food', label: '🍕 Food & Dining' },
    { value: 'transportation', label: '🚗 Transportation' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'utilities', label: '💡 Utilities' },
    { value: 'healthcare', label: '🏥 Healthcare' },
    { value: 'education', label: '📚 Education' },
    { value: 'rent', label: '🏠 Rent' },
    { value: 'groceries', label: '🛒 Groceries' },
    { value: 'savings', label: '💰 Savings' },
  ];

  const periods = [
    { value: 'weekly', label: '📅 Weekly' },
    { value: 'monthly', label: '📅 Monthly' },
    { value: 'daily', label: '📅 Daily' },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const newBudget = {
        id: Date.now().toString(),
        category,
        limit: numAmount,
        spent: 0,
        currency: getCurrencyForMode(selectedMode, settings.primaryCurrency, settings.homeCurrency),
        period: period as 'daily' | 'weekly' | 'monthly',
        isHomeCountry: selectedMode === 'home',
        userId: currentUser?.id || '1',
        createdAt: now,
        alertThreshold: 80,
        isActive: true,
      };

      await addBudget(newBudget);
      
      Alert.alert('Success', 'Budget created successfully!');
      handleReset();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = (startDate: Date, period: string): Date => {
    const endDate = new Date(startDate);
    switch (period) {
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }
    return endDate;
  };

  const handleReset = () => {
    setName('');
    setAmount('');
    setCategory('general');
    setPeriod('monthly');
    setDescription('');
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel',
      'Are you sure you want to cancel? All entered data will be lost.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => {
          handleReset();
          onClose();
        }},
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Budget</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.headerButton, loading && styles.headerButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Creating...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Budget Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Monthly Food Budget"
              placeholderTextColor="#999"
            />
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>
                {getCurrencySymbol(getCurrencyForMode(selectedMode, settings.primaryCurrency, settings.homeCurrency))}
              </Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Category Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {categories.map((cat) => (
                  <Picker.Item
                    key={cat.value}
                    label={cat.label}
                    value={cat.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Period Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Period</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={period}
                onValueChange={setPeriod}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {periods.map((p) => (
                  <Picker.Item
                    key={p.value}
                    label={p.label}
                    value={p.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes about this budget..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Budget Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Preview</Text>
            <View style={styles.previewContainer}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Budget Name:</Text>
                <Text style={styles.previewValue}>{name || 'Not set'}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Amount:</Text>
                <Text style={styles.previewValue}>
                  {amount ? `$${parseFloat(amount).toFixed(2)}` : '$0.00'}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Category:</Text>
                <Text style={styles.previewValue}>
                  {categories.find(c => c.value === category)?.label || 'General'}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Period:</Text>
                <Text style={styles.previewValue}>
                  {periods.find(p => p.value === period)?.label || 'Monthly'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default CreateBudgetModal; 