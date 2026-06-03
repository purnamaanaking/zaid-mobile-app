export const Config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://43.134.61.160',
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'ARIA',
} as const;
