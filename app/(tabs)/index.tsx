import React, { useState, useEffect, useRef } from 'react';
import { Animated, useWindowDimensions, TextInput } from 'react-native';

import { useAuthStore } from '@/src/store/auth.store';
import { DashboardPage } from '@/src/features/dashboard/pages/DashboardPage';
import { WelcomePage } from '@/src/features/auth/pages/WelcomePage';
import { AuthPage } from '@/src/features/auth/pages/AuthPage';
import { PhoneOtpPage } from '@/src/features/auth/pages/PhoneOtpPage';
import { OtpVerificationPage } from '@/src/features/auth/pages/OtpVerificationPage';
import { GoogleConnectPage } from '@/src/features/auth/pages/GoogleConnectPage';
import { AuthDonePage } from '@/src/features/auth/pages/AuthDonePage';
import { AuthShell, AuthLayoutMetrics } from '@/src/features/auth/components/AuthShared';
import { AuthStep } from '@/src/features/auth/types';

export default function HomeScreen() {
  const { isAuthenticated, login } = useAuthStore();
  const [step, setStep] = useState<AuthStep>('welcome');
  const [phone, setPhone] = useState('');
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

  // Run fade-in animation for WelcomePage
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
            setStep('google');
          });
        }, 1600);
      });
    }
  }, [step, fadeAnim]);

  if (isAuthenticated) {
    return <DashboardPage />;
  }

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
          onGoogleSignIn={() => setStep('phone')}
        />
      )}
      {step === 'phone' && (
        <PhoneOtpPage
          isCompactHeight={isCompactHeight}
          onChangePhone={setPhone}
          onGetOtp={() => setStep('otp')}
          phone={phone}
        />
      )}
      {step === 'otp' && (
        <OtpVerificationPage
          isCompactHeight={isCompactHeight}
          maskedPhone={maskedPhone}
          onOtpChange={handleOtpChange}
          onOtpKeyPress={handleOtpKeyPress}
          onVerify={() => setStep('connect')}
          otp={otp}
          otpInputRefs={otpInputRefs}
          otpInputWidth={isNarrow ? 56 : 64}
        />
      )}
      {step === 'connect' && (
        <GoogleConnectPage
          isCompactHeight={isCompactHeight}
          onAllowAccess={() => setStep('done')}
        />
      )}
      {step === 'done' && (
        <AuthDonePage
          onContinue={() => {
            login();
            setStep('welcome'); // reset state for next time logout is pressed
          }}
        />
      )}
    </AuthShell>
  );
}
