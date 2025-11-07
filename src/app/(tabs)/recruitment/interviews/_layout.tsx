import { Stack } from 'expo-router';

export default function InterviewsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="calendar" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="form" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/notes" />
    </Stack>
  );
}

