import { Stack } from 'expo-router';

export default function QuestionSetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="form" />
      <Stack.Screen name="[id]/index" />
    </Stack>
  );
}

