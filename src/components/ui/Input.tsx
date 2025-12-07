import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  icon,
  isPassword = false,
  value,
  onChangeText,
  className = '',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text
          className="font-medium mb-2"
          style={{ color: colors.text }}
        >
          {label}
        </Text>
      )}
      <View
        className="flex-row items-center rounded-lg px-4 border"
        style={{
          borderColor: error ? colors.error : colors.border,
          backgroundColor: colors.surface,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={colors.textSecondary}
            style={{ marginRight: 8 }}
          />
        )}
        <TextInput
          className="flex-1 py-3"
          style={{ color: colors.text }}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={label || props.placeholder}
          accessibilityRole="text"
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityHint="Toggles password visibility"
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
          className="text-sm mt-1"
          style={{ color: colors.error }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

