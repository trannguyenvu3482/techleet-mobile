import { useCallback } from 'react';
import { useToastStore, ToastType } from '@/store/toast-store';

export function useToast() {
  const showToast = useToastStore((state) => state.showToast);

  const success = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast]
  );

  return {
    success,
    error,
    warning,
    info,
    show: showToast,
  };
}

