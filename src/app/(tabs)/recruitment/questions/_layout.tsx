import { Stack } from 'expo-router';

export default function QuestionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="form" />
    </Stack>
  );
}

