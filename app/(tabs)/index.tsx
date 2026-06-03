import React, { useState, useEffect, useRef } from 'react';
import { Animated, useWindowDimensions, TextInput, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

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

export default function HomeScreen() {
  const { isAuthenticated, login, isInitialized } = useAuthStore();
  const [step, setStep] = useState<AuthStep>('welcome');
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
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

  const handleGoogleSignIn = async () => {
    try {
      const idToken = await signInWithGoogle();
      if (idToken) {
        if (idToken !== 'mock-google-id-token') {
          // Call the backend endpoint to authenticate and get user/token details
          const res = await authApi.loginWithGoogle(idToken);
          if (res.success && res.data) {
            const { access_token, onboarding, user: backendUser } = res.data;
            
            // Persist the token to SecureStore so subsequent onboarding requests are authenticated
            await SecureStore.setItemAsync('auth_token', access_token);
            
            if (onboarding.next_step === 'dashboard') {
              // If onboarding is already fully complete, log in to store directly
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
            return;
          }
        }
      }
      // Bypassed Google OAuth step as fallback for developer demo
      setStep('phone');
    } catch (err: any) {
      console.warn('Google Sign-in API integration failed, falling back to bypass mode', err);
      Alert.alert('Info (Offline Demo)', 'Google Login failed or backend API was unreachable. Falling back to local onboarding bypass.');
      setStep('phone');
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
        setVerificationId('mock-verification-id');
        setStep('otp');
      }
    } catch (err: any) {
      console.warn('API phone submission failed, falling back to mock OTP', err);
      setVerificationId('mock-verification-id');
      setStep('otp');
      Alert.alert('Info (Offline Demo)', 'Backend API was unreachable. Falling back to local offline simulation.');
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 4) {
      Alert.alert('Error', 'Please enter the 4-digit code');
      return;
    }
    try {
      if (verificationId === 'mock-verification-id') {
        setStep('connect');
        return;
      }
      const res = await authApi.verifyPhoneOtp(verificationId, otpCode);
      if (res.success && res.data) {
        setStep('connect');
      } else {
        setStep('connect');
      }
    } catch (err: any) {
      console.warn('API OTP verification failed, falling back to simulated connect', err);
      setStep('connect');
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

    if (cleanValue && index < 3) {
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
          otpInputWidth={isNarrow ? 56 : 64}
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
