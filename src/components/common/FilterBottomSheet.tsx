import React, { useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  onReset?: () => void;
  onApply?: () => void;
}

export function FilterBottomSheet({
  visible,
  onClose,
  title,
  children,
  onReset,
  onApply,
}: FilterBottomSheetProps) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="fade"
    >
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableWithoutFeedback onPress={handleClose}>
          <View className="flex-1" />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            maxHeight: screenHeight * 0.85,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.surface,
          }}
        >
          {/* Handle bar */}
          <View className="items-center pt-3 pb-2">
            <View 
              className="w-12 h-1.5 rounded-full" 
              style={{ backgroundColor: colors.border }} 
            />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-4 border-b" style={{ borderBottomColor: colors.border }}>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {title || t('filters')}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
          >
            {children}
          </ScrollView>

          {/* Footer Actions */}
          <View 
            className="flex-row gap-3 p-4 border-t absolute bottom-0 left-0 right-0 z-10"
            style={{ 
              backgroundColor: colors.surface, 
              borderTopColor: colors.border,
              paddingBottom: insets.bottom || 16 
            }}
          >
            {onReset && (
              <TouchableOpacity
                onPress={onReset}
                className="flex-1 py-3 rounded-lg border items-center justify-center"
                style={{ borderColor: colors.border }}
              >
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {t('reset')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                onApply?.();
                handleClose();
              }}
              className="flex-1 py-3 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white font-semibold">
                {t('showResults')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function FilterSection({ title, options, selectedValue, onSelect }: FilterSectionProps) {
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  return (
    <View className="mb-6">
      <Text className="text-sm font-bold mb-3" style={{ color: colors.text }}>{title}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            className="px-4 py-2 rounded-full border"
            style={{
              backgroundColor: selectedValue === option.value ? colors.primary : 'transparent',
              borderColor: selectedValue === option.value ? colors.primary : colors.border,
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{
                color: selectedValue === option.value ? 'white' : colors.text,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
