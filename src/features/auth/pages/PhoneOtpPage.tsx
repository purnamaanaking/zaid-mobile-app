import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
    <ScrollView
      bounces={false}
      contentContainerStyle={[styles.scrollContent, { paddingTop: isCompactHeight ? 36 : 58 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {successMessage ? <AuthSuccessNotice message={successMessage} /> : null}
        <GoogleMark small />
        <Text style={styles.title}>Verifikasi OTP</Text>
        <Text style={styles.copy}>
          Kami akan mengirim kode sekali pakai{'\n'}ke nomor HP-mu
        </Text>

        <View style={styles.inputWrap}>
          <TextInput
            accessibilityLabel="Masukkan nomor WhatsApp"
            keyboardType="phone-pad"
            maxLength={18}
            onChangeText={onChangePhone}
            onSubmitEditing={onGetOtp}
            placeholder="Masukkan Nomor HP"
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

        <View style={styles.buttonContainer}>
          <Button
            accessibilityLabel="Kirim OTP"
            className="self-stretch"
            disabled={isDisabled}
            leftIcon={isLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
            onPress={onGetOtp}>
            {isLoading ? 'Mengirim...' : 'Kirim OTP'}
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
