import { Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { GoogleMark } from '@/src/features/auth/components/AuthShared';

type OtpVerificationPageProps = {
  isCompactHeight: boolean;
  maskedPhone: string;
  onOtpChange: (value: string, index: number) => void;
  onOtpKeyPress: (key: string, index: number) => void;
  onVerify: () => void;
  otp: string[];
  otpInputRefs: React.MutableRefObject<(TextInput | null)[]>;
  otpInputWidth: number;
};

export function OtpVerificationPage({
  isCompactHeight,
  maskedPhone,
  onOtpChange,
  onOtpKeyPress,
  onVerify,
  otp,
  otpInputRefs,
  otpInputWidth,
}: OtpVerificationPageProps) {
  const isDisabled = otp.some((digit) => !digit);

  return (
    <View className="flex-1 items-center">
      <GoogleMark />
      <Text className="mt-[26px] text-center text-[22px] font-semibold text-[#56575C]">
        OTP Verification
      </Text>
      <Text className="mt-2.5 text-center text-[15px] leading-[22px] text-[#57575F]">
        Enter the OTP sent to <Text className="font-semibold text-[#3E3E44]">{maskedPhone}</Text>
      </Text>
      <View className="flex-row gap-2" style={{ marginTop: isCompactHeight ? 44 : 70 }}>
        {otp.map((digit, index) => (
          <TextInput
            accessibilityLabel={`OTP digit ${index + 1}`}
            className="h-[42px] border-b border-[#CFCFD4] text-[22px] font-semibold text-[#34343A]"
            key={index}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(value) => onOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => onOtpKeyPress(nativeEvent.key, index)}
            ref={(input) => {
              otpInputRefs.current[index] = input;
            }}
            style={{
              borderBottomColor: digit ? '#7479FF' : '#CFCFD4',
              includeFontPadding: false,
              textAlign: 'center',
              textAlignVertical: 'center',
              width: otpInputWidth,
            }}
            textAlign="center"
            value={digit}
          />
        ))}
      </View>
      <View className="mt-[26px] flex-row items-center justify-center">
        <Text className="text-[13px] text-muted">Did not receive the OTP? </Text>
        <Pressable accessibilityLabel="Resend OTP" accessibilityRole="button">
          <Text className="text-[13px] text-[#6268FF]">Resend OTP</Text>
        </Pressable>
      </View>
      <Button
        accessibilityLabel="Verify OTP"
        className="mt-auto self-stretch"
        disabled={isDisabled}
        onPress={onVerify}>
        Verify
      </Button>
    </View>
  );
}
