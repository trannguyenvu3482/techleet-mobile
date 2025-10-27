import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setLoading } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setLoading,
  };
}

export function useProtectedRoute() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace('/(auth)/sign-in');
    }
  }, [isAuthenticated, isHydrated]);

  return { isAuthenticated, isHydrated };
}

