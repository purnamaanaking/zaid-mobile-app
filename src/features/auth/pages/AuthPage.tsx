import { Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { GoogleMark } from '@/src/features/auth/components/AuthShared';

type AuthPageProps = {
  isCompactHeight: boolean;
  onGoogleSignIn: () => void;
};

export function AuthPage({ isCompactHeight, onGoogleSignIn }: AuthPageProps) {
  return (
    <View className="flex-1 items-center">
      <GoogleMark />
      <Text className="mt-[26px] text-center text-[22px] font-semibold text-[#56575C]">
        Continue with Google
      </Text>
      <Text className="mt-2.5 text-center text-[15px] leading-[22px] text-[#57575F]">
        Login with your Google account to continue with ZAID.
      </Text>
      <Button
        accessibilityLabel="Continue with Google"
        className="self-stretch rounded-xl"
        leftIcon={<GoogleMark small />}
        onPress={onGoogleSignIn}
        style={{ marginTop: isCompactHeight ? 44 : 72 }}
        textClassName="font-semibold text-[#56575C]"
        variant="outline">
        Sign in with Google
      </Button>
    </View>
  );
}
