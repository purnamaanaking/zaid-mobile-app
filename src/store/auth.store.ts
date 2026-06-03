import { useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/src/services/api/auth.api';

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone_number?: string;
  phone_verified?: boolean;
  status?: string;
};

// Global in-memory state
let isAuthenticated = false;
let user: UserProfile | null = null;
let isInitialized = false;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuthStore() {
  const isAuth = useSyncExternalStore(subscribe, () => isAuthenticated, () => isAuthenticated);
  const currentUser = useSyncExternalStore(subscribe, () => user, () => user);
  const initialized = useSyncExternalStore(subscribe, () => isInitialized, () => isInitialized);

  return {
    isAuthenticated: isAuth,
    user: currentUser,
    isInitialized: initialized,
    login,
    logout,
    checkAuth,
    setProfile,
  };
}

export async function checkAuth(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      // Try to load real profile from backend
      try {
        const res = await authApi.getProfile();
        if (res.success && res.data) {
          user = {
            id: res.data.id,
            email: res.data.email,
            full_name: res.data.full_name,
            avatar_url: res.data.avatar_url,
            phone_number: res.data.phone_number,
            phone_verified: res.data.phone_verified,
            status: res.data.status,
          };
          isAuthenticated = true;
        } else {
          isAuthenticated = false;
        }
      } catch (err) {
        console.warn('Backend profile fetch failed, using mock profile fallback', err);
        // Fallback: keep authenticated if token exists (offline/local mode bypass)
        user = {
          id: 'mock-user-1',
          email: 'adam.smith@gmail.com',
          full_name: 'Adam Smith (Offline)',
          avatar_url: null,
          phone_verified: true,
          status: 'active',
        };
        isAuthenticated = true;
      }
    } else {
      isAuthenticated = false;
    }
  } catch (e) {
    console.error('SecureStore read error', e);
    isAuthenticated = false;
  } finally {
    isInitialized = true;
    emit();
  }
  return isAuthenticated;
}

export async function login(token?: string, userProfile?: UserProfile) {
  try {
    if (token) {
      await SecureStore.setItemAsync('auth_token', token);
    } else {
      // If no token is provided, store a mock token for bypass testing
      await SecureStore.setItemAsync('auth_token', 'mock-bypass-jwt-token');
    }
  } catch (e) {
    console.warn('Could not save auth token to SecureStore', e);
  }

  user = userProfile || {
    id: 'mock-user-1',
    email: 'adam.smith@gmail.com',
    full_name: 'Adam Smith',
    avatar_url: null,
    phone_verified: true,
    status: 'active',
  };
  isAuthenticated = true;
  emit();
}

export async function logout() {
  try {
    await SecureStore.deleteItemAsync('auth_token');
    await authApi.logout().catch((err) => {
      console.warn('API logout endpoint call failed', err);
    });
  } catch (e) {
    console.warn('Could not clear auth token', e);
  }

  user = null;
  isAuthenticated = false;
  emit();
}

export function setProfile(updatedUser: Partial<UserProfile>) {
  if (user) {
    user = { ...user, ...updatedUser };
    emit();
  }
}
