import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  return (
    <View className={`mb-4 ${className}`}>
      {label && <Text className="text-gray-700 font-medium mb-2">{label}</Text>}
      <View className={`flex-row items-center border rounded-lg px-4 ${error ? 'border-red-500' : 'border-gray-300'}`}>
        {icon && <Ionicons name={icon} size={20} color="#6B7280" className="mr-2" />}
        <TextInput
          className="flex-1 py-3 text-gray-900"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}

