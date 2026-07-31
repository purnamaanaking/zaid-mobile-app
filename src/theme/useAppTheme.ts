import { useColorScheme } from 'react-native';
import { useAppSettings } from '@/src/features/settings/store/appSettings.store';

export const accent = { purple: '#665CFF', purpleLight: '#F3F1FF', green: '#63D997' };

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const { settings } = useAppSettings();

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && systemScheme === 'dark');

  return {
    isDark,
    accent,
    bg: isDark ? '#0F1117' : '#FFFFFF',
    bgSecondary: isDark ? '#1A1D27' : '#FAFAFB',
    bgCard: isDark ? '#1E2130' : '#FFFFFF',
    border: isDark ? '#2A2D3A' : '#E5E7EB',
    text: isDark ? '#E4E6EC' : '#111827',
    textSecondary: isDark ? '#8B8FA3' : '#6B7280',
    textMuted: isDark ? '#5C6174' : '#9CA3AF',
  };
}
