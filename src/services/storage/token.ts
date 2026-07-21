import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const DEVELOPER_AUTH_KEY = 'developer_auth_session';

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function deleteAuthToken(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export async function getDeveloperAuthSession(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(DEVELOPER_AUTH_KEY) === 'true';
  }

  return (await SecureStore.getItemAsync(DEVELOPER_AUTH_KEY)) === 'true';
}

export async function setDeveloperAuthSession(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(DEVELOPER_AUTH_KEY, 'true');
    return;
  }

  await SecureStore.setItemAsync(DEVELOPER_AUTH_KEY, 'true');
}

export async function deleteDeveloperAuthSession(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(DEVELOPER_AUTH_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(DEVELOPER_AUTH_KEY);
}
