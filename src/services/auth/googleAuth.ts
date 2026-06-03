// Dynamic require declarations to prevent Metro crashes if package is not installed
declare const require: any;

let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch {
  // Package not installed yet by developer
}

export const isGoogleSigninAvailable = (): boolean => {
  return GoogleSignin !== null;
};

export const initGoogleAuth = () => {
  if (!GoogleSignin) {
    console.log('[GoogleAuth] Native package is not installed. Running in mock bypass mode.');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
      offlineAccess: false,
    });
    console.log('[GoogleAuth] Google Sign-In initialized successfully.');
  } catch (error) {
    console.error('[GoogleAuth] Failed to initialize Google Sign-In:', error);
  }
};

export const signInWithGoogle = async (): Promise<string | null> => {
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
    throw error;
  }
};
