import { apiClient } from './client';

export type ReminderChannel = 'whatsapp' | 'app' | 'both';
export type ReminderStatus = 'pending' | 'sent' | 'failed';

export type ReminderSource = {
  id: string;
  title: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  starts_at?: string | null;
};

export type ReminderResource = {
  id: string;
  task_id: string | null;
  calendar_event_id: string | null;
  minutes_before: number;
  channel: ReminderChannel;
  remind_at: string;
  status: ReminderStatus;
  sent_at: string | null;
  error_message: string | null;
  task?: ReminderSource | null;
  calendar_event?: ReminderSource | null;
  created_at: string;
  updated_at: string;
};

export type ReminderPayload = {
  task_id?: string;
  calendar_event_id?: string;
  minutes_before: number;
  channel: ReminderChannel;
};

type ReminderListResponse = {
  success: boolean;
  data: { items: ReminderResource[] };
};

type ReminderResponse = {
  success: boolean;
  data: { reminder: ReminderResource };
};

export const reminderApi = {
  list: async () => {
    const { data } = await apiClient.get<ReminderListResponse>('/v1/reminders');
    return data;
  },

  create: async (payload: ReminderPayload) => {
    const { data } = await apiClient.post<ReminderResponse>('/v1/reminders', payload);
    return data;
  },

  update: async (reminderId: string, payload: Pick<ReminderPayload, 'minutes_before' | 'channel'>) => {
    const { data } = await apiClient.patch<ReminderResponse>(`/v1/reminders/${reminderId}`, payload);
    return data;
  },

  remove: async (reminderId: string) => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/v1/reminders/${reminderId}`);
    return data;
  },
};
