import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { ExpenseCategory } from '../types';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { openAIClient } from '../api/openai';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: ExpenseCategory;
  selected: boolean;
  splitWith: string[];
}

interface ReceiptData {
  total: number;
  tax: number;
  tip: number;
  items: ReceiptItem[];
  merchant: string;
  date: string;
}

export default function ReceiptScanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings, friends } = useUserStore();
  const { addExpense } = useExpenseStore();
  
  const isDark = settings.theme === 'dark';
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // AI-powered receipt analysis
  const analyzeReceipt = async (imageUri: string) => {
    try {
      setIsScanning(true);
      
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await openAIClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information in JSON format:
                {
                  "merchant": "store name",
                  "date": "YYYY-MM-DD",
                  "total": number,
                  "tax": number,
                  "tip": number,
                  "items": [
                    {
                      "name": "item name",
                      "price": number,
                      "quantity": number,
                      "category": "groceries|food|entertainment|shopping|transportation|utilities|healthcare|education|rent|other"
                    }
                  ]
                }
                
                For categories, use:
                - groceries: food items, produce, household items
                - food: restaurant meals, takeout
                - entertainment: movies, games, alcohol
                - shopping: clothes, electronics, general retail
                - transportation: gas, parking, rideshare
                - utilities: phone, internet bills
                - healthcare: pharmacy, medical
                - education: books, supplies
                - rent: housing related
                - other: everything else
                
                Return ONLY the JSON object, no other text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      
      try {
        const analysisData = JSON.parse(analysisText) as ReceiptData;
        
        // Add IDs and selection state to items
        const itemsWithIds = analysisData.items.map((item, index) => ({
          ...item,
          id: `item_${index}`,
          selected: true, // Default all items selected
          splitWith: [currentUser?.id || '']
        }));
        
        setReceiptData({
          ...analysisData,
          items: itemsWithIds
        });
        
        setSelectedItems(itemsWithIds.map(item => item.id));
        
      } catch (parseError) {
        throw new Error('Failed to parse receipt data');
      }
      
    } catch (error) {
      console.error('Receipt analysis error:', error);
      Alert.alert('Analysis Failed', 'Could not analyze receipt. Please try again or enter manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to photos to scan receipts');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await analyzeReceipt(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera Permission', 'Please grant camera access to scan receipts');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await analyzeReceipt(result.assets[0].uri);
    }
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleItemSplitWith = (itemId: string, friendId: string) => {
    if (!receiptData) return;
    
    setReceiptData(prev => ({
      ...prev!,
      items: prev!.items.map(item => 
        item.id === itemId 
          ? {
              ...item,
              splitWith: item.splitWith.includes(friendId)
                ? item.splitWith.filter(id => id !== friendId)
                : [...item.splitWith, friendId]
            }
          : item
      )
    }));
  };

  const createExpensesFromReceipt = () => {
    if (!receiptData || !currentUser) return;

    const selectedReceiptItems = receiptData.items.filter(item => 
      selectedItems.includes(item.id) && item.splitWith.length > 0
    );

    if (selectedReceiptItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to split');
      return;
    }

    // Group items by who they're split with to create separate expenses
    const expenseGroups = new Map<string, ReceiptItem[]>();
    
    selectedReceiptItems.forEach(item => {
      const splitKey = item.splitWith.sort().join(',');
      if (!expenseGroups.has(splitKey)) {
        expenseGroups.set(splitKey, []);
      }
      expenseGroups.get(splitKey)!.push(item);
    });

    // Create expenses for each group
    expenseGroups.forEach((items, splitKey) => {
      const splitWith = splitKey.split(',');
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemNames = items.map(item => item.name).join(', ');
      
      const expense = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: `📸 ${receiptData.merchant || 'Receipt'} - ${itemNames}`,
        description: `Items: ${items.map(item => `${item.name} (${item.quantity}x$${item.price.toFixed(2)})`).join(', ')}`,
        amount: totalAmount,
        currency: 'USD',
        category: items[0].category, // Use category of first item
        paidBy: currentUser.id,
        splitBetween: splitWith,
        date: new Date(receiptData.date || Date.now()),
        createdAt: new Date(),
        isDraft: false,
      };

      addExpense(expense);
    });

    Alert.alert(
      'Success!', 
      `Created ${expenseGroups.size} expense(s) from receipt`, 
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const calculateSelectedTotal = () => {
    if (!receiptData) return 0;
    return receiptData.items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: isDark ? '#FFFFFF' : '#111827',
            marginBottom: 8
          }}>
            📸 Smart Receipt Scanner
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280'
          }}>
            AI-powered receipt analysis with selective item splitting
          </Text>
        </View>

        {/* Image Capture Section */}
        {!imageUri && (
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Capture Receipt
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={takePhoto}
                style={{
                  flex: 1,
                  padding: 20,
                  borderRadius: 12,
                  backgroundColor: '#3B82F6',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="camera" size={32} color="white" />
                <Text style={{ color: 'white', fontWeight: '600', marginTop: 8 }}>
                  Take Photo
                </Text>
              </Pressable>
              
              <Pressable
                onPress={pickImage}
                style={{
                  flex: 1,
                  padding: 20,
                  borderRadius: 12,
                  backgroundColor: '#10B981',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="images" size={32} color="white" />
                <Text style={{ color: 'white', fontWeight: '600', marginTop: 8 }}>
                  Choose Photo
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Receipt Image Preview */}
        {imageUri && (
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
          }}>
            <Image 
              source={{ uri: imageUri }} 
              style={{ 
                width: '100%', 
                height: 200, 
                borderRadius: 12,
                marginBottom: 12
              }}
              resizeMode="cover"
            />
            <Pressable
              onPress={() => {
                setImageUri(null);
                setReceiptData(null);
                setSelectedItems([]);
              }}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: '#EF4444',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                📷 Retake Photo
              </Text>
            </Pressable>
          </View>
        )}

        {/* Scanning Indicator */}
        {isScanning && (
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            alignItems: 'center'
          }}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: isDark ? '#FFFFFF' : '#111827',
              marginTop: 12
            }}>
              🤖 AI Analyzing Receipt...
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: isDark ? '#9CA3AF' : '#6B7280',
              marginTop: 4,
              textAlign: 'center'
            }}>
              Extracting items, prices, and categories
            </Text>
          </View>
        )}

        {/* Receipt Analysis Results */}
        {receiptData && !isScanning && (
          <>
            {/* Receipt Summary */}
            <View style={{ 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: isDark ? '#FFFFFF' : '#111827',
                marginBottom: 16
              }}>
                📄 Receipt Summary
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Merchant:</Text>
                <Text style={{ fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>
                  {receiptData.merchant}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Date:</Text>
                <Text style={{ fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>
                  {new Date(receiptData.date).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Total Amount:</Text>
                <Text style={{ fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>
                  ${receiptData.total.toFixed(2)}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Selected Items:</Text>
                <Text style={{ fontWeight: '600', color: '#3B82F6' }}>
                  ${calculateSelectedTotal().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Items Selection */}
            <View style={{ 
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: isDark ? '#FFFFFF' : '#111827',
                marginBottom: 16
              }}>
                🛒 Select Items to Split ({selectedItems.length}/{receiptData.items.length})
              </Text>
              
              {receiptData.items.map(item => (
                <View
                  key={item.id}
                  style={{
                    borderWidth: 2,
                    borderColor: selectedItems.includes(item.id) ? '#3B82F6' : '#E5E7EB',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    backgroundColor: selectedItems.includes(item.id) ? 
                      '#EBF5FF' : (isDark ? '#374151' : '#F9FAFB')
                  }}
                >
                  <Pressable
                    onPress={() => toggleItem(item.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                  >
                    <Ionicons
                      name={selectedItems.includes(item.id) ? 
                        "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color="#3B82F6"
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '600',
                        color: isDark ? '#FFFFFF' : '#111827' 
                      }}>
                        {item.name}
                      </Text>
                      <Text style={{ 
                        fontSize: 14, 
                        color: isDark ? '#9CA3AF' : '#6B7280'
                      }}>
                        {item.quantity}x ${item.price.toFixed(2)} • {item.category}
                      </Text>
                    </View>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '600',
                      color: '#3B82F6'
                    }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </Pressable>
                  
                  {/* Split With Section for selected items */}
                  {selectedItems.includes(item.id) && (
                    <View style={{ 
                      borderTopWidth: 1, 
                      borderTopColor: '#E5E7EB', 
                      paddingTop: 12,
                      marginTop: 8 
                    }}>
                      <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '500',
                        color: isDark ? '#FFFFFF' : '#111827',
                        marginBottom: 8
                      }}>
                        Split with:
                      </Text>
                      
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {/* Current user */}
                        <Pressable
                          onPress={() => toggleItemSplitWith(item.id, currentUser?.id || '')}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: item.splitWith.includes(currentUser?.id || '') ? '#3B82F6' : '#E5E7EB',
                            backgroundColor: item.splitWith.includes(currentUser?.id || '') ? '#3B82F6' : 'transparent'
                          }}
                        >
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '500',
                            color: item.splitWith.includes(currentUser?.id || '') ? 'white' : '#6B7280'
                          }}>
                            You
                          </Text>
                        </Pressable>
                        
                        {/* Friends */}
                        {friends.map(friend => (
                          <Pressable
                            key={friend.id}
                            onPress={() => toggleItemSplitWith(item.id, friend.id)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: item.splitWith.includes(friend.id) ? '#3B82F6' : '#E5E7EB',
                              backgroundColor: item.splitWith.includes(friend.id) ? '#3B82F6' : 'transparent'
                            }}
                          >
                            <Text style={{
                              fontSize: 12,
                              fontWeight: '500',
                              color: item.splitWith.includes(friend.id) ? 'white' : '#6B7280'
                            }}>
                              {friend.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      {receiptData && !isScanning && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          padding: 20
        }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#E5E7EB',
                alignItems: 'center'
              }}
            >
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: isDark ? '#FFFFFF' : '#111827' 
              }}>
                Cancel
              </Text>
            </Pressable>
            
            <Pressable
              onPress={createExpensesFromReceipt}
              style={{
                flex: 2,
                padding: 16,
                borderRadius: 12,
                backgroundColor: '#3B82F6',
                alignItems: 'center'
              }}
            >
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: 'white' 
              }}>
                💸 Create Expenses (${calculateSelectedTotal().toFixed(2)})
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}