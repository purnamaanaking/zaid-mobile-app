import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.content, { paddingTop: isCompactHeight ? 58 : 58 }]}>
          <GoogleMark small />
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.copy}>
            Enter the OTP sent to <Text className="font-semibold text-[#3E3E44]">{maskedPhone}</Text>
          </Text>
          <View style={[styles.otpRow, { marginTop: isCompactHeight ? 42 : 69 }]}>
            {otp.map((digit, index) => (
              <TextInput
                accessibilityLabel={`OTP digit ${index + 1}`}
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
            <Text style={styles.resendText}>{"Didn't you receive the OTP? "}</Text>
            <Pressable accessibilityLabel="Resend OTP" accessibilityRole="button" onPress={onResendOtp}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            accessibilityLabel="Verify OTP"
            className="self-stretch"
            disabled={isDisabled}
            leftIcon={isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
            onPress={onVerify}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    alignItems: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 0,
    paddingTop: 16,
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
    fontSize: 22,
    fontWeight: '600',
    height: 42,
    includeFontPadding: false,
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
