import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { CartesianChart, Line, Bar, PolarChart, Pie } from 'victory-native';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 200;

interface LineChartProps {
  data: { x: string | number; y: number }[];
  title?: string;
  color?: string;
}

export function LineChart({ data, title, color }: LineChartProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const lineColor = color || colors.primary;

  if (!data || data.length === 0) {
    return (
      <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        {title && <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{title}</Text>}
        <View className="h-[200px] items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>No data available</Text>
        </View>
      </View>
    );
  }

  const chartData = data.map((item, index) => ({
    label: item.x,
    value: item.y,
  }));

  return (
    <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      {title && <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{title}</Text>}
      <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
        <CartesianChart
          data={chartData}
          xKey="label"
          yKeys={['value']}
          domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
        >
          {({ points }) => (
            <Line
              points={points.value}
              color={lineColor}
              strokeWidth={2}
            />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

interface BarChartProps {
  data: { x: string | number; y: number }[];
  title?: string;
  color?: string;
}

export function BarChart({ data, title, color }: BarChartProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const barColor = color || colors.secondary;

  if (!data || data.length === 0) {
    return (
      <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        {title && <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{title}</Text>}
        <View className="h-[200px] items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>No data available</Text>
        </View>
      </View>
    );
  }

  const chartData = data.map((item, index) => ({
    label: item.x,
    value: item.y,
  }));

  return (
    <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      {title && <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{title}</Text>}
      <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
        <CartesianChart
          data={chartData}
          xKey="label"
          yKeys={['value']}
          domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
        >
          {({ points, chartBounds }) => (
              <Bar
                chartBounds={chartBounds}
                points={points.value}
                color={barColor}
              />
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

interface PieChartProps {
  data: { x: string; y: number }[];
  title?: string;
  colors?: string[];
}

const DEFAULT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export function PieChart({ data, title, colors: pieColors = DEFAULT_COLORS }: PieChartProps) {
  const { isDark } = useThemeStore();
  const themeColors = getColors(isDark);

  if (!data || data.length === 0) {
    return (
      <View className="rounded-lg p-4 border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
        {title && <Text className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{title}</Text>}
        <View className="h-[200px] items-center justify-center">
          <Text style={{ color: themeColors.textSecondary }}>No data available</Text>
        </View>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.y, 0);
  const chartData = data.map((item, index) => ({
    label: item.x,
    value: item.y,
    color: pieColors[index % pieColors.length],
    percentage: total > 0 ? (item.y / total) * 100 : 0,
  }));

  return (
    <View className="rounded-lg p-4 border" style={{ backgroundColor: themeColors.card, borderColor: themeColors.border }}>
      {title && <Text className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{title}</Text>}
      <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
        <PolarChart
          data={chartData}
          labelKey="label"
          valueKey="value"
          colorKey="color"
        >
          <Pie.Chart />
        </PolarChart>
      </View>
      <View className="mt-4">
        {chartData.map((item, index) => (
          <View key={index} className="flex-row items-center mb-2">
            <View
              className="w-4 h-4 rounded mr-2"
              style={{ backgroundColor: pieColors[index % pieColors.length] }}
            />
            <Text className="text-sm flex-1" style={{ color: themeColors.text }}>
              {item.label}: {item.value} ({item.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface FunnelChartProps {
  data: { stage: string; count: number; percentage: number }[];
  title?: string;
}

export function FunnelChart({ data, title }: FunnelChartProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  if (!data || data.length === 0) {
    return (
      <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        {title && <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{title}</Text>}
        <View className="h-[200px] items-center justify-center">
          <Text style={{ color: colors.textSecondary }}>No data available</Text>
        </View>
      </View>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <View className="rounded-lg p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      {title && <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>{title}</Text>}
      <View className="space-y-3">
        {data.map((item, index) => {
          const widthPercentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const funnelColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
          const color = funnelColors[index % funnelColors.length];

          return (
            <View key={index} className="mb-3">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>{item.stage}</Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {item.count} ({item.percentage}%)
                </Text>
              </View>
              <View className="h-6 rounded-full overflow-hidden" style={{ backgroundColor: colors.surface }}>
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${widthPercentage}%`,
                    backgroundColor: color,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

