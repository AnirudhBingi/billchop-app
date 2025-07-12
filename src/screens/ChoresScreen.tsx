import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../state/useUserStore';
import { useChoreStore } from '../state/useChoreStore';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import { format } from 'date-fns';
import { cn } from '../utils/cn';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ChoresScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { currentUser, settings } = useUserStore();
  const { chores, leaderboard, completeChore } = useChoreStore();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'leaderboard'>('active');
  
  const isDark = settings.theme === 'dark';
  
  const activeChores = chores.filter(c => c.status === 'pending' || c.status === 'in_progress');
  const completedChores = chores.filter(c => c.status === 'completed');
  const myChores = activeChores.filter(c => c.assignedTo === currentUser?.id);
  const unassignedChores = activeChores.filter(c => !c.assignedTo);

  const ChoreItem = ({ chore, showCompleteButton = false }: { 
    chore: any; 
    showCompleteButton?: boolean; 
  }) => (
    <GlassCard className="mb-3">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className={cn(
            "font-semibold text-base",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {chore.title}
          </Text>
          
          {chore.description && (
            <Text className={cn(
              "text-sm opacity-70 mt-1",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {chore.description}
            </Text>
          )}
          
          <View className="flex-row items-center mt-2">
            <View className="px-2 py-1 bg-green-500 rounded-full mr-2">
              <Text className="text-xs font-medium text-white">
                +{chore.points} PTS
              </Text>
            </View>
            
            <View className={cn(
              "px-2 py-1 rounded-full",
              chore.status === 'pending' ? "bg-orange-500/20" : 
              chore.status === 'in_progress' ? "bg-blue-500/20" : "bg-green-500/20"
            )}>
              <Text className={cn(
                "text-xs font-medium",
                chore.status === 'pending' ? "text-orange-500" : 
                chore.status === 'in_progress' ? "text-blue-500" : "text-green-500"
              )}>
                {chore.status.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
          </View>
          
          {chore.dueDate && (
            <Text className={cn(
              "text-xs opacity-60 mt-2",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Due: {format(new Date(chore.dueDate), 'MMM dd, yyyy')}
            </Text>
          )}
        </View>
        
        {showCompleteButton && chore.status !== 'completed' && (
          <AnimatedButton
            title="Complete"
            size="sm"
            onPress={() => currentUser && completeChore(chore.id, currentUser.id)}
          />
        )}
      </View>
    </GlassCard>
  );

  const LeaderboardItem = ({ entry, index }: { entry: any; index: number }) => (
    <View className={cn(
      "flex-row items-center p-3 rounded-xl mb-2",
      isDark ? "bg-gray-700/50" : "bg-white/50"
    )}>
      <View className={cn(
        "w-8 h-8 rounded-full items-center justify-center mr-3",
        index === 0 ? "bg-yellow-500" : 
        index === 1 ? "bg-gray-400" : 
        index === 2 ? "bg-orange-600" : "bg-blue-500"
      )}>
        <Text className="text-white font-bold text-sm">
          #{entry.rank}
        </Text>
      </View>
      
      <View className="flex-1">
        <Text className={cn(
          "font-semibold",
          isDark ? "text-white" : "text-gray-900"
        )}>
          User {entry.userId}
        </Text>
        <Text className={cn(
          "text-sm opacity-70",
          isDark ? "text-white" : "text-gray-900"
        )}>
          {entry.completedChores} chores completed
        </Text>
      </View>
      
      <Text className={cn(
        "text-lg font-bold",
        isDark ? "text-white" : "text-gray-900"
      )}>
        {entry.totalPoints} pts
      </Text>
    </View>
  );

  return (
    <View 
      className={cn(
        "flex-1",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className={cn(
            "text-2xl font-bold",
            isDark ? "text-white" : "text-gray-900"
          )}>
            HomieHub
          </Text>
          <AnimatedButton
            title="Add"
            size="sm"
            icon={<Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />}
            onPress={() => navigation.navigate('AddChore', {})}
          />
        </View>

        {/* Tab Selector */}
        <View className="flex-row bg-gray-200/30 rounded-xl p-1">
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'active' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('active')}
          >
            <Text className={cn(
              "font-medium text-xs",
              selectedTab === 'active' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              Active
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'completed' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('completed')}
          >
            <Text className={cn(
              "font-medium text-xs",
              selectedTab === 'completed' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              Completed
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              "flex-1 py-2 rounded-lg items-center",
              selectedTab === 'leaderboard' && "bg-blue-500"
            )}
            onPress={() => setSelectedTab('leaderboard')}
          >
            <Text className={cn(
              "font-medium text-xs",
              selectedTab === 'leaderboard' ? "text-white" : isDark ? "text-white" : "text-gray-900"
            )}>
              Leaderboard
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'active' && (
          <>
            {/* My Chores */}
            {myChores.length > 0 && (
              <View className="mb-4">
                <Text className={cn(
                  "text-lg font-semibold mb-3",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  My Chores ({myChores.length})
                </Text>
                {myChores.map((chore) => (
                  <ChoreItem key={chore.id} chore={chore} showCompleteButton />
                ))}
              </View>
            )}

            {/* Up for Grabs */}
            {unassignedChores.length > 0 && (
              <View className="mb-4">
                <Text className={cn(
                  "text-lg font-semibold mb-3",
                  isDark ? "text-white" : "text-gray-900"
                )}>
                  Up for Grabs ({unassignedChores.length})
                </Text>
                {unassignedChores.map((chore) => (
                  <ChoreItem key={chore.id} chore={chore} />
                ))}
              </View>
            )}

            {activeChores.length === 0 && (
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons 
                    name="checkmark-circle-outline" 
                    size={48} 
                    color={isDark ? "#6B7280" : "#9CA3AF"} 
                  />
                  <Text className={cn(
                    "text-lg font-medium mt-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    All caught up!
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70 text-center mt-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No active chores. Time to add some or relax!
                  </Text>
                </View>
              </GlassCard>
            )}
          </>
        )}

        {selectedTab === 'completed' && (
          <>
            <Text className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Recently Completed
            </Text>
            {completedChores.length > 0 ? (
              completedChores.map((chore) => (
                <ChoreItem key={chore.id} chore={chore} />
              ))
            ) : (
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons 
                    name="time-outline" 
                    size={48} 
                    color={isDark ? "#6B7280" : "#9CA3AF"} 
                  />
                  <Text className={cn(
                    "text-lg font-medium mt-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No completed chores yet
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70 text-center mt-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Complete some chores to see them here
                  </Text>
                </View>
              </GlassCard>
            )}
          </>
        )}

        {selectedTab === 'leaderboard' && (
          <>
            <Text className={cn(
              "text-lg font-semibold mb-3",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Chore Champions 🏆
            </Text>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <LeaderboardItem key={entry.userId} entry={entry} index={index} />
              ))
            ) : (
              <GlassCard>
                <View className="items-center py-8">
                  <Ionicons 
                    name="trophy-outline" 
                    size={48} 
                    color={isDark ? "#6B7280" : "#9CA3AF"} 
                  />
                  <Text className={cn(
                    "text-lg font-medium mt-4",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    No rankings yet
                  </Text>
                  <Text className={cn(
                    "text-sm opacity-70 text-center mt-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}>
                    Complete chores to climb the leaderboard!
                  </Text>
                </View>
              </GlassCard>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}