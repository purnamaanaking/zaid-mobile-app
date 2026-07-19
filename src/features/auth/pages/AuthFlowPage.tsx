import React, { useState, useEffect, useRef } from 'react';
import { useWindowDimensions, TextInput, Alert } from 'react-native';
import { useAuthStore } from '@/src/store/auth.store';
import { authApi } from '@/src/services/api/auth.api';
import { DashboardPage } from '@/src/features/dashboard/pages/DashboardPage';
import { AuthPage } from '@/src/features/auth/pages/AuthPage';
import { PhoneOtpPage } from '@/src/features/auth/pages/PhoneOtpPage';
import { OtpVerificationPage } from '@/src/features/auth/pages/OtpVerificationPage';
import { AuthShell, AuthLayoutMetrics } from '@/src/features/auth/components/AuthShared';
import { AuthStep } from '@/src/features/auth/types';
import { initGoogleAuth, signInWithGoogle } from '@/src/services/auth/googleAuth';
import { setAuthToken } from '@/src/services/storage/token';

export default function AuthFlowPage() {
  const { isAuthenticated, login, isInitialized } = useAuthStore();
  const [step, setStep] = useState<AuthStep>('google');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isOtpRequesting, setOtpRequesting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const { height, width } = useWindowDimensions();
  const isCompactHeight = height < 680;
  const isNarrow = width < 360;
  const quoteHeight = isCompactHeight ? 230 : 290;
  const quoteFontSize = isNarrow ? 24 : 28;
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

  if (isAuthenticated) {
    return <DashboardPage />;
  }

  const completeGoogleLogin = async (idToken: string | null) => {
    if (!idToken || idToken === 'mock-google-id-token') {
      Alert.alert('Error', 'Google sign-in did not return a valid token. Please choose a Google account first.');
      return;
    }

    try {
      const res = await authApi.loginWithGoogle(idToken, {
        device_name: 'zaid-mobile-app',
        platform: 'expo',
      });

      if (!res.success || !res.data) {
        Alert.alert('Error', 'Google authentication failed. Please try again.');
        return;
      }

      const { access_token, onboarding, user: backendUser } = res.data;

      // Persist the token so onboarding, calendar, prompts, and tasks use Sanctum auth.
      await setAuthToken(access_token);
      setAccessToken(access_token);

      if (onboarding.next_step === 'dashboard') {
        await login(access_token, {
          id: backendUser.id,
          email: backendUser.email,
          full_name: backendUser.full_name,
          avatar_url: backendUser.avatar_url,
          phone_verified: onboarding.phone_verified,
          status: backendUser.status,
        });
        setStep('google');
      } else if (onboarding.next_step === 'phone_input') {
        setStep('phone');
      } else if (onboarding.next_step === 'verify_otp') {
        setStep('otp');
      } else {
        setStep('phone');
      }
    } catch (err: any) {
      console.warn('Google backend authentication failed', err);
      Alert.alert('Google Sign-in Failed', err.response?.data?.message || err.message || 'Please choose a Google account and try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const idToken = await signInWithGoogle();
      await completeGoogleLogin(idToken);
    } catch (err: any) {
      console.warn('Google Sign-in failed', err);
      Alert.alert('Google Sign-in Failed', err.response?.data?.message || err.message || 'Please choose a Google account and try again.');
    }
  };

  const handleGetOtp = async () => {
    if (isOtpRequesting) return;

    const cleanedPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanedPhone.replace(/\D/g, '').length < 8) {
      Alert.alert('Error', 'Please enter a valid WhatsApp phone number.');
      return;
    }

    setPhoneError('');
    setOtpRequesting(true);
    try {
      console.log('[Onboarding] Requesting OTP for phone', cleanedPhone);
      const res = await authApi.submitPhone(cleanedPhone, 'ID');
      console.log('[Onboarding] OTP response', res);
      if (res.success && res.data?.verification_id) {
        setPhone(cleanedPhone);
        setVerificationId(res.data.verification_id);
        setOtp(['', '', '', '', '', '']);
        setStep('otp');
        Alert.alert('OTP Sent', `We sent the code via ${res.data.otp_channel || 'WhatsApp/email'}.`);
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.warn('API phone submission failed', err.response?.data || err.message || err);
      const validationMessage = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('\n')
        : null;
      const message = validationMessage || err.response?.data?.message || 'Failed to send OTP. Please try again.';
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
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }
    try {
      if (!verificationId) {
        Alert.alert('Error', 'Please request an OTP first.');
        return;
      }
      const res = await authApi.verifyPhoneOtp(verificationId, otpCode);
      if (res.success && res.data && accessToken) {
        const profile = await authApi.getProfile();
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
        Alert.alert('Error', 'OTP verification failed. Please try again.');
      }
    } catch (err: any) {
      console.warn('API OTP verification failed', err);
      Alert.alert('Error', err.response?.data?.message || 'OTP is invalid or expired. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await authApi.resendPhoneOtp(phone);
      if (res.success && res.data?.verification_id) {
        setVerificationId(res.data.verification_id);
        Alert.alert('Success', 'Verification code has been resent to your mobile number.');
      } else {
        Alert.alert('Error', 'Could not resend OTP. Please try again.');
      }
    } catch (err: any) {
      console.warn('API OTP resend failed', err);
      Alert.alert('Error', err.response?.data?.message || 'Could not resend OTP. Please try again.');
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
          isCompactHeight={isCompactHeight}
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
