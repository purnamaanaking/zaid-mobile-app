import { Animated } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { ZaidLogo } from "@/src/features/auth/components/AuthShared";

type WelcomePageProps = {
  fade: Animated.Value;
  logoSize: number;
  wordmarkSize: number;
};

export function WelcomePage({
  fade,
  logoSize,
  wordmarkSize,
}: WelcomePageProps) {
  return (
    <SafeAreaView
      style={{
        alignItems: 'center',
        backgroundColor: '#625DFF',
        flex: 1,
        justifyContent: 'center',
      }}>
      <Animated.View
        className="items-center gap-[30px]"
        style={{ opacity: fade, transform: [{ translateY: -8 }] }}
      >
        <ZaidLogo logoSize={logoSize} size="large" inverse />
      </Animated.View>
    </SafeAreaView>
  );
}
