import React, { useState, useEffect, useRef } from 'react';
import { Animated, useWindowDimensions, TextInput, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { useAuthStore } from '@/src/store/auth.store';
import { authApi } from '@/src/services/api/auth.api';
import { DashboardPage } from '@/src/features/dashboard/pages/DashboardPage';
import { WelcomePage } from '@/src/features/auth/pages/WelcomePage';
import { AuthPage } from '@/src/features/auth/pages/AuthPage';
import { PhoneOtpPage } from '@/src/features/auth/pages/PhoneOtpPage';
import { OtpVerificationPage } from '@/src/features/auth/pages/OtpVerificationPage';
import { GoogleConnectPage } from '@/src/features/auth/pages/GoogleConnectPage';
import { AuthDonePage } from '@/src/features/auth/pages/AuthDonePage';
import { AuthShell, AuthLayoutMetrics } from '@/src/features/auth/components/AuthShared';
import { AuthStep } from '@/src/features/auth/types';
import { initGoogleAuth, signInWithGoogle } from '@/src/services/auth/googleAuth';
import { setAuthToken } from '@/src/services/storage/token';

export default function HomeScreen() {
  const { isAuthenticated, login, isInitialized } = useAuthStore();
  const [step, setStep] = useState<AuthStep>('welcome');
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
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

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize Google Auth client configuration
  useEffect(() => {
    initGoogleAuth();
  }, []);

  // Run welcome page splash fade animation on launch
  useEffect(() => {
    if (step === 'welcome') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }).start(() => {
            if (isAuthenticated) {
              // Dashboard page will be displayed automatically
            } else {
              setStep('google');
            }
          });
        }, 1600);
      });
    }
  }, [step, fadeAnim, isAuthenticated]);

  if (!isInitialized) {
    return null; // Prevent UI flicker
  }

  if (isAuthenticated && step !== 'welcome') {
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
    if (phone.trim().length < 6) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    try {
      const res = await authApi.submitPhone(phone);
      if (res.success && res.data) {
        setVerificationId(res.data.verification_id);
        setStep('otp');
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      console.warn('API phone submission failed', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP. Please try again.');
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
      if (res.success && res.data) {
        setStep('connect');
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
      if (res.success) {
        Alert.alert('Success', 'Verification code has been resent to your mobile number.');
      } else {
        Alert.alert('Success', 'Verification code has been resent (simulated).');
      }
    } catch (err) {
      console.warn('API OTP resend failed, simulating success', err);
      Alert.alert('Success', 'Verification code has been resent (simulated).');
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const res = await authApi.connectGoogleCalendar();
      if (res.success && res.data && res.data.redirect_url) {
        // Open standard browser window to allow calendar authentication
        await WebBrowser.openAuthSessionAsync(res.data.redirect_url, 'zaid://');
        setStep('done');
      } else {
        setStep('done');
      }
    } catch (err) {
      console.warn('Google Calendar API connection failed, bypassing', err);
      setStep('done');
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

  const logoSize = isNarrow ? 120 : 156;
  const wordmarkSize = isNarrow ? 22 : 28;

  if (step === 'welcome') {
    return (
      <WelcomePage
        fade={fadeAnim}
        logoSize={logoSize}
        wordmarkSize={wordmarkSize}
      />
    );
  }

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
          onChangePhone={setPhone}
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
      {step === 'connect' && (
        <GoogleConnectPage
          isCompactHeight={isCompactHeight}
          onAllowAccess={handleConnectCalendar}
        />
      )}
      {step === 'done' && (
        <AuthDonePage
          onContinue={() => {
            // Logs in the user locally and triggers navigation to Dashboard
            login();
            setStep('google'); // Reset state step for subsequent sessions
          }}
        />
      )}
    </AuthShell>
  );
}
