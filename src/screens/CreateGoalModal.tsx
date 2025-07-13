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

interface CreateGoalModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMode?: 'local' | 'home';
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline: Date;
  description: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ visible, onClose, selectedMode = 'local' }) => {
  const { currentUser, settings } = useUserStore();
  const { addGoal } = useExpenseStore();
  
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [category, setCategory] = useState('savings');
  const [deadline, setDeadline] = useState(new Date());
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'savings', label: '💰 Savings Goal' },
    { value: 'vacation', label: '✈️ Vacation' },
    { value: 'car', label: '🚗 Car Purchase' },
    { value: 'house', label: '🏠 House Down Payment' },
    { value: 'education', label: '📚 Education' },
    { value: 'wedding', label: '💒 Wedding' },
    { value: 'emergency', label: '🆘 Emergency Fund' },
    { value: 'investment', label: '📈 Investment' },
    { value: 'gadget', label: '📱 Gadget Purchase' },
    { value: 'other', label: '🎯 Other Goal' },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !targetAmount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(targetAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (deadline <= new Date()) {
      Alert.alert('Error', 'Deadline must be in the future');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const newGoal = {
        id: Date.now().toString(),
        title: name.trim(),
        description: description.trim(),
        targetAmount: numAmount,
        currentAmount: 0,
        currency: getCurrencyForMode(selectedMode, settings.primaryCurrency, settings.homeCurrency),
        category,
        targetDate: deadline,
        isHomeCountry: selectedMode === 'home',
        userId: currentUser?.id || '1',
        createdAt: now,
        isCompleted: false,
        priority: 'medium' as const,
      };

      await addGoal(newGoal);
      
      Alert.alert('Success', 'Goal created successfully!');
      handleReset();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setTargetAmount('');
    setCategory('savings');
    setDeadline(new Date());
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

  const calculateProgress = () => {
    if (!targetAmount) return 0;
    const target = parseFloat(targetAmount);
    return target > 0 ? 0 : 0; // Will be 0 for new goals
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress >= 100) return '#28a745';
    if (progress >= 75) return '#17a2b8';
    if (progress >= 50) return '#ffc107';
    return '#dc3545';
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
          <Text style={styles.headerTitle}>Create Goal</Text>
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
          {/* Goal Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Save for Vacation"
              placeholderTextColor="#999"
            />
          </View>

          {/* Target Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>
                {getCurrencySymbol(getCurrencyForMode(selectedMode, settings.primaryCurrency, settings.homeCurrency))}
              </Text>
              <TextInput
                style={styles.amountInput}
                value={targetAmount}
                onChangeText={setTargetAmount}
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

          {/* Deadline Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deadline</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.dateText}>
                {deadline.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details about your goal..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Goal Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Preview</Text>
            <View style={styles.previewContainer}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Goal Name:</Text>
                <Text style={styles.previewValue}>{name || 'Not set'}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Target Amount:</Text>
                <Text style={styles.previewValue}>
                  {targetAmount ? `$${parseFloat(targetAmount).toFixed(2)}` : '$0.00'}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Category:</Text>
                <Text style={styles.previewValue}>
                  {categories.find(c => c.value === category)?.label || 'Savings'}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Deadline:</Text>
                <Text style={styles.previewValue}>
                  {deadline.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>0%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${calculateProgress()}%`,
                        backgroundColor: getProgressColor()
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  $0.00 of ${targetAmount || '0.00'} saved
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
  progressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default CreateGoalModal; 