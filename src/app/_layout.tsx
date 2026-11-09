import '../../global.css';

import { DialogHost } from '@/components/toast';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { NAV_THEME } from '@/lib/theme';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { colorScheme } = useColorScheme();
  const { isRTL } = useI18n();
  const { session, isAdmin, loading } = useAuth();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  // Tailwind uses darkMode: 'class'; on web the class must be on <html> for the dark CSS variables to apply.
  React.useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.classList.toggle('dark', scheme === 'dark');
  }, [scheme]);

  return (
    <ThemeProvider value={NAV_THEME[scheme]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* Flips layout for Arabic / Kurdish without needing an app restart. */}
      <View className="bg-background flex-1" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            {/* User interface: guests and normal users. Admins are sent to /admin. */}
            <Stack.Protected guard={!isAdmin} redirectTo="/admin">
              <Stack.Screen name="(user)" />
              <Stack.Screen name="car/[id]" />
            </Stack.Protected>

            {/* Admin interface. */}
            <Stack.Protected guard={isAdmin} redirectTo="/">
              <Stack.Screen name="admin" />
            </Stack.Protected>

            <Stack.Protected guard={!session} redirectTo="/">
              <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
              <Stack.Screen name="sign-up" options={{ presentation: 'modal' }} />
            </Stack.Protected>

            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
        )}
        <DialogHost />
        <PortalHost />
      </View>
    </ThemeProvider>
  );
}
