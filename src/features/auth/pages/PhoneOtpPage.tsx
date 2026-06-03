import { Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { GoogleMark } from '@/src/features/auth/components/AuthShared';

type PhoneOtpPageProps = {
  isCompactHeight: boolean;
  onChangePhone: (phone: string) => void;
  onGetOtp: () => void;
  phone: string;
};

export function PhoneOtpPage({ isCompactHeight, onChangePhone, onGetOtp, phone }: PhoneOtpPageProps) {
  const isDisabled = phone.trim().length < 6;

  return (
    <View className="flex-1 items-center">
      <GoogleMark />
      <Text className="mt-[26px] text-center text-[22px] font-semibold text-[#56575C]">
        OTP Verification
      </Text>
      <Text className="mt-2.5 text-center text-[15px] leading-[22px] text-[#57575F]">
        We will send you one-time password{'\n'}to you mobile number
      </Text>
      <TextInput
        accessibilityLabel="Enter mobile number"
        className="h-[58px] self-stretch border-b border-[#CFCFD4] text-base text-[#33333A]"
        keyboardType="phone-pad"
        maxLength={16}
        onChangeText={onChangePhone}
        placeholder="Enter Mobile Number"
        placeholderTextColor="#A6AEC4"
        style={{
          includeFontPadding: false,
          marginTop: isCompactHeight ? 28 : 42,
          textAlign: 'center',
          textAlignVertical: 'center',
        }}
        value={phone}
      />
      <Button
        accessibilityLabel="Get OTP"
        className="mt-auto self-stretch"
        disabled={isDisabled}
        onPress={onGetOtp}>
        Get OTP
      </Button>
    </View>
  );
}
