import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const baseClasses = 'py-4 px-6 rounded-lg items-center justify-center';
  const variantClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    outline: 'bg-transparent border-2 border-blue-600',
  };
  const textVariantClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-blue-600',
  };
  const disabledClasses = 'opacity-50';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled || loading ? disabledClasses : ''} ${className}`}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#2563eb' : '#ffffff'} />
      ) : (
        <Text className={`font-semibold text-base ${textVariantClasses[variant]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

