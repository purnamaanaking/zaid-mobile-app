import { useSyncExternalStore } from 'react';

let isAuthenticated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuthStore() {
  const state = useSyncExternalStore(subscribe, () => isAuthenticated, () => isAuthenticated);
  return {
    isAuthenticated: state,
    login,
    logout,
  };
}

export function login() {
  isAuthenticated = true;
  emit();
}

export function logout() {
  isAuthenticated = false;
  emit();
}
