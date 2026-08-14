import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ZaidWordmark from '@/assets/brand/zaid-black.svg';
import { Fonts } from '@/src/constants/typography';

const ZAID_LOGO = require('@/assets/brand/zaid-icon.png');

type AuthSuccessSplashProps = {
  onComplete: () => void;
  duration?: number;
};

export function AuthSuccessSplash({ onComplete, duration = 2200 }: AuthSuccessSplashProps) {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslateY = useRef(new Animated.Value(20)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const animationSequence = Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkTranslateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(duration - 1200),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      containerOpacity.setValue(0);
      onComplete();
    });

    return () => {
      animationSequence.stop();
    };
  }, [duration, onComplete, logoScale, logoOpacity, wordmarkOpacity, wordmarkTranslateY, backgroundOpacity, containerOpacity]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: containerOpacity,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }
      ]}
      pointerEvents="none"
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backgroundOpacity }]}>
        <LinearGradient
          colors={['#FFFFFF', '#F6F6FF', '#E9EAFF']}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.content}>
        <Animated.Image
          source={ZAID_LOGO}
          style={[
            styles.logo,
            {
              width: Math.min(width * 0.4, 156),
              height: Math.min(width * 0.4, 156),
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />
        
        <Animated.View
          style={[
            styles.wordmarkContainer,
            {
              opacity: wordmarkOpacity,
              transform: [{ translateY: wordmarkTranslateY }],
            },
          ]}
        >
          <ZaidWordmark accessibilityLabel="ZAID" height={24} width={80} />
        </Animated.View>
        
        <Animated.Text 
          style={[
            styles.tagline,
            { opacity: wordmarkOpacity }
          ]}
        >
          Welcome to ZAID
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: 24,
  },
  wordmarkContainer: {
    marginBottom: 12,
  },
  tagline: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
});
