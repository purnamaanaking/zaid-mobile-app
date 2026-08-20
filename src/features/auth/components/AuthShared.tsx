import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ZaidWordmark from '@/assets/brand/zaid-black.svg';

const ZAID_LOGO = require('@/assets/brand/zaid-icon.png');

export type AuthLayoutMetrics = {
  horizontalPadding: number;
  isCompactHeight: boolean;
  isNarrow: boolean;
  quoteFontSize: number;
  quoteHeight: number;
};

type AuthShellProps = {
  children: React.ReactNode;
  metrics: AuthLayoutMetrics;
};

export function AuthShell({ children, metrics }: AuthShellProps) {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const compactWordmarkTop = Math.max(insets.top + 10, 56);
  const keyboardQuoteHeight = Math.max(
    compactWordmarkTop + (metrics.isCompactHeight ? 48 : 64),
    metrics.isCompactHeight ? 108 : 128,
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.shell}>
      <View style={styles.screen}>
        <LinearGradient
          colors={['#FFFFFF', '#F6F6FF', '#E9EAFF']}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={[
            styles.quoteSection,
            { height: isKeyboardVisible ? keyboardQuoteHeight : metrics.quoteHeight },
          ]}>
          {!isKeyboardVisible ? (
            <>
              <ZaidWordmark accessibilityLabel="ZAID" height={17} style={styles.wordmark} width={57} />
              <View style={styles.quoteWrap}>
                <Text style={[styles.quoteText, { fontSize: metrics.quoteFontSize }]}>
                  The time has{'\n'}passed so quickly.
                </Text>
                <Text style={styles.quoteAuthor}>-Socrates</Text>
              </View>
            </>
          ) : (
            <ZaidWordmark
              accessibilityLabel="ZAID"
              height={16}
              style={[styles.wordmarkCompact, { marginTop: compactWordmarkTop }]}
              width={54}
            />
          )}
        </LinearGradient>

        <View
          style={[
            styles.panel,
            {
              paddingBottom: isKeyboardVisible ? 16 : 59,
              paddingHorizontal: metrics.horizontalPadding + 18,
            },
          ]}>
          <View style={styles.handle} />
          <View style={styles.panelContent}>{children}</View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export function BrandHeader() {
  return (
    <View className="flex-row items-center justify-center gap-1.5 pt-[18px]">
      <ZaidWordmark accessibilityLabel="ZAID" height={17} width={57} />
    </View>
  );
}

export function ZaidLogo({
  inverse = false,
  logoSize,
  size,
}: {
  inverse?: boolean;
  logoSize?: number;
  size: 'small' | 'large';
}) {
  const isLarge = size === 'large';

  return (
    <View
      className="items-center justify-center"
      style={
        inverse && Platform.OS !== 'web'
          ? {
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.16,
              shadowRadius: 20,
            }
          : undefined
      }>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={ZAID_LOGO}
        style={[
          isLarge ? { height: 156, width: 156 } : { height: 18, width: 18 },
          isLarge && logoSize ? { height: logoSize, width: logoSize } : null,
          inverse && Platform.OS === 'web' ? ({ filter: 'drop-shadow(0px 8px 12px rgba(0, 0, 0, 0.15))' } as any) : null,
        ]}
      />
    </View>
  );
}

const GOOGLE_LOGO = require('@/assets/images/google-logo.png');

export function GoogleMark({ small = false }: { small?: boolean }) {
  const size = small ? 24 : 94;
  return (
    <Image
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      source={GOOGLE_LOGO}
      style={{ height: size, width: size }}
    />
  );
}

export function AuthSuccessNotice({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.successNotice}>
      <MaterialIcons name="check-circle" size={16} color="#1FAA74" />
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

export function AuthLoadingContent() {
  return (
    <View style={styles.loadingContent}>
      <GoogleMark />
      <ActivityIndicator accessibilityLabel="Loading" color="#7479FF" size="large" style={styles.loadingSpinner} />
      <Text style={styles.loadingTitle}>Setting up your account</Text>
      <Text style={styles.loadingCopy}>Please wait while we take you to ZAID.</Text>
    </View>
  );
}

export function PermissionItem({
  icon,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}) {
  return (
    <View className="min-h-[58px] flex-row items-center gap-3 rounded-[14px] border border-border px-4">
      <MaterialIcons name={icon} size={22} color="#7379FF" />
      <Text className="flex-1 text-[15px] font-semibold text-[#56575C]">{label}</Text>
      <MaterialIcons name="check-circle" size={20} color="#7379FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    alignSelf: 'center',
    backgroundColor: '#E8E9EF',
    borderRadius: 999,
    height: 8,
    marginTop: 20,
    width: 87,
  },
  loadingContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingCopy: {
    color: '#98A1B8',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingSpinner: {
    marginTop: 30,
  },
  loadingTitle: {
    color: '#56575C',
    fontSize: 21,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    flex: 1,
    marginTop: -1,
    overflow: 'hidden',
  },
  panelContent: {
    flex: 1,
  },
  quoteAuthor: {
    color: '#374151',
    fontFamily: Platform.select({ android: 'serif', default: 'Georgia' }),
    fontSize: 18,
    lineHeight: 26,
    marginTop: 26,
    textAlign: 'center',
  },
  quoteSection: {
    alignItems: 'center',
    width: '100%',
  },
  quoteText: {
    color: '#374151',
    fontFamily: Platform.select({ android: 'serif', default: 'Georgia' }),
    lineHeight: 58,
    textAlign: 'center',
  },
  quoteWrap: {
    alignItems: 'center',
    marginTop: 85,
  },
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  shell: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  successNotice: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#E6FBF5',
    borderColor: '#C3F3E3',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  successText: {
    color: '#1E7B58',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  wordmark: {
    marginTop: 69,
  },
  wordmarkCompact: {
    marginTop: 28,
  },
});
