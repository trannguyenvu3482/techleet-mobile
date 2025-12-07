import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, Toast } from '@/store/toast-store';
import { useThemeStore } from '@/store/theme-store';
import { getColors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast);
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          removeToast(toast.id);
        });
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, slideAnim, opacityAnim, removeToast]);

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (toast.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const getBackgroundColor = (): string => {
    switch (toast.type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.info;
    }
  };

  const handlePress = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      removeToast(toast.id);
    });
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
        marginBottom: 8,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={{
          backgroundColor: getBackgroundColor(),
          borderRadius: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
          minHeight: 44,
        }}
        accessibilityRole="button"
        accessibilityLabel={`${toast.type} notification: ${toast.message}`}
        accessibilityHint="Double tap to dismiss"
      >
        <Ionicons name={getIconName()} size={24} color="white" style={{ marginRight: 12 }} />
        <Text
          style={{
            color: 'white',
            fontSize: 14,
            fontWeight: '500',
            flex: 1,
          }}
          numberOfLines={3}
        >
          {toast.message}
        </Text>
        <TouchableOpacity
          onPress={handlePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginLeft: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeStore();
  const colors = getColors(isDark);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        pointerEvents: 'box-none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

