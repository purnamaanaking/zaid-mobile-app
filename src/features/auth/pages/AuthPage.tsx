import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { GoogleMark } from '@/src/features/auth/components/AuthShared';
import { addGoogleWebCredentialListener, renderGoogleWebButton } from '@/src/services/auth/googleAuth';

type AuthPageProps = {
  isCompactHeight: boolean;
  onGoogleCredential?: (idToken: string) => void;
  onGoogleSignIn: () => void;
};

const WEB_GOOGLE_BUTTON_ID = 'zaid-google-signin-button';

export function AuthPage({ isCompactHeight, onGoogleCredential, onGoogleSignIn }: AuthPageProps) {
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
    <View className="flex-1 items-center px-1">
      <View
        className="items-center justify-center rounded-[28px] bg-[#F6F4FF]"
        style={{ height: isCompactHeight ? 70 : 82, width: isCompactHeight ? 70 : 82 }}>
        <GoogleMark />
      </View>

      <Text className="mt-6 text-center text-[24px] font-semibold text-[#303244]">
        Continue with Google
      </Text>
      <Text className="mt-3 max-w-[280px] text-center text-[14px] leading-[21px] text-[#707386]">
        Choose your Google account first. Phone verification is locked until Google sign-in succeeds.
      </Text>

      <View className="mt-8 w-full max-w-[340px]">
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

      <Pressable accessibilityRole="text" className="mt-5 max-w-[300px]">
        <Text className="text-center text-[12px] leading-[18px] text-[#9CA1B5]">
          No demo bypass available. Your account must be authenticated by Google before onboarding.
        </Text>
      </Pressable>
    </View>
  );
}
