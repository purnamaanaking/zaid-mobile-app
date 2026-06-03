import { MaterialIcons } from '@expo/vector-icons';
import { Image, ScrollView, Text, View, Platform } from 'react-native';

const ZAID_LOGO = require('@/src/components/image/logo-zaid.png');

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
  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8FF' }}>
      <View
        className="overflow-hidden bg-[#F8F8FF] pt-2"
        style={{ height: metrics.quoteHeight }}>
        <BrandHeader />
        <View
          className="items-center justify-center"
          style={{ paddingTop: metrics.isCompactHeight ? 24 : 48 }}>
          <Text
            className="text-center text-[#32384D]"
            style={[
              {
                fontSize: metrics.quoteFontSize,
                lineHeight: metrics.quoteFontSize * 1.55,
              },
            ]}>
            The time has{'\n'}passed so quickly.
          </Text>
          <Text
            className="mt-[12px] text-[#32384D]"
            style={{
              fontSize: metrics.isNarrow ? 16 : 18,
            }}>
            -Socrates
          </Text>
        </View>
      </View>

      <View
        className="flex-1 rounded-t-[34px] bg-card pt-5"
        style={{
          marginTop: metrics.isCompactHeight ? 8 : 16,
          paddingBottom: metrics.isCompactHeight ? 24 : 42,
          paddingHorizontal: metrics.horizontalPadding,
        }}>
        <View className="mb-7 h-2 w-[88px] self-center rounded-full bg-[#E7E8EC]" />
        <ScrollView
          bounces={false}
          contentContainerClassName="flex-grow"
          contentContainerStyle={{ minHeight: metrics.isCompactHeight ? 280 : 330 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

export function BrandHeader() {
  return (
    <View className="flex-row items-center justify-center gap-1.5 pt-[18px]">
      <ZaidLogo size="small" />
      <Text className="text-[23px] font-semibold text-black">ZAID.</Text>
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
  const size = small ? 24 : 42;
  return (
    <Image
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      source={GOOGLE_LOGO}
      style={{ height: size, width: size }}
    />
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
