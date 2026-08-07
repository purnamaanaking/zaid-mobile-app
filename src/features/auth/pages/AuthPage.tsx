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
      <View
        style={[
          styles.iconBox,
          {
            height: isCompactHeight ? 70 : 82,
            width: isCompactHeight ? 70 : 82,
          },
        ]}>
        <GoogleMark />
      </View>

      <Text style={styles.heading}>Continue with Google</Text>
      <Text style={styles.subtitle}>
        Choose your Google account first. Phone verification is locked until Google sign-in succeeds.
      </Text>

      <View style={styles.buttonRow}>
        {Platform.OS === 'web' ? (
          <>
            <div
              id={WEB_GOOGLE_BUTTON_ID}
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                minHeight: 44,
                width: '100%',
              }}
            />
            {!webButtonReady && (
              <Button
                accessibilityLabel="Continue with Google"
                className="self-stretch rounded-full"
                leftIcon={<GoogleMark small />}
                onPress={onGoogleSignIn}
                textClassName="font-semibold text-[#56575C]"
                variant="outline">
                Open Google Sign-In
              </Button>
            )}
          </>
        ) : (
          <Button
            accessibilityLabel="Continue with Google"
            className="self-stretch rounded-full"
            leftIcon={<GoogleMark small />}
            onPress={onGoogleSignIn}
            textClassName="font-semibold text-[#56575C]"
            variant="outline">
            Sign in with Google
          </Button>
        )}
      </View>

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

      <Text style={styles.footer}>Sign in with Google to continue to phone verification.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: '#F6F4FF',
    borderRadius: 28,
    justifyContent: 'center',
  },
  heading: {
    color: '#303244',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    color: '#707386',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    maxWidth: 280,
    textAlign: 'center',
  },
  buttonRow: {
    marginTop: 32,
    maxWidth: 340,
    width: '100%',
  },
  developerCopy: {
    color: '#98A1B8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    color: '#9CA1B5',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    maxWidth: 300,
    textAlign: 'center',
  },
});
