import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Text, TextInput, TextInputProps, TextProps } from 'react-native';
import 'react-native-reanimated';
import '@/global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fonts } from '@/src/constants/typography';
import { addUnauthorizedListener } from '@/src/services/api/client';
import { addNotificationResponseListener, configureNativeNotifications } from '@/src/services/notifications/nativeNotifications';
import { fetchReminders } from '@/src/features/reminders/store/reminderStore';
import { checkAuth, logout, useAuthStore } from '@/src/store/auth.store';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

const defaultTextProps = Text as typeof Text & { defaultProps?: TextProps };
defaultTextProps.defaultProps = defaultTextProps.defaultProps ?? {};
defaultTextProps.defaultProps.style = [
  { fontFamily: Fonts.bodyRegular },
  defaultTextProps.defaultProps.style,
];

const defaultTextInputProps = TextInput as typeof TextInput & { defaultProps?: TextInputProps };
defaultTextInputProps.defaultProps = defaultTextInputProps.defaultProps ?? {};
defaultTextInputProps.defaultProps.style = [
  { fontFamily: Fonts.bodyRegular },
  defaultTextInputProps.defaultProps.style,
];

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const { isAuthenticated, isInitialized } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  useEffect(() => {
    checkAuth();
    void configureNativeNotifications(false);
    void fetchReminders();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void fetchReminders();
    });
    const notificationSubscription = addNotificationResponseListener(({ taskId, calendarEventId }) => {
      if (taskId) router.push(`/schedule/${taskId}`);
      else if (calendarEventId) router.push('/explore');
    });
    const unsubscribeUnauthorized = addUnauthorizedListener(() => void logout());
    return () => {
      notificationSubscription.remove();
      appStateSubscription.remove();
      unsubscribeUnauthorized();
    };
  }, []);

  if (!fontsLoaded || !isInitialized) {
    return null;
  }

  const inAuthGroup = segments[0] === '(auth)';
  if (!isAuthenticated && !inAuthGroup) return <Redirect href="/(auth)/login" />;
  if (isAuthenticated && inAuthGroup) return <Redirect href="/(tabs)" />;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="schedule/[id]" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
