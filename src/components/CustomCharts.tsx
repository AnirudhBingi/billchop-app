import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

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

interface LineChartProps {
  data: LineChartData;
  width: number;
  height: number;
  isDark?: boolean;
}

interface PieChartProps {
  data: PieChartData[];
  width: number;
  height: number;
  isDark?: boolean;
}

export const CustomLineChart: React.FC<LineChartProps> = ({ 
  data, 
  width, 
  height, 
  isDark = false 
}) => {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const maxValue = Math.max(...data.data, 1);
  const minValue = Math.min(...data.data, 0);
  const valueRange = maxValue - minValue || 1;
  
  // Generate path for line
  const pathData = data.data.map((value, index) => {
    const x = (index / (data.data.length - 1)) * chartWidth + padding;
    const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
    return { x, y };
  });
  
  const pathString = pathData.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  return (
    <View style={{ 
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8
    }}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = height - padding - ratio * chartHeight;
          return (
            <Line
              key={index}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke={isDark ? '#374151' : '#E5E7EB'}
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}
        
        {/* Line path */}
        <Path
          d={pathString}
          stroke="#3B82F6"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {pathData.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="#3B82F6"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        ))}
        
        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, index) => {
          const value = minValue + ratio * valueRange;
          const y = height - padding - ratio * chartHeight;
          return (
            <SvgText
              key={index}
              x={padding - 10}
              y={y + 4}
              fontSize={12}
              fill={isDark ? '#9CA3AF' : '#6B7280'}
              textAnchor="end"
            >
              ${value.toFixed(0)}
            </SvgText>
          );
        })}
      </Svg>
      
      {/* X-axis labels */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: padding
      }}>
        {data.labels.map((label, index) => (
          <Text 
            key={index}
            style={{ 
              fontSize: 10,
              color: isDark ? '#9CA3AF' : '#6B7280',
              flex: 1,
              textAlign: index === 0 ? 'left' : index === data.labels.length - 1 ? 'right' : 'center'
            }}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export const CustomPieChart: React.FC<PieChartProps> = ({ 
  data, 
  width, 
  height, 
  isDark = false 
}) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;
  
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  
  let currentAngle = -90; // Start from top
  
  const slices = data.map((item) => {
    const percentage = item.amount / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Calculate arc path
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    currentAngle += angle;
    
    return {
      ...item,
      pathData,
      percentage: percentage * 100,
      midAngle: startAngle + angle / 2
    };
  });

  return (
    <View style={{ 
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Pie Chart */}
        <View style={{ flex: 1 }}>
          <Svg width={width * 0.6} height={height}>
            {slices.map((slice, index) => (
              <Path
                key={index}
                d={slice.pathData}
                fill={slice.color}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}
          </Svg>
        </View>
        
        {/* Legend */}
        <View style={{ flex: 1, paddingLeft: 16 }}>
          {data.map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInRight.delay(index * 100)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: item.color,
                  marginRight: 8
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#111827'
                }}>
                  {item.name}
                </Text>
                <Text style={{
                  fontSize: 10,
                  color: isDark ? '#9CA3AF' : '#6B7280'
                }}>
                  ${item.amount} • {((item.amount / total) * 100).toFixed(1)}%
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
};

export const CustomBarChart: React.FC<{
  data: { label: string; value: number; color?: string }[];
  width: number;
  height: number;
  isDark?: boolean;
}> = ({ data, width, height, isDark = false }) => {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / data.length * 0.7;
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <View style={{ 
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginVertical: 8
    }}>
      <Svg width={width} height={height}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x = padding + (index * chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
          const y = height - padding - barHeight;
          
          return (
            <React.Fragment key={index}>
              {/* Bar */}
              <Animated.View>
                <Path
                  d={`M ${x} ${height - padding} L ${x} ${y} L ${x + barWidth} ${y} L ${x + barWidth} ${height - padding} Z`}
                  fill={item.color || '#3B82F6'}
                />
              </Animated.View>
              
              {/* Value label */}
              <SvgText
                x={x + barWidth / 2}
                y={y - 8}
                fontSize={10}
                fill={isDark ? '#9CA3AF' : '#6B7280'}
                textAnchor="middle"
              >
                ${item.value}
              </SvgText>
              
              {/* Category label */}
              <SvgText
                x={x + barWidth / 2}
                y={height - padding + 20}
                fontSize={10}
                fill={isDark ? '#9CA3AF' : '#6B7280'}
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};