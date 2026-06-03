import { Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { GoogleMark } from '@/src/features/auth/components/AuthShared';

type PhoneOtpPageProps = {
  isCompactHeight: boolean;
  isLoading?: boolean;
  onChangePhone: (phone: string) => void;
  onGetOtp: () => void;
  phone: string;
};

export function PhoneOtpPage({ isCompactHeight, isLoading = false, onChangePhone, onGetOtp, phone }: PhoneOtpPageProps) {
  const isDisabled = isLoading || phone.replace(/\D/g, '').length < 8;

  return (
    <View className="flex-1 items-center px-1">
      <View
        className="items-center justify-center rounded-[28px] bg-[#F6F4FF]"
        style={{ height: isCompactHeight ? 70 : 82, width: isCompactHeight ? 70 : 82 }}>
        <GoogleMark />
      </View>

      <Text className="mt-6 text-center text-[24px] font-semibold text-[#303244]">
        Verify WhatsApp Number
      </Text>
      <Text className="mt-3 max-w-[300px] text-center text-[14px] leading-[21px] text-[#707386]">
        Enter your active WhatsApp number. We will send a 6-digit OTP via WhatsApp, with email fallback.
      </Text>

      <View className="mt-8 w-full max-w-[340px]">
        <TextInput
          accessibilityLabel="Enter WhatsApp number"
          className="h-[56px] rounded-2xl border border-[#D9DCE8] bg-white px-5 text-center text-base text-[#33333A]"
          keyboardType="phone-pad"
          maxLength={18}
          onChangeText={onChangePhone}
          onSubmitEditing={onGetOtp}
          placeholder="081234567890"
          placeholderTextColor="#A6AEC4"
          returnKeyType="send"
          style={{
            includeFontPadding: false,
            textAlignVertical: 'center',
          }}
          value={phone}
        />

        <Button
          accessibilityLabel="Get OTP"
          className="mt-3 self-stretch rounded-2xl"
          disabled={isDisabled}
          onPress={onGetOtp}>
          {isLoading ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      </View>

      <Text className="mt-5 max-w-[320px] text-center text-[12px] leading-[18px] text-[#9CA1B5]">
        Make sure this number is connected to WhatsApp. Indonesian numbers can start with 08 or +62.
      </Text>
    </View>
  );
}
