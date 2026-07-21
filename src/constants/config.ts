export const Config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://zaidassistant.id/api',
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'ZAID',
  useLocalUiData: process.env.EXPO_PUBLIC_USE_LOCAL_UI_DATA === 'true',
} as const;
