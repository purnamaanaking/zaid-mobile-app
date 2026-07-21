import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { AuthSuccessNotice, GoogleMark } from '@/src/features/auth/components/AuthShared';

type PhoneOtpPageProps = {
  errorMessage?: string;
  isCompactHeight: boolean;
  isLoading?: boolean;
  onChangePhone: (phone: string) => void;
  onGetOtp: () => void;
  phone: string;
  successMessage?: string;
};

export function PhoneOtpPage({
  errorMessage,
  isCompactHeight,
  isLoading = false,
  onChangePhone,
  onGetOtp,
  phone,
  successMessage,
}: PhoneOtpPageProps) {
  const isDisabled = isLoading || phone.replace(/\D/g, '').length < 8;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: isCompactHeight ? 58 : 58 }]}>
        {successMessage ? <AuthSuccessNotice message={successMessage} /> : null}
        <GoogleMark small />
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.copy}>
          We will send you one-time password{'\n'}to you mobile number
        </Text>

        <View style={styles.inputWrap}>
        <TextInput
          accessibilityLabel="Enter WhatsApp number"
          keyboardType="phone-pad"
          maxLength={18}
          onChangeText={onChangePhone}
          onSubmitEditing={onGetOtp}
          placeholder="Enter Mobile Number"
          placeholderTextColor="#A6AEC4"
          returnKeyType="send"
          style={[styles.input, errorMessage ? styles.inputError : null]}
          value={phone}
        />
        </View>

        {errorMessage ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}
      </View>

      <Button
        accessibilityLabel="Get OTP"
        className="self-stretch"
        disabled={isDisabled}
        leftIcon={isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
        onPress={onGetOtp}>
        {isLoading ? 'Sending...' : 'Get OTP'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
  },
  copy: {
    color: '#57575F',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 7,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    maxWidth: 300,
    textAlign: 'center',
  },
  input: {
    borderBottomColor: '#CFCFD4',
    borderBottomWidth: 1,
    color: '#33333A',
    fontSize: 14,
    height: 56,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
    width: '100%',
  },
  inputError: {
    borderBottomColor: '#EF4444',
  },
  inputWrap: {
    marginTop: 43,
    width: 275,
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
