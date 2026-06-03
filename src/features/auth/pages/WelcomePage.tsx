import { Animated, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
    <LinearGradient
      colors={['#4F46E5', '#6366F1', '#8B5CF6']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          className="items-center gap-[30px]"
          style={{ opacity: fade, transform: [{ translateY: -8 }] }}
        >
          <ZaidLogo logoSize={logoSize} size="large" inverse />
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
