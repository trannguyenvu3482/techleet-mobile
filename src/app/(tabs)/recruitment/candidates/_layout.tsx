import { Stack } from 'expo-router';

export default function CandidatesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="form" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/exams" />
      <Stack.Screen name="[id]/exams/[examId]" />
    </Stack>
  );
}

