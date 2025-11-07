import { Stack } from 'expo-router';

export default function ApplicationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      // Set initial route to index to avoid conflicts
      initialRouteName="index"
    >
      {/* Order matters: index must be defined first to avoid matching [id] route */}
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Applications',
          // Prevent matching as [id] route
        }}
      />
      <Stack.Screen 
        name="[id]/index" 
        options={{ 
          title: 'Application Detail',
        }}
      />
    </Stack>
  );
}

