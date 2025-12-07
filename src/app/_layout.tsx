import React, { useEffect, useRef } from "react"

import { Stack, useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Appearance } from 'react-native'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "../../global.css"
import "@/i18n"
import { notificationService } from "@/services/notifications"
import { reminderService } from "@/services/reminders"
import { useThemeStore } from "@/store/theme-store"
import { useLanguageStore } from "@/store/language-store"
import { ToastContainer } from "@/components/ui/Toast"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: true
    },
    mutations: {
      retry: 0
    }
  }
})

export default function RootLayout() {
  const router = useRouter();
  const notificationListener = useRef<ReturnType<typeof notificationService.addNotificationReceivedListener> | undefined>(undefined);
  const responseListener = useRef<ReturnType<typeof notificationService.addNotificationResponseReceivedListener> | undefined>(undefined);
  const appearanceListener = useRef<ReturnType<typeof Appearance.addChangeListener> | undefined>(undefined);
  const { initialize: initializeTheme, isDark, updateSystemTheme } = useThemeStore();
  const { initialize: initializeLanguage } = useLanguageStore();

  useEffect(() => {
    initializeTheme();
    initializeLanguage();
    notificationService.initialize();
    reminderService.initialize();

    appearanceListener.current = Appearance.addChangeListener(({ colorScheme }) => {
      updateSystemTheme();
    });

    notificationListener.current = notificationService.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    responseListener.current = notificationService.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;
      
      if (data && typeof data === 'object' && 'type' in data) {
        if (data.type === 'application' && 'applicationId' in data) {
          router.push(`/(tabs)/recruitment/applications/${data.applicationId}`);
        } else if (data.type === 'interview' && 'interviewId' in data) {
          router.push(`/(tabs)/recruitment/interviews/${data.interviewId}`);
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (appearanceListener.current) {
        appearanceListener.current.remove();
      }
    };
  }, [initializeTheme, initializeLanguage, updateSystemTheme, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
      <ToastContainer />
    </QueryClientProvider>
  )
}
