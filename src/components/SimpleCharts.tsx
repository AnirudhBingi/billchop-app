import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { FadeInRight, FadeInUp } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface LineChartData {
  labels: string[];
  data: number[];
}

interface PieChartData {
  name: string;
  amount: number;
  color: string;
}

interface SimpleLineChartProps {
  data: LineChartData;
  width: number;
  height: number;
  isDark?: boolean;
}

interface SimplePieChartProps {
  data: PieChartData[];
  width: number;
  height: number;
  isDark?: boolean;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ 
  data, 
  width, 
  height, 
  isDark = false 
}) => {
  const maxValue = Math.max(...data.data, 1);
  const barWidth = (width - 40) / data.data.length;

  return (
    <View style={{ 
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8
    }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '600', 
        color: isDark ? '#FFFFFF' : '#111827',
        marginBottom: 16,
        textAlign: 'center'
      }}>
        📈 Spending Timeline
      </Text>
      
      {/* Bar Chart Representation */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        height: height - 80,
        marginBottom: 16
      }}>
        {data.data.map((value, index) => {
          const barHeight = maxValue > 0 ? (value / maxValue) * (height - 120) : 0;
          return (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(index * 100)}
              style={{
                width: barWidth * 0.8,
                height: Math.max(barHeight, 2),
                backgroundColor: '#3B82F6',
                marginRight: barWidth * 0.2,
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 4
              }}
            >
              {value > 0 && (
                <Text style={{
                  fontSize: 8,
                  color: 'white',
                  fontWeight: '600'
                }}>
                  ${value}
                </Text>
              )}
            </Animated.View>
          );
        })}
      </View>
      
      {/* Labels */}
      <View style={{ 
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4
      }}>
        {data.labels.map((label, index) => (
          <Text 
            key={index}
            style={{ 
              fontSize: 10,
              color: isDark ? '#9CA3AF' : '#6B7280',
              flex: 1,
              textAlign: 'center'
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ 
  data, 
  width, 
  height, 
  isDark = false 
}) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  return (
    <View style={{ 
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8
    }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '600', 
        color: isDark ? '#FFFFFF' : '#111827',
        marginBottom: 16,
        textAlign: 'center'
      }}>
        🏷️ Category Breakdown
      </Text>
      
      {/* Horizontal Bar Chart Representation */}
      <View style={{ marginBottom: 16 }}>
        {data.map((item, index) => {
          const percentage = (item.amount / total) * 100;
          return (
            <Animated.View
              key={index}
              entering={FadeInRight.delay(index * 100)}
              style={{ marginBottom: 12 }}
            >
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: item.color,
                      marginRight: 8
                    }}
                  />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isDark ? '#FFFFFF' : '#111827'
                  }}>
                    {item.name}
                  </Text>
                </View>
                <Text style={{
                  fontSize: 12,
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  fontWeight: '600'
                }}>
                  ${item.amount} ({percentage.toFixed(1)}%)
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View style={{
                height: 6,
                backgroundColor: isDark ? '#374151' : '#E5E7EB',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <Animated.View
                  entering={FadeInRight.delay(index * 100 + 200)}
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: item.color,
                    borderRadius: 3
                  }}
                />
              </View>
            </Animated.View>
          );
        })}
      </View>
      
      {/* Total */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: isDark ? '#374151' : '#E5E7EB',
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: isDark ? '#FFFFFF' : '#111827'
        }}>
          Total Spending
        </Text>
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#3B82F6'
        }}>
          ${total.toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

export const SimpleBarChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  width: number;
  height: number;
  isDark?: boolean;
}> = ({ data, width, height, isDark = false }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = (width - 40) / data.length;
  
  return (
    <View style={{ 
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8
    }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        height: height - 60,
        marginBottom: 16
      }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 100);
          return (
            <Animated.View
              key={index}
              entering={FadeInUp.delay(index * 100)}
              style={{
                width: barWidth * 0.8,
                height: Math.max(barHeight, 2),
                backgroundColor: item.color || '#3B82F6',
                marginRight: barWidth * 0.2,
                borderRadius: 4,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 4
              }}
            >
              <Text style={{
                fontSize: 8,
                color: 'white',
                fontWeight: '600'
              }}>
                ${item.value}
              </Text>
            </Animated.View>
          );
        })}
      </View>
      
      <View style={{ 
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
        {data.map((item, index) => (
          <Text 
            key={index}
            style={{ 
              fontSize: 10,
              color: isDark ? '#9CA3AF' : '#6B7280',
              flex: 1,
              textAlign: 'center'
            }}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
};