export const accent = { purple: '#665CFF', purpleLight: '#F3F1FF', green: '#63D997' };

export function useAppTheme() {
  // Mode gelap dinonaktifkan sementara agar UI selalu konsisten dan rapi
  const isDark = false;

  return {
    isDark,
    accent,
    bg: '#FFFFFF',
    bgSecondary: '#FAFAFB',
    bgCard: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
  };
}
