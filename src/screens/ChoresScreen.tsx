import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useChoreStore } from '../state/useChoreStore';
import { useExpenseStore } from '../state/useExpenseStore';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { Chore } from '../types';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChoresScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentUser, settings, friends } = useUserStore();
  const { chores, leaderboard, getUserPoints, updateChore } = useChoreStore();
  const { groups } = useExpenseStore();
  const [selectedTab, setSelectedTab] = useState<'chores' | 'leaderboard' | 'groups'>('chores');
  
  const isDark = settings.theme === 'dark';

  // Mock enhanced chore data for demonstration
  const mockChoreGroups = [
    {
      id: 'apt_chores',
      name: 'Apartment 4B',
      type: 'apartment',
      members: 4,
      totalPoints: 245,
      completedChores: 18,
      icon: 'home',
      color: '#3B82F6'
    },
    {
      id: 'study_group',
      name: 'Study Group',
      type: 'event',
      members: 6,
      totalPoints: 180,
      completedChores: 12,
      icon: 'library',
      color: '#8B5CF6'
    }
  ];

  const mockActiveChores = [
    {
      id: 'clean_kitchen',
      title: 'Clean Kitchen',
      description: 'Deep clean kitchen counters, sink, and appliances',
      assignedTo: currentUser?.id || '',
      points: 15,
      difficulty: 'medium' as const,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      category: 'cleaning',
      groupId: 'apt_chores',
      status: 'pending' as const
    },
    {
      id: 'grocery_run',
      title: 'Grocery Shopping',
      description: 'Weekly grocery shopping for household items',
      assignedTo: friends[0]?.id || 'friend1',
      points: 20,
      difficulty: 'easy' as const,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      category: 'shopping',
      groupId: 'apt_chores',
      status: 'in_progress' as const
    },
    {
      id: 'bathroom_clean',
      title: 'Bathroom Cleaning',
      description: 'Clean and sanitize both bathrooms',
      assignedTo: friends[1]?.id || 'friend2',
      points: 25,
      difficulty: 'hard' as const,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      category: 'cleaning',
      groupId: 'apt_chores',
      status: 'pending' as const
    }
  ];

  const mockLeaderboard = [
    { 
      userId: currentUser?.id || 'you', 
      name: currentUser?.name || 'You', 
      points: 185, 
      completedChores: 12,
      rank: 1,
      streak: 5,
      badges: ['🏆', '🔥', '⭐']
    },
    { 
      userId: 'friend1', 
      name: friends[0]?.name || 'Alex Student', 
      points: 165, 
      completedChores: 11,
      rank: 2,
      streak: 3,
      badges: ['🥈', '💪']
    },
    { 
      userId: 'friend2', 
      name: friends[1]?.name || 'Sam Roommate', 
      points: 140, 
      completedChores: 9,
      rank: 3,
      streak: 2,
      badges: ['🥉']
    },
    { 
      userId: 'friend3', 
      name: friends[2]?.name || 'Jordan Friend', 
      points: 120, 
      completedChores: 8,
      rank: 4,
      streak: 1,
      badges: ['🎯']
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cleaning: 'sparkles',
      shopping: 'bag',
      maintenance: 'hammer',
      organization: 'file-tray-stacked',
      outdoor: 'leaf',
      other: 'list'
    };
    return icons[category] || 'list';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleCompleteChore = (choreId: string) => {
    Alert.alert(
      'Complete Chore',
      'Mark this chore as completed and earn points?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete', 
          onPress: () => {
            Alert.alert('🎉 Chore Completed!', 'You earned 15 points! Keep up the great work!');
          }
        }
      ]
    );
  };

  const userStats = mockLeaderboard.find(u => u.userId === currentUser?.id);

  return (
    <View 
      className={cn(
        "flex-1",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {/* Header */}
          <Animated.View entering={FadeInUp} className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-gray-900"
              )}>
                🏆 ChoreQuest
              </Text>
              <Text className={cn(
                "text-sm opacity-70",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Gamified chore management with friends
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => navigation.navigate('CreateGroup')}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: '#8B5CF6'
                }}
              >
                <Ionicons name="people" size={20} color="white" />
              </Pressable>
              
              <AnimatedButton
                title="Add Chore"
                onPress={() => navigation.navigate('AddChore', {})}
                className={cn(
                  "flex-row items-center px-4 py-2 rounded-lg",
                  isDark ? "bg-blue-600" : "bg-blue-500"
                )}
                icon={<Ionicons name="add" size={20} color="white" />}
              />
            </View>
          </Animated.View>

          {/* User Stats Card */}
          <Animated.View entering={FadeInUp.delay(100)}>
            <GlassCard className="mb-6">
              <Text className={cn(
                "text-lg font-semibold mb-4",
                isDark ? "text-white" : "text-gray-900"
              )}>
                🎮 Your Stats
              </Text>
              <View className="flex-row justify-between">
                <View className="flex-1 items-center py-3 bg-yellow-500/10 rounded-l-xl">
                  <Text className={cn(
                    "text-xs opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Points
                  </Text>
                  <Text className="text-lg font-bold text-yellow-500">
                    {userStats?.points || 0}
                  </Text>
                </View>
                <View className="flex-1 items-center py-3 bg-green-500/10">
                  <Text className={cn(
                    "text-xs opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Completed
                  </Text>
                  <Text className="text-lg font-bold text-green-500">
                    {userStats?.completedChores || 0}
                  </Text>
                </View>
                <View className="flex-1 items-center py-3 bg-red-500/10">
                  <Text className={cn(
                    "text-xs opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Streak
                  </Text>
                  <Text className="text-lg font-bold text-red-500">
                    {userStats?.streak || 0}🔥
                  </Text>
                </View>
                <View className="flex-1 items-center py-3 bg-purple-500/10 rounded-r-xl">
                  <Text className={cn(
                    "text-xs opacity-70",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Rank
                  </Text>
                  <Text className="text-lg font-bold text-purple-500">
                    #{userStats?.rank || '-'}
                  </Text>
                </View>
              </View>
              
              {/* Badges */}
              {userStats?.badges && (
                <View className="mt-4 pt-4 border-t border-gray-200/20">
                  <Text className={cn(
                    "text-sm font-medium mb-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Badges Earned
                  </Text>
                  <View className="flex-row gap-2">
                    {userStats.badges.map((badge, index) => (
                      <Text key={index} style={{ fontSize: 20 }}>{badge}</Text>
                    ))}
                  </View>
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* Tab Selector */}
          <Animated.View entering={FadeInUp.delay(200)} className="flex-row bg-gray-200/30 rounded-xl p-1 mb-6">
            {(['chores', 'leaderboard', 'groups'] as const).map(tab => (
              <Pressable
                key={tab}
                className={cn(
                  "flex-1 py-2 rounded-lg items-center",
                  selectedTab === tab && "bg-blue-500"
                )}
                onPress={() => setSelectedTab(tab)}
              >
                <Text className={cn(
                  "font-medium",
                  selectedTab === tab ? "text-white" : isDark ? "text-white" : "text-gray-900"
                )}>
                  {tab === 'chores' ? '📋 Chores' : tab === 'leaderboard' ? '🏆 Leaderboard' : '👥 Groups'}
                </Text>
              </Pressable>
            ))}
          </Animated.View>

          {/* Chores Tab */}
          {selectedTab === 'chores' && (
            <Animated.View entering={FadeInUp.delay(300)}>
              <Text className={cn(
                "text-lg font-semibold mb-4",
                isDark ? "text-white" : "text-gray-900"
              )}>
                Active Chores
              </Text>
              
              {mockActiveChores.map((chore, index) => (
                <Animated.View key={chore.id} entering={FadeInRight.delay(index * 100)}>
                  <GlassCard className="mb-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons 
                            name={getCategoryIcon(chore.category) as any} 
                            size={16} 
                            color={getDifficultyColor(chore.difficulty)} 
                            style={{ marginRight: 8 }}
                          />
                          <Text className={cn(
                            "font-semibold text-base",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            {chore.title}
                          </Text>
                        </View>
                        
                        <Text className={cn(
                          "text-sm opacity-70 mb-3",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {chore.description}
                        </Text>
                        
                        <View className="flex-row items-center flex-wrap">
                          <View 
                            className="px-2 py-1 rounded-full mr-2 mb-1"
                            style={{ backgroundColor: getDifficultyColor(chore.difficulty) + '20' }}
                          >
                            <Text 
                              className="text-xs font-medium"
                              style={{ color: getDifficultyColor(chore.difficulty) }}
                            >
                              {chore.difficulty.toUpperCase()}
                            </Text>
                          </View>
                          
                          <View 
                            className="px-2 py-1 rounded-full mr-2 mb-1"
                            style={{ backgroundColor: getStatusColor(chore.status) + '20' }}
                          >
                            <Text 
                              className="text-xs font-medium"
                              style={{ color: getStatusColor(chore.status) }}
                            >
                              {chore.status.toUpperCase()}
                            </Text>
                          </View>
                          
                          <View className="px-2 py-1 bg-yellow-500/20 rounded-full mb-1">
                            <Text className="text-xs font-medium text-yellow-600">
                              {chore.points} POINTS
                            </Text>
                          </View>
                        </View>
                        
                        <Text className={cn(
                          "text-xs opacity-60 mt-2",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          Due: {format(chore.dueDate, 'MMM dd, yyyy')} • Assigned to: {
                            chore.assignedTo === currentUser?.id ? 'You' : 
                            friends.find(f => f.id === chore.assignedTo)?.name || 'Unknown'
                          }
                        </Text>
                      </View>
                      
                      <View className="items-end ml-4">
                        {chore.assignedTo === currentUser?.id && chore.status === 'pending' && (
                          <Pressable
                            onPress={() => handleCompleteChore(chore.id)}
                            style={{
                              backgroundColor: '#10B981',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 8
                            }}
                          >
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                              Complete
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Leaderboard Tab */}
          {selectedTab === 'leaderboard' && (
            <Animated.View entering={FadeInUp.delay(300)}>
              <Text className={cn(
                "text-lg font-semibold mb-4",
                isDark ? "text-white" : "text-gray-900"
              )}>
                🏆 Leaderboard
              </Text>
              
              {mockLeaderboard.map((user, index) => (
                <Animated.View key={user.userId} entering={FadeInRight.delay(index * 100)}>
                  <GlassCard className={cn("mb-3", user.userId === currentUser?.id && "border-2 border-blue-500")}>
                    <View className="flex-row items-center">
                      <View 
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ 
                          backgroundColor: user.rank === 1 ? '#FFD700' : user.rank === 2 ? '#C0C0C0' : user.rank === 3 ? '#CD7F32' : '#6B7280'
                        }}
                      >
                        <Text className="text-white font-bold text-sm">
                          {user.rank}
                        </Text>
                      </View>
                      
                      <View className="flex-1">
                        <Text className={cn(
                          "font-semibold text-base",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {user.name} {user.userId === currentUser?.id && '(You)'}
                        </Text>
                        <Text className={cn(
                          "text-xs opacity-60",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {user.completedChores} chores completed • {user.streak} day streak
                        </Text>
                        <View className="flex-row mt-1">
                          {user.badges.map((badge, badgeIndex) => (
                            <Text key={badgeIndex} style={{ fontSize: 16, marginRight: 4 }}>
                              {badge}
                            </Text>
                          ))}
                        </View>
                      </View>
                      
                      <View className="items-end">
                        <Text className="text-lg font-bold text-yellow-500">
                          {user.points}
                        </Text>
                        <Text className={cn(
                          "text-xs opacity-60",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          points
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Groups Tab */}
          {selectedTab === 'groups' && (
            <Animated.View entering={FadeInUp.delay(300)}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className={cn(
                  "text-lg font-semibold",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  👥 Chore Groups
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('CreateGroup')}
                  style={{
                    backgroundColor: '#8B5CF6',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                    Create Group
                  </Text>
                </Pressable>
              </View>
              
              {mockChoreGroups.map((group, index) => (
                <Animated.View key={group.id} entering={FadeInRight.delay(index * 100)}>
                  <GlassCard className="mb-4">
                    <View className="flex-row items-center">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center mr-4"
                        style={{ backgroundColor: group.color }}
                      >
                        <Ionicons name={group.icon as any} size={24} color="white" />
                      </View>
                      
                      <View className="flex-1">
                        <Text className={cn(
                          "font-semibold text-base",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {group.name}
                        </Text>
                        <Text className={cn(
                          "text-xs opacity-60 mb-2",
                          isDark ? "text-white" : "text-gray-900"
                        )}>
                          {group.members} members • {group.completedChores} chores completed
                        </Text>
                        
                        <View className="flex-row items-center">
                          <View className="px-2 py-1 bg-yellow-500/20 rounded-full mr-2">
                            <Text className="text-xs font-medium text-yellow-600">
                              {group.totalPoints} POINTS
                            </Text>
                          </View>
                          <View 
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: group.color + '20' }}
                          >
                            <Text 
                              className="text-xs font-medium"
                              style={{ color: group.color }}
                            >
                              {group.type.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              ))}
              
              {mockChoreGroups.length === 0 && (
                <GlassCard>
                  <View className="items-center py-8">
                    <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                    <Text className={cn(
                      "text-center mt-4 font-medium",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      No chore groups yet
                    </Text>
                    <Text className={cn(
                      "text-center mt-2 text-sm opacity-70",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Create a group to start managing chores together
                    </Text>
                  </View>
                </GlassCard>
              )}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}