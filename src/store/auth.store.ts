import { useSyncExternalStore } from 'react';
import { deleteAuthToken, getAuthToken, setAuthToken } from '@/src/services/storage/token';
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
    const token = await getAuthToken();
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
        console.warn('Backend profile fetch failed; clearing invalid session', err);
        await deleteAuthToken();
        user = null;
        isAuthenticated = false;
      }
    } else {
      isAuthenticated = false;
    }
  } catch (e) {
    console.error('Auth token read error', e);
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
      await setAuthToken(token);
    } else {
      throw new Error('Login requires a backend access token.');
    }
  } catch (e) {
    console.warn('Could not save auth token to SecureStore', e);
  }

  if (!userProfile) {
    throw new Error('Login requires a backend user profile.');
  }

  user = userProfile;
  isAuthenticated = true;
  emit();
}

export async function logout() {
  try {
    await deleteAuthToken();
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
