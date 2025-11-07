import { Stack } from 'expo-router';

export default function RecruitmentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      {/* Each module has its own nested Stack layout */}
      <Stack.Screen name="jobs" />
      <Stack.Screen name="candidates" />
      <Stack.Screen name="interviews" />
      <Stack.Screen name="applications" />
    </Stack>
  );
}

