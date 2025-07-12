import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useExpenseStore } from '../state/useExpenseStore';
import { useChoreStore } from '../state/useChoreStore';
import { aiAssistant, ChatContext } from '../services/AIAssistantService';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Refined Color Palette
const THEME_COLORS = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  primary: '#6366F1',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#F3F4F6'
};

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

const QUICK_ACTIONS = [
  { id: 'analyze', title: '📊 Analyze Spending', prompt: 'Analyze my recent spending patterns and give me insights' },
  { id: 'budget', title: '💰 Budget Help', prompt: 'Help me create a budget based on my spending' },
  { id: 'split', title: '🧾 Split Bill', prompt: 'Help me split a bill with my roommates' },
  { id: 'goals', title: '🎯 Goal Progress', prompt: 'How am I doing with my financial goals?' },
  { id: 'save', title: '💡 Save Money', prompt: 'Give me tips to save money as an international student' },
  { id: 'currency', title: '💱 Currency Help', prompt: 'Help me manage expenses in different currencies' }
];

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useUserStore();
  const { expenses, personalExpenses, budgets, financialGoals, getTotalOwed, getTotalOwing } = useExpenseStore();
  const { chores, getUserPoints } = useChoreStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      content: `Hi ${currentUser?.name || 'there'}! 👋 I'm your BillChop AI assistant. I can help you with:\n\n💰 Managing expenses and splitting bills\n📊 Analyzing spending patterns\n🎯 Tracking financial goals\n✅ Coordinating chores with roommates\n💡 Money-saving tips for international students\n\nWhat would you like help with today?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const userId = currentUser?.id || '';
  const userPersonalExpenses = personalExpenses.filter(e => e.userId === userId);
  const totalIncome = userPersonalExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = userPersonalExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const buildChatContext = (): ChatContext => ({
    expenses,
    personalExpenses: userPersonalExpenses,
    budgets: budgets.filter(b => b.userId === userId),
    goals: financialGoals.filter(g => g.userId === userId),
    chores: chores.filter(c => c.assignedTo === userId),
    currentBalance: netBalance,
    totalOwed: getTotalOwed(userId),
    totalOwing: getTotalOwing(userId)
  });

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      content: 'BillChop AI is thinking...',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const context = buildChatContext();
      const response = await aiAssistant.chat(text.trim(), context);

      // Remove typing indicator and add response
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        return [...withoutTyping, {
          id: (Date.now() + 1).toString(),
          content: response,
          isUser: false,
          timestamp: new Date()
        }];
      });
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        return [...withoutTyping, {
          id: (Date.now() + 1).toString(),
          content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
          isUser: false,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    sendMessage(action.prompt);
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const ChatBubble = ({ message }: { message: ChatMessage }) => (
    <Animated.View 
      entering={FadeInUp}
      className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}
    >
      <View 
        className={`max-w-[80%] rounded-2xl p-4 ${
          message.isUser 
            ? 'bg-primary rounded-br-md' 
            : message.isTyping 
              ? 'bg-gray-100 rounded-bl-md'
              : 'bg-gray-100 rounded-bl-md'
        }`}
        style={{
          backgroundColor: message.isUser 
            ? THEME_COLORS.primary 
            : message.isTyping 
              ? THEME_COLORS.surface
              : THEME_COLORS.surface
        }}
      >
        {message.isTyping ? (
          <View className="flex-row items-center">
            <View className="flex-row space-x-1">
              <View 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: THEME_COLORS.textLight }}
              />
              <View 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: THEME_COLORS.textLight }}
              />
              <View 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: THEME_COLORS.textLight }}
              />
            </View>
          </View>
        ) : (
          <Text 
            className="text-base leading-6"
            style={{ 
              color: message.isUser ? 'white' : THEME_COLORS.text 
            }}
          >
            {message.content}
          </Text>
        )}
      </View>
      <Text 
        className="text-xs mt-1 px-2"
        style={{ color: THEME_COLORS.textLight }}
      >
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View 
        style={{ 
          flex: 1, 
          backgroundColor: THEME_COLORS.background,
          paddingTop: insets.top 
        }}
      >
        {/* Header */}
        <View 
          className="flex-row items-center px-6 py-4"
          style={{ backgroundColor: THEME_COLORS.card, borderBottomWidth: 1, borderBottomColor: THEME_COLORS.border }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-4 p-2 rounded-full"
            style={{ backgroundColor: THEME_COLORS.surface }}
          >
            <Ionicons name="arrow-back" size={24} color={THEME_COLORS.text} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold" style={{ color: THEME_COLORS.text }}>
              🤖 BillChop AI
            </Text>
            <Text className="text-sm" style={{ color: THEME_COLORS.textSecondary }}>
              Your smart financial assistant
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Alert.alert(
                'Clear Chat',
                'Are you sure you want to clear the conversation history?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Clear', 
                    style: 'destructive',
                    onPress: () => {
                      setMessages([messages[0]]); // Keep welcome message
                      aiAssistant.clearHistory();
                    }
                  }
                ]
              );
            }}
            className="p-2 rounded-full"
            style={{ backgroundColor: THEME_COLORS.surface }}
          >
            <Ionicons name="refresh" size={20} color={THEME_COLORS.textSecondary} />
          </Pressable>
        </View>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <Animated.View 
            entering={FadeInDown}
            className="px-6 py-4"
          >
            <Text className="text-lg font-semibold mb-3" style={{ color: THEME_COLORS.text }}>
              Quick Actions
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {QUICK_ACTIONS.map(action => (
                  <Pressable
                    key={action.id}
                    onPress={() => handleQuickAction(action)}
                    className="rounded-xl p-3 min-w-[120px]"
                    style={{ 
                      backgroundColor: THEME_COLORS.surface,
                      borderWidth: 1,
                      borderColor: THEME_COLORS.border
                    }}
                  >
                    <Text 
                      className="text-sm font-medium text-center"
                      style={{ color: THEME_COLORS.text }}
                      numberOfLines={2}
                    >
                      {action.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Chat Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
        >
          {messages.map(message => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </ScrollView>

        {/* Input Area */}
        <View 
          className="px-6 py-4"
          style={{ 
            backgroundColor: THEME_COLORS.card,
            borderTopWidth: 1,
            borderTopColor: THEME_COLORS.border
          }}
        >
          <View className="flex-row items-end gap-3">
            <View 
              className="flex-1 rounded-2xl px-4 py-3"
              style={{ 
                backgroundColor: THEME_COLORS.surface,
                borderWidth: 1,
                borderColor: THEME_COLORS.border,
                maxHeight: 120
              }}
            >
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about expenses, budgets, goals..."
                placeholderTextColor={THEME_COLORS.textLight}
                multiline
                style={{ 
                  color: THEME_COLORS.text,
                  fontSize: 16,
                  minHeight: 20
                }}
                onSubmitEditing={() => sendMessage(inputText)}
                editable={!isLoading}
              />
            </View>
            <Pressable
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ 
                backgroundColor: (!inputText.trim() || isLoading) 
                  ? THEME_COLORS.textLight 
                  : THEME_COLORS.primary
              }}
            >
              <Ionicons 
                name={isLoading ? "hourglass" : "send"} 
                size={20} 
                color="white" 
              />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}