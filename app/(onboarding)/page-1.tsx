import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import WelcomeSplash from '@/assets/images/splash-2.svg';
import { Fonts } from '@/src/constants/typography';

export default function OnboardingPage1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const sheetHeight = Math.min(372, Math.max(318, height * 0.4));
  const visualHeight = height - sheetHeight + 30;
  const illustrationWidth = Math.min(width * 0.78, 313);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FFFFFF', '#F4F5FF', '#FFFFFF']} locations={[0, 0.46, 1]} style={StyleSheet.absoluteFill} />

      <View style={[styles.visualSection, { height: visualHeight, paddingTop: Math.max(insets.top + 30, 66) }]}>
        <Text style={styles.brand}>ZAID.</Text>
        <WelcomeSplash width={illustrationWidth} height={(illustrationWidth * 310) / 313} style={styles.illustration} />
      </View>

      <View style={[styles.sheet, { height: sheetHeight, paddingBottom: Math.max(insets.bottom + 36, 50) }]}>
        <View style={styles.handle} />

        <View style={styles.copy}>
          <Text style={styles.title}>Selamat datang di ZAID</Text>
          <Text style={styles.subtitle}>
            Asisten AI untuk mengubah chat, email, dan catatan menjadi jadwal terstruktur.
          </Text>
        </View>

        <View style={styles.controls}>
          <View style={styles.buttonPlaceholder} />
          <View style={styles.dots} accessibilityElementsHidden>
            <View style={styles.activeDot} />
            <View style={styles.inactiveDot} />
          </View>
          <Pressable
            accessibilityLabel="Lanjut ke halaman fitur"
            accessibilityRole="button"
            onPress={() => router.push('/(onboarding)/page-2')}
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
          >
            <MaterialIcons name="chevron-right" color="#FFFFFF" size={28} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  visualSection: {
    alignItems: 'center',
  },
  brand: {
    color: '#111318',
    fontFamily: Fonts.displaySemi,
    fontSize: 21,
    letterSpacing: 0,
    lineHeight: 28,
  },
  illustration: {
    marginTop: 74,
  },
  sheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    shadowColor: '#D8DCF6',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  handle: {
    width: 88,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E8EAF1',
    marginTop: 34,
  },
  copy: {
    width: '100%',
    maxWidth: 342,
    alignItems: 'center',
    marginTop: 78,
  },
  title: {
    color: '#5A5A61',
    fontFamily: Fonts.displaySemi,
    fontSize: 23,
    letterSpacing: 0,
    lineHeight: 31,
    textAlign: 'center',
  },
  subtitle: {
    color: '#5E5E66',
    fontFamily: Fonts.bodyRegular,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    right: 24,
    bottom: 46,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonPlaceholder: {
    width: 50,
    height: 50,
  },
  navButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: '#665CFF',
  },
  navButtonPressed: {
    opacity: 0.82,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  activeDot: {
    width: 20,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#665CFF',
  },
  inactiveDot: {
    width: 9,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#ECEEFF',
  },
});
