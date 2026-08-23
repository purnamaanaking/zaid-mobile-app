import { useAppSettings } from '@/src/features/settings/store/appSettings.store';

export const accent = { purple: '#665CFF', purpleLight: '#F3F1FF', green: '#63D997' };

export function useAppTheme() {
  const { settings } = useAppSettings();

  const isDark = settings.theme === 'dark';

  return {
    isDark,
    accent,
    bg: isDark ? '#212121' : '#FFFFFF',
    bgSecondary: isDark ? '#171717' : '#FAFAFB',
    bgCard: isDark ? '#2F2F2F' : '#FFFFFF',
    border: isDark ? '#3A3A3A' : '#E5E7EB',
    text: isDark ? '#ECECEC' : '#111827',
    textSecondary: isDark ? '#B4B4B4' : '#6B7280',
    textMuted: isDark ? '#9E9E9E' : '#9CA3AF',
  };
}
