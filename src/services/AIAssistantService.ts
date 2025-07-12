import { getOpenAITextResponse, getAnthropicTextResponse } from '../api/chat-service';
import { AIMessage } from '../types/ai';
import { Expense, PersonalExpense, Budget, FinancialGoal, Chore } from '../types';

export interface AIInsight {
  id: string;
  type: 'spending' | 'budgeting' | 'savings' | 'warning' | 'tip' | 'goal';
  title: string;
  message: string;
  actionable: boolean;
  action?: string;
  confidence: number;
  createdAt: Date;
}

export interface ChatContext {
  expenses: Expense[];
  personalExpenses: PersonalExpense[];
  budgets: Budget[];
  goals: FinancialGoal[];
  chores: Chore[];
  currentBalance: number;
  totalOwed: number;
  totalOwing: number;
}

class AIAssistantService {
  private conversationHistory: AIMessage[] = [];

  // Main chat interface
  async chat(userMessage: string, context: ChatContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: userMessage }
      ];

      const response = await getOpenAITextResponse(messages);
      
      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response.content }
      );

      return response.content;
    } catch (error) {
      console.error('AI Chat Error:', error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  }

  // Generate financial insights
  async generateInsights(context: ChatContext): Promise<AIInsight[]> {
    try {
      const prompt = this.buildInsightPrompt(context);
      const response = await getAnthropicTextResponse([
        { role: 'user', content: prompt }
      ]);

      return this.parseInsights(response.content);
    } catch (error) {
      console.error('AI Insights Error:', error);
      return [];
    }
  }

  // Analyze receipt and extract items
  async analyzeReceipt(imageBase64: string): Promise<{
    items: Array<{ name: string; price: number; category: string }>;
    total: number;
    merchant: string;
    date: string;
  }> {
    try {
      const messages: AIMessage[] = [
        {
          role: 'user',
          content: `Analyze this receipt image and extract all items with their prices. Return the data in this exact JSON format:
          {
            "merchant": "store name",
            "date": "YYYY-MM-DD",
            "total": 0.00,
            "items": [
              {"name": "item name", "price": 0.00, "category": "food/beverage/household/personal/other"}
            ]
          }
          
          Be very thorough and capture ALL items, even small ones. For restaurants, include each dish separately. Image: data:image/jpeg;base64,${imageBase64}`
        }
      ];

      const response = await getOpenAITextResponse(messages, { model: 'gpt-4o' });
      
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
      }

      // Fallback if JSON parsing fails
      return {
        items: [],
        total: 0,
        merchant: 'Unknown',
        date: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Receipt Analysis Error:', error);
      throw error;
    }
  }

  // Smart expense categorization
  async categorizeExpense(description: string, amount: number, merchant?: string): Promise<{
    category: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const prompt = `Categorize this expense for an international student:
      Description: "${description}"
      Amount: $${amount}
      Merchant: "${merchant || 'Unknown'}"
      
      Choose from: food, transportation, utilities, entertainment, shopping, healthcare, education, rent, groceries, other
      
      Respond with JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;

      const response = await getOpenAITextResponse([
        { role: 'user', content: prompt }
      ]);

      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Categorization Parse Error:', parseError);
      }

      return {
        category: 'other',
        confidence: 0.5,
        reasoning: 'Unable to determine category automatically'
      };
    } catch (error) {
      console.error('Categorization Error:', error);
      return {
        category: 'other',
        confidence: 0.5,
        reasoning: 'Error occurred during categorization'
      };
    }
  }

  // Budget recommendations
  async generateBudgetRecommendations(context: ChatContext): Promise<Array<{
    category: string;
    suggestedAmount: number;
    reasoning: string;
  }>> {
    try {
      const prompt = this.buildBudgetRecommendationPrompt(context);
      const response = await getAnthropicTextResponse([
        { role: 'user', content: prompt }
      ]);

      return this.parseBudgetRecommendations(response.content);
    } catch (error) {
      console.error('Budget Recommendations Error:', error);
      return [];
    }
  }

  // Goal progress analysis
  async analyzeGoalProgress(goal: FinancialGoal, recentExpenses: PersonalExpense[]): Promise<{
    likelihood: number;
    recommendations: string[];
    adjustedTimeline?: Date;
  }> {
    try {
      const prompt = `Analyze this financial goal for an international student:
      
      Goal: ${goal.title}
      Target: $${goal.targetAmount}
      Current: $${goal.currentAmount}
      Deadline: ${goal.targetDate.toISOString().split('T')[0]}
      Priority: ${goal.priority}
      
      Recent spending patterns:
      ${recentExpenses.slice(0, 10).map(e => `- ${e.title}: $${e.amount} (${e.category})`).join('\n')}
      
      Provide analysis in JSON format:
      {
        "likelihood": 0.0-1.0,
        "recommendations": ["actionable tip 1", "actionable tip 2"],
        "adjustedTimeline": "YYYY-MM-DD or null"
      }`;

      const response = await getAnthropicTextResponse([
        { role: 'user', content: prompt }
      ]);

      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            likelihood: parsed.likelihood || 0.5,
            recommendations: parsed.recommendations || [],
            adjustedTimeline: parsed.adjustedTimeline ? new Date(parsed.adjustedTimeline) : undefined
          };
        }
      } catch (parseError) {
        console.error('Goal Analysis Parse Error:', parseError);
      }

      return {
        likelihood: 0.5,
        recommendations: ['Unable to analyze goal progress automatically'],
        adjustedTimeline: undefined
      };
    } catch (error) {
      console.error('Goal Analysis Error:', error);
      return {
        likelihood: 0.5,
        recommendations: ['Error occurred during goal analysis'],
        adjustedTimeline: undefined
      };
    }
  }

  private buildSystemPrompt(context: ChatContext): string {
    return `You are BillChop AI, a smart financial assistant for international students and roommates. You help with:

1. EXPENSE MANAGEMENT: Splitting bills, tracking shared expenses, managing group finances
2. PERSONAL FINANCE: Budgeting, savings goals, spending insights
3. CHORE COORDINATION: Managing shared responsibilities and rewards
4. INTERNATIONAL STUDENT SUPPORT: Dual-currency management, cultural financial tips

CURRENT CONTEXT:
- Balance: $${context.currentBalance.toFixed(2)}
- You're owed: $${context.totalOwed.toFixed(2)}
- You owe: $${context.totalOwing.toFixed(2)}
- Active budgets: ${context.budgets.length}
- Active goals: ${context.goals.length}
- Recent expenses: ${context.expenses.length + context.personalExpenses.length}

PERSONALITY:
- Friendly and supportive, understanding the challenges of international students
- Practical and actionable advice
- Culturally sensitive to different financial backgrounds
- Encouraging about financial goals and responsible spending

CAPABILITIES:
- Analyze spending patterns and provide insights
- Help split bills and calculate fair shares
- Suggest budget optimizations
- Track progress toward financial goals
- Coordinate chores and expenses with roommates
- Provide currency conversion and international money tips

Always be helpful, specific, and provide actionable advice. Use emojis appropriately to make conversations engaging.`;
  }

  private buildInsightPrompt(context: ChatContext): string {
    const recentExpenses = [...context.expenses, ...context.personalExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    return `Analyze this international student's financial data and generate 3-5 actionable insights:

FINANCIAL OVERVIEW:
- Current Balance: $${context.currentBalance.toFixed(2)}
- Total Owed by Others: $${context.totalOwed.toFixed(2)}
- Total Owing: $${context.totalOwing.toFixed(2)}

RECENT EXPENSES (last 20):
${recentExpenses.map(e => `- ${e.title}: $${e.amount} (${e.category}) - ${e.date}`).join('\n')}

ACTIVE BUDGETS:
${context.budgets.map(b => `- ${b.category}: $${b.spent}/$${b.limit} (${(b.spent/b.limit*100).toFixed(1)}%)`).join('\n')}

GOALS:
${context.goals.map(g => `- ${g.title}: $${g.currentAmount}/$${g.targetAmount} (${((g.currentAmount/g.targetAmount)*100).toFixed(1)}%)`).join('\n')}

Generate insights in this JSON format:
[
  {
    "type": "spending/budgeting/savings/warning/tip/goal",
    "title": "Brief insight title",
    "message": "Detailed actionable message",
    "actionable": true/false,
    "action": "specific action to take",
    "confidence": 0.0-1.0
  }
]

Focus on:
1. Budget overspending or underutilization
2. Unusual spending patterns
3. Goal progress and recommendations
4. Money-saving opportunities
5. Bill splitting optimization`;
  }

  private buildBudgetRecommendationPrompt(context: ChatContext): string {
    const monthlyExpenses = context.personalExpenses
      .filter(e => e.type === 'expense')
      .reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

    return `Based on this international student's spending patterns, recommend monthly budgets:

CURRENT MONTHLY SPENDING BY CATEGORY:
${Object.entries(monthlyExpenses).map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)}`).join('\n')}

CURRENT BALANCE: $${context.currentBalance.toFixed(2)}

Generate budget recommendations in JSON format:
[
  {
    "category": "category_name",
    "suggestedAmount": 000.00,
    "reasoning": "why this amount makes sense"
  }
]

Consider:
1. Current spending patterns
2. International student lifestyle
3. Essential vs discretionary spending
4. Seasonal variations (textbooks, travel home, etc.)
5. Emergency buffer recommendations`;
  }

  private parseInsights(content: string): AIInsight[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((insight: any, index: number) => ({
          id: `ai-insight-${Date.now()}-${index}`,
          type: insight.type || 'tip',
          title: insight.title || 'Financial Insight',
          message: insight.message || insight.description || '',
          actionable: insight.actionable || false,
          action: insight.action || '',
          confidence: insight.confidence || 0.7,
          createdAt: new Date()
        }));
      }
    } catch (error) {
      console.error('Parse Insights Error:', error);
    }
    return [];
  }

  private parseBudgetRecommendations(content: string): Array<{
    category: string;
    suggestedAmount: number;
    reasoning: string;
  }> {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Parse Budget Recommendations Error:', error);
    }
    return [];
  }

  // Clear conversation history
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory(): AIMessage[] {
    return [...this.conversationHistory];
  }
}

export const aiAssistant = new AIAssistantService();