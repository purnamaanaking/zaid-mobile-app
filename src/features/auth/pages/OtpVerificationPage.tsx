import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { GoogleMark } from '@/src/features/auth/components/AuthShared';

type OtpVerificationPageProps = {
  isCompactHeight: boolean;
  isLoading?: boolean;
  maskedPhone: string;
  onOtpChange: (value: string, index: number) => void;
  onOtpKeyPress: (key: string, index: number) => void;
  onVerify: () => void;
  otp: string[];
  otpInputRefs: React.MutableRefObject<(TextInput | null)[]>;
  otpInputWidth: number;
  onResendOtp?: () => void;
};

export function OtpVerificationPage({
  isCompactHeight,
  isLoading = false,
  maskedPhone,
  onOtpChange,
  onOtpKeyPress,
  onVerify,
  otp,
  otpInputRefs,
  otpInputWidth,
  onResendOtp,
}: OtpVerificationPageProps) {
  const isDisabled = isLoading || otp.some((digit) => !digit);

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={[styles.scrollContent, { paddingTop: isCompactHeight ? 36 : 58 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <GoogleMark small />
        <Text style={styles.title}>Verifikasi OTP</Text>
        <Text style={styles.copy}>
          Masukkan OTP yang dikirim ke <Text className="font-semibold text-[#3E3E44]">{maskedPhone}</Text>
        </Text>
        <View style={[styles.otpRow, { marginTop: isCompactHeight ? 36 : 56 }]}>
          {otp.map((digit, index) => (
            <TextInput
              accessibilityLabel={`Digit OTP ${index + 1}`}
              key={index}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(value) => onOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => onOtpKeyPress(nativeEvent.key, index)}
              ref={(input) => {
                otpInputRefs.current[index] = input;
              }}
              style={[
                styles.otpInput,
                {
                  borderBottomColor: digit ? '#665CFF' : '#CFCFD4',
                  width: otpInputWidth,
                },
              ]}
              textAlign="center"
              value={digit}
            />
          ))}
        </View>
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>{"Belum menerima OTP? "}</Text>
          <Pressable accessibilityLabel="Kirim Ulang OTP" accessibilityRole="button" onPress={onResendOtp}>
            <Text style={styles.resendLink}>Kirim Ulang OTP</Text>
          </Pressable>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            accessibilityLabel="Verifikasi OTP"
            className="self-stretch"
            disabled={isDisabled}
            leftIcon={isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
            onPress={onVerify}>
            {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  content: {
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 32,
    width: '100%',
  },
  copy: {
    color: '#57575F',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    textAlign: 'center',
  },
  otpInput: {
    borderBottomWidth: 1,
    color: '#34343A',
    fontSize: 16,
    fontWeight: '600',
    height: 42,
    includeFontPadding: false,
    lineHeight: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resendLink: {
    color: '#665CFF',
    fontSize: 13,
    lineHeight: 18,
  },
  resendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 26,
  },
  resendText: {
    color: '#98A1B8',
    fontSize: 13,
    lineHeight: 18,
  },
  title: {
    color: '#56575C',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
    marginTop: 28,
    textAlign: 'center',
  },
});
