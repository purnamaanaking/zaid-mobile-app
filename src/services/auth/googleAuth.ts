import { Platform } from 'react-native';

// Dynamic require declarations to prevent Metro crashes if package is not installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: {
          auto_select?: boolean;
          callback: (response: GoogleCredentialResponse) => void;
          cancel_on_tap_outside?: boolean;
          client_id: string;
          prompt_parent_id?: string;
          use_fedcm_for_prompt?: boolean;
        }) => void;
        prompt: (callback?: (notification: unknown) => void) => void;
      };
    };
  };
};

declare const window: (Window & GoogleAccounts) | undefined;
declare const document: Document | undefined;

let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch {
  // Package not installed yet by developer
}

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '415497871679-kkjd4tuniojn2jgjbn6pavhjr4p2kf4t.apps.googleusercontent.com';

let webGoogleScriptPromise: Promise<void> | null = null;
let pendingWebResolve: ((idToken: string | null) => void) | null = null;
let pendingWebReject: ((error: Error) => void) | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (Platform.OS !== 'web') return Promise.resolve();
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return Promise.reject(new Error('Google web sign-in requires a browser environment.'));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (webGoogleScriptPromise) return webGoogleScriptPromise;

  webGoogleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });

  return webGoogleScriptPromise;
}

export const isGoogleSigninAvailable = (): boolean => {
  return Platform.OS === 'web' || GoogleSignin !== null;
};

export const initGoogleAuth = () => {
  if (Platform.OS === 'web') {
    loadGoogleIdentityScript().catch((error) => {
      console.error('[GoogleAuth] Failed to initialize Google web sign-in:', error);
    });
    return;
  }

  if (!GoogleSignin) {
    console.log('[GoogleAuth] Native package is not installed. Running in mock bypass mode.');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
    console.log('[GoogleAuth] Google Sign-In initialized successfully.');
  } catch (error) {
    console.error('[GoogleAuth] Failed to initialize Google Sign-In:', error);
  }
};

async function signInWithGoogleWeb(): Promise<string | null> {
  await loadGoogleIdentityScript();

  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    throw new Error('Google Identity Services is not available.');
  }

  return new Promise((resolve, reject) => {
    pendingWebResolve?.(null);
    pendingWebResolve = resolve;
    pendingWebReject = reject;

    window.google?.accounts?.id?.initialize({
      auto_select: false,
      callback: (response: GoogleCredentialResponse) => {
        const credential = response.credential ?? null;
        pendingWebResolve = null;
        pendingWebReject = null;
        resolve(credential);
      },
      cancel_on_tap_outside: true,
      client_id: GOOGLE_WEB_CLIENT_ID,
      use_fedcm_for_prompt: false,
    });

    window.google?.accounts?.id?.prompt((notification: any) => {
      if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        const reason = notification?.getNotDisplayedReason?.() || notification?.getSkippedReason?.() || 'unknown';
        pendingWebResolve = null;
        pendingWebReject = null;
        reject(new Error(`Google account chooser was not displayed: ${reason}`));
      }
    });
  });
}

export const signInWithGoogle = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return signInWithGoogleWeb();
  }

  if (!GoogleSignin) {
    console.log('[GoogleAuth] Mock login triggered (Google Sign-In not installed).');
    return 'mock-google-id-token';
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    // In newer versions of the library, response contains data property, but let's handle both
    const idToken = response.idToken || (response.data && response.data.idToken);
    return idToken ?? null;
  } catch (error: any) {
    console.error('[GoogleAuth] Sign-in error:', error);
    pendingWebReject?.(error);
    throw error;
  }
};
