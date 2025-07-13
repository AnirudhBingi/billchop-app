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
import { useExpenseStore } from '../state/useExpenseStore';
import { useUserStore } from '../state/useUserStore';
import { getCurrencySymbol, getCurrencyForMode } from '../utils/currencyUtils';

interface AddIncomeModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMode?: 'local' | 'home';
}

const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ visible, onClose, selectedMode = 'local' }) => {
  const { addPersonalExpense } = useExpenseStore();
  const { currentUser, settings } = useUserStore();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const incomeSources = [
    { value: 'salary', label: '💰 Salary' },
    { value: 'freelance', label: '💼 Freelance' },
    { value: 'part_time', label: '⏰ Part-time' },
    { value: 'family_support', label: '👨‍👩‍👧‍👦 Family Support' },
    { value: 'scholarship', label: '🎓 Scholarship' },
    { value: 'investment', label: '📈 Investment' },
    { value: 'other', label: '📦 Other' },
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !amount.trim()) {
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
      const newIncome = {
        id: Date.now().toString(),
        title: title.trim(),
        amount: numAmount,
        category: source as any,
        type: 'income' as const,
        date: date,
        currency: getCurrencyForMode(selectedMode, settings.primaryCurrency, settings.homeCurrency),
        description: description.trim(),
        isHomeCountry: selectedMode === 'home',
        userId: currentUser?.id || '1',
        createdAt: new Date(),
      };

      await addPersonalExpense(newIncome);
      Alert.alert('Success', 'Income added successfully!');
      handleReset();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to add income. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setAmount('');
    setSource('salary');
    setDescription('');
    setDate(new Date());
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
          <Text style={styles.headerTitle}>Add Income</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.headerButton, loading && styles.headerButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
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

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="What income did you receive?"
              placeholderTextColor="#999"
            />
          </View>

          {/* Source Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Source</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={source}
                onValueChange={setSource}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {incomeSources.map((source) => (
                  <Picker.Item
                    key={source.value}
                    label={source.label}
                    value={source.value}
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
              placeholder="Add more details about this income..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Date Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
});

export default AddIncomeModal; 