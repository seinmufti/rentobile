import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listing/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="listing/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
