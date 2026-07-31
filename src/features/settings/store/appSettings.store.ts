import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export type WeeklyReminderDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type PreferencesTheme = 'system' | 'light' | 'dark';

export type AppSettings = {
  agendaConfirmationEnabled: boolean;
  theme: PreferencesTheme;
  weeklyReminderDay: WeeklyReminderDay;
  weeklyReminderEnabled: boolean;
  weeklyReminderTime: string;
};

const SETTINGS_KEY = 'zaid_app_settings';

const defaultSettings: AppSettings = {
  agendaConfirmationEnabled: true,
  theme: 'system',
  weeklyReminderDay: 'monday',
  weeklyReminderEnabled: true,
  weeklyReminderTime: '08:00',
};

let settings: AppSettings = defaultSettings;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function normalizeSettings(value: Partial<AppSettings> | null): AppSettings {
  return { ...defaultSettings, ...(value ?? {}) };
}

export function useAppSettings() {
  const currentSettings = useSyncExternalStore(subscribe, () => settings, () => settings);
  const isInitialized = useSyncExternalStore(subscribe, () => initialized, () => initialized);

  return {
    isInitialized,
    settings: currentSettings,
    updateAppSettings,
  };
}

export async function loadAppSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    settings = normalizeSettings(raw ? JSON.parse(raw) : null);
  } catch (error) {
    console.warn('Could not load app settings', error);
    settings = defaultSettings;
  } finally {
    initialized = true;
    emit();
  }
}

export async function updateAppSettings(patch: Partial<AppSettings>) {
  settings = normalizeSettings({ ...settings, ...patch });
  initialized = true;
  emit();

  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Could not save app settings', error);
  }
}
