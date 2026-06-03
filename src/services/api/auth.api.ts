import { apiClient } from './client';

export type UserDevice = {
  platform?: string | null;
  device_id?: string | null;
  device_name?: string | null;
};

export type GoogleLoginResponse = {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: {
      id: string;
      email: string;
      full_name: string;
      avatar_url: string;
      status: string;
      phone_verified: string; // or boolean as string in API schema
    };
    onboarding: {
      required: boolean;
      next_step: 'dashboard' | 'verify_otp' | 'phone_input';
      phone_verified: boolean;
    };
  };
};

export type PhoneResponse = {
  success: boolean;
  message: string;
  data: {
    phone_number: string;
    verification_id: string;
    expires_in_seconds: number;
    next_step: string;
    otp_channel: string;
  };
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      status: string;
      phone_verified: boolean;
      phone_number: string;
    };
    onboarding: {
      completed: boolean;
      next_step: string;
    };
  };
};

export type ProfileResponse = {
  success: boolean;
  data: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    phone_number: string;
    phone_verified: boolean;
    status: string;
  };
};

export type ConnectCalendarResponse = {
  success: boolean;
  message: string;
  data: {
    provider: string;
    redirect_url: string;
  };
};

export type CalendarStatusResponse = {
  success: boolean;
  message: string;
  data: {
    connected: boolean;
    connection: {
      id: string;
      provider: string;
      google_calendar_id: string;
      google_calendar_summary: string;
      status: string;
      last_synced_at: string;
    } | null;
  };
};

export const authApi = {
  loginWithGoogle: async (idToken: string, device?: UserDevice) => {
    const { data } = await apiClient.post<GoogleLoginResponse>('/v1/auth/google', {
      id_token: idToken,
      device,
    });
    return data;
  },

  logout: async () => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/v1/auth/logout');
    return data;
  },

  getProfile: async () => {
    const { data } = await apiClient.get<ProfileResponse>('/v1/me');
    return data;
  },

  submitPhone: async (phoneNumber: string, countryCode?: string) => {
    const { data } = await apiClient.post<PhoneResponse>('/v1/onboarding/phone', {
      phone_number: phoneNumber,
      country_code: countryCode,
    });
    return data;
  },

  verifyPhoneOtp: async (verificationId: string, otpCode: string) => {
    const { data } = await apiClient.post<VerifyOtpResponse>('/v1/onboarding/phone/verify', {
      verification_id: verificationId,
      otp_code: otpCode,
    });
    return data;
  },

  resendPhoneOtp: async (phoneNumber: string) => {
    const { data } = await apiClient.post<PhoneResponse>('/v1/onboarding/phone/resend-otp', {
      phone_number: phoneNumber,
    });
    return data;
  },

  connectGoogleCalendar: async () => {
    const { data } = await apiClient.get<ConnectCalendarResponse>('/v1/integrations/google-calendar/connect');
    return data;
  },

  getGoogleCalendarStatus: async () => {
    const { data } = await apiClient.get<CalendarStatusResponse>('/v1/integrations/google-calendar/status');
    return data;
  },

  disconnectGoogleCalendar: async () => {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>('/v1/integrations/google-calendar');
    return data;
  },
};
