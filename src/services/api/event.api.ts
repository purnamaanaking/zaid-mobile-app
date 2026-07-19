import { apiClient } from './client';
import { ReminderResource } from './reminder.api';

export type EventResource = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  all_day: boolean;
  reminders?: ReminderResource[];
};

type EventResponse = { success: boolean; data: { event: EventResource } };
type EventListResponse = { success: boolean; data: { items: EventResource[] } };

export const eventApi = {
  list: async (from: string, to: string) => {
    const { data } = await apiClient.get<EventListResponse>('/v1/events', { params: { from, to } });
    return data;
  },
  create: async (payload: Omit<EventResource, 'id' | 'reminders'>) => {
    const { data } = await apiClient.post<EventResponse>('/v1/events', payload);
    return data;
  },
  update: async (eventId: string, payload: Partial<Omit<EventResource, 'id' | 'reminders'>>) => {
    const { data } = await apiClient.patch<EventResponse>(`/v1/events/${eventId}`, payload);
    return data;
  },
  remove: async (eventId: string) => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/v1/events/${eventId}`);
    return data;
  },
};
