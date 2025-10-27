import React from "react"

import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "../../global.css"

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
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  )
}
