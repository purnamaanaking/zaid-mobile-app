import React, { useState, useEffect, useRef } from 'react';
import { useWindowDimensions, TextInput, Alert } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/auth.store';
import { authApi } from '@/src/services/api/auth.api';
import { AuthPage } from '@/src/features/auth/pages/AuthPage';
import { PhoneOtpPage } from '@/src/features/auth/pages/PhoneOtpPage';
import { OtpVerificationPage } from '@/src/features/auth/pages/OtpVerificationPage';
import { AuthShell, AuthLayoutMetrics } from '@/src/features/auth/components/AuthShared';
import { AuthSuccessSplash } from '@/src/features/auth/components/AuthSuccessSplash';
import { AuthStep } from '@/src/features/auth/types';
import { initGoogleAuth, signInWithGoogle } from '@/src/services/auth/googleAuth';
import { setAuthToken } from '@/src/services/storage/token';

const ENABLE_DEV_SIGN_IN = process.env.EXPO_PUBLIC_ENABLE_DEV_SIGN_IN === 'true';

export default function AuthFlowPage() {
  const { isAuthenticated, login, loginAsDeveloper, isInitialized } = useAuthStore();
  const [step, setStep] = useState<AuthStep>('google');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isOtpRequesting, setOtpRequesting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showSuccessSplash, setShowSuccessSplash] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const { height, width } = useWindowDimensions();
  const isCompactHeight = height < 680;
  const isNarrow = width < 360;
  const quoteHeight = Math.max(isCompactHeight ? 306 : 380, Math.round(height * 0.47));
  const quoteFontSize = isNarrow ? 34 : 40;
  const horizontalPadding = isNarrow ? 20 : 26;

  const metrics: AuthLayoutMetrics = {
    horizontalPadding,
    isCompactHeight,
    isNarrow,
    quoteFontSize,
    quoteHeight,
  };

  // Initialize Google Auth client configuration
  useEffect(() => {
    initGoogleAuth();
  }, []);

  if (!isInitialized) {
    return null; // Prevent UI flicker
  }

  if (showSuccessSplash) {
    return (
      <AuthSuccessSplash
        onComplete={() => setShowSuccessSplash(false)}
        duration={2200}
      />
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/ai" />;
  }

  const completeGoogleLogin = async (idToken: string | null) => {
    if (!idToken || idToken === 'mock-google-id-token') {
      Alert.alert('Kesalahan', 'Masuk Google tidak mengembalikan token yang valid. Pilih akun Google terlebih dahulu.');
      return;
    }

    try {
      const res = await authApi.loginWithGoogle(idToken, {
        device_name: 'zaid-mobile-app',
        platform: 'expo',
      });

      if (!res.success || !res.data) {
        Alert.alert('Kesalahan', 'Autentikasi Google gagal. Coba lagi.');
        return;
      }

      const { access_token, onboarding, user: backendUser } = res.data;

      // Persist the token so onboarding, calendar, prompts, and tasks use Sanctum auth.
      await setAuthToken(access_token);
      setAccessToken(access_token);

      if (onboarding.next_step === 'dashboard') {
        setShowSuccessSplash(true);
        await login(access_token, {
          id: backendUser.id,
          email: backendUser.email,
          full_name: backendUser.full_name,
          avatar_url: backendUser.avatar_url,
          phone_verified: onboarding.phone_verified,
          status: backendUser.status,
        });
      } else if (onboarding.next_step === 'phone_input') {
        setStep('phone');
      } else if (onboarding.next_step === 'verify_otp') {
        setStep('otp');
      } else {
        setStep('phone');
      }
    } catch (err: any) {
      console.warn('Google backend authentication failed', err);
      Alert.alert('Masuk Google Gagal', err.response?.data?.message || err.message || 'Pilih akun Google dan coba lagi.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const idToken = await signInWithGoogle();
      await completeGoogleLogin(idToken);
    } catch (err: any) {
      console.warn('Google Sign-in failed', err);
      Alert.alert('Masuk Google Gagal', err.response?.data?.message || err.message || 'Pilih akun Google dan coba lagi.');
    }
  };

  const handleGetOtp = async () => {
    if (isOtpRequesting) return;

    const cleanedPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanedPhone.replace(/\D/g, '').length < 8) {
      Alert.alert('Kesalahan', 'Masukkan nomor WhatsApp yang valid.');
      return;
    }

    if (developerMode) {
      setPhone(cleanedPhone);
      setVerificationId('dev-verification-id');
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      return;
    }

    setPhoneError('');
    setOtpRequesting(true);
    try {
      const res = await authApi.submitPhone(cleanedPhone, 'ID');
      if (res.success && res.data?.verification_id) {
        setPhone(cleanedPhone);
        setVerificationId(res.data.verification_id);
        setOtp(['', '', '', '', '', '']);
        setStep('otp');
      } else {
        Alert.alert('Kesalahan', 'Gagal mengirim OTP. Coba lagi.');
      }
    } catch (err: any) {
      const validationMessage = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : null;
      const message = validationMessage || err.response?.data?.message || 'Gagal mengirim OTP. Coba lagi.';
      const friendlyMessage = message.toLowerCase().includes('already linked')
        ? 'Nomor WhatsApp ini sudah dipakai di akun lain. Gunakan nomor lain atau login dengan akun Google pemilik nomor tersebut.'
        : message;
      setPhoneError(friendlyMessage);
      Alert.alert('Nomor Tidak Bisa Dipakai', friendlyMessage);
    } finally {
      setOtpRequesting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      Alert.alert('Kesalahan', 'Masukkan kode 6 digit');
      return;
    }
    if (developerMode) {
      setShowSuccessSplash(true);
      await loginAsDeveloper();
      return;
    }
    try {
      if (!verificationId) {
        Alert.alert('Kesalahan', 'Minta OTP terlebih dahulu.');
        return;
      }
      const res = await authApi.verifyPhoneOtp(verificationId, otpCode);
      if (res.success && res.data && accessToken) {
        const profile = await authApi.getProfile();
        setShowSuccessSplash(true);
        await login(accessToken, {
          id: profile.data.id,
          email: profile.data.email,
          full_name: profile.data.full_name,
          avatar_url: profile.data.avatar_url,
          phone_number: profile.data.phone_number ?? undefined,
          phone_verified: true,
          status: profile.data.status,
        });
      } else {
        Alert.alert('Kesalahan', 'Verifikasi OTP gagal. Coba lagi.');
      }
    } catch (err: any) {
      console.warn('API OTP verification failed', err);
      Alert.alert('Kesalahan', err.response?.data?.message || 'OTP tidak valid atau kedaluwarsa. Coba lagi.');
    }
  };

  const handleDeveloperSignIn = () => {
    setDeveloperMode(true);
    setStep('phone');
  };

  const handleResendOtp = async () => {
    if (developerMode) {
      setVerificationId('dev-verification-id');
      Alert.alert('Berhasil', 'Kode verifikasi telah dikirim ulang ke nomor HP-mu.');
      return;
    }
    try {
      const res = await authApi.resendPhoneOtp(phone);
      if (res.success && res.data?.verification_id) {
        setVerificationId(res.data.verification_id);
        Alert.alert('Berhasil', 'Kode verifikasi telah dikirim ulang ke nomor HP-mu.');
      } else {
        Alert.alert('Kesalahan', 'Tidak bisa mengirim ulang OTP. Coba lagi.');
      }
    } catch (err: any) {
      console.warn('API OTP resend failed', err);
      Alert.alert('Kesalahan', err.response?.data?.message || 'Tidak bisa mengirim ulang OTP. Coba lagi.');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    if (cleanValue && index < otp.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const maskedPhone = phone.length > 4
    ? phone.slice(0, 4) + ' •••• •••• ' + phone.slice(-2)
    : phone;

  return (
    <AuthShell metrics={metrics}>
      {step === 'google' && (
        <AuthPage
          enableDeveloperSignIn={ENABLE_DEV_SIGN_IN}
          isCompactHeight={isCompactHeight}
          onDeveloperSignIn={handleDeveloperSignIn}
          onGoogleCredential={completeGoogleLogin}
          onGoogleSignIn={handleGoogleSignIn}
        />
      )}
      {step === 'phone' && (
        <PhoneOtpPage
          isCompactHeight={isCompactHeight}
          errorMessage={phoneError}
          isLoading={isOtpRequesting}
          onChangePhone={(value) => {
            setPhoneError('');
            setPhone(value);
          }}
          onGetOtp={handleGetOtp}
          phone={phone}
        />
      )}
      {step === 'otp' && (
        <OtpVerificationPage
          isCompactHeight={isCompactHeight}
          isLoading={false}
          maskedPhone={maskedPhone}
          onOtpChange={handleOtpChange}
          onOtpKeyPress={handleOtpKeyPress}
          onVerify={handleVerifyOtp}
          otp={otp}
          otpInputRefs={otpInputRefs}
          otpInputWidth={isNarrow ? 38 : 46}
          onResendOtp={handleResendOtp}
        />
      )}
    </AuthShell>
  );
}
