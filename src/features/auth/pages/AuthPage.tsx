import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { GoogleMark } from '@/src/features/auth/components/AuthShared';
import { addGoogleWebCredentialListener, renderGoogleWebButton } from '@/src/services/auth/googleAuth';

type AuthPageProps = {
  enableDeveloperSignIn?: boolean;
  isCompactHeight: boolean;
  onDeveloperSignIn?: () => void;
  onGoogleCredential?: (idToken: string) => void;
  onGoogleSignIn: () => void;
};

const WEB_GOOGLE_BUTTON_ID = 'zaid-google-signin-button';

export function AuthPage({
  enableDeveloperSignIn = false,
  isCompactHeight,
  onDeveloperSignIn,
  onGoogleCredential,
  onGoogleSignIn,
}: AuthPageProps) {
  const [webButtonReady, setWebButtonReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    const unsubscribe = addGoogleWebCredentialListener((idToken) => {
      onGoogleCredential?.(idToken);
    });

    renderGoogleWebButton(WEB_GOOGLE_BUTTON_ID)
      .then(setWebButtonReady)
      .catch((error) => {
        console.warn('[GoogleAuth] Google web button render failed', error);
        setWebButtonReady(false);
      });

    return () => {
      unsubscribe();
    };
  }, [onGoogleCredential]);

  return (
    <View style={styles.container}>
      <View style={[styles.loginContent, { paddingTop: isCompactHeight ? 88 : 126 }]}>
        <GoogleMark />
        {Platform.OS === 'web' ? (
          <View style={styles.webButtonSlot}>
            <div
              id={WEB_GOOGLE_BUTTON_ID}
              style={{
                display: webButtonReady ? 'none' : 'block',
                height: 0,
                overflow: 'hidden',
                width: 0,
              }}
            />
          </View>
        ) : (
          null
        )}
      </View>

      <Button
        accessibilityLabel="Login with Google"
        className="self-stretch"
        onPress={onGoogleSignIn}>
        Log In
      </Button>
      {enableDeveloperSignIn ? (
        <>
          <Button
            accessibilityLabel="Developer sign in"
            className="mt-3 self-stretch"
            onPress={onDeveloperSignIn}
            textClassName="text-[#6268FF]"
            variant="ghost">
            Developer Sign In
          </Button>
          <Text style={styles.developerCopy}>Preview the app without Google authentication.</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  googleCopy: {
    color: '#98A1B8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 31,
    textAlign: 'center',
  },
  developerCopy: {
    color: '#98A1B8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    textAlign: 'center',
  },
  loginContent: {
    alignItems: 'center',
    flex: 1,
  },
  webButtonSlot: {
    height: 0,
    width: 0,
  },
});
