import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, TextInput, TextInputProps, TextProps } from 'react-native';
import 'react-native-reanimated';
import '@/global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fonts } from '@/src/constants/typography';
import { checkAuth } from '@/src/store/auth.store';

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

  useEffect(() => {
    checkAuth();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
