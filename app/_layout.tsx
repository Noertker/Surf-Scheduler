import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { useSessionStore } from '@/stores/useSessionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { useSurfboardStore } from '@/stores/useSurfboardStore';
import { useProfileStore } from '@/stores/useProfileStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize auth on mount
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

/** Re-fetches all user-scoped stores once auth is ready and when user changes. */
function AuthRefreshBridge() {
  const initialized = useAuthStore((s) => s.initialized);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!initialized) return; // Don't fetch until auth session is restored
    useSessionStore.getState().fetchSessions();
    useSettingsStore.getState().fetchSettings();
    usePreferenceStore.getState().fetchPreferences();
    useSurfboardStore.getState().fetchBoards();
    useProfileStore.getState().fetchProfile();
  }, [initialized, userId]);

  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {!initialized ? (
        <ActivityIndicator size="large" style={{ flex: 1 }} />
      ) : !user ? (
        <AuthScreen />
      ) : (
        <>
          <AuthRefreshBridge />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </>
      )}
    </ThemeProvider>
  );
}
