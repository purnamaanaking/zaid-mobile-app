import { apiClient } from './client';

export type TaskRecurrence = {
  type: 'daily' | 'weekly' | 'monthly';
  interval?: number | null;
  day_of_week?: string | null;
  day_of_month?: number | null;
};

export type TaskResource = {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  scheduled_date: string | null;
  scheduled_time: string | null;
  timezone: string;
  all_day: boolean;
  is_recurring: boolean;
  source_channel: string;
  google_task_list_id: string | null;
  google_task_list_title: string | null;
  recurrence: TaskRecurrence | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type EventResource = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  all_day: boolean;
  recurrence?: TaskRecurrence | null;
  status?: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
};

type EventResponse = { success: boolean; data: { event: EventResource } };
type EventListResponse = { success: boolean; data: { items: EventResource[] } };

export type FetchTasksResponse = { success: boolean; data: { items: TaskResource[]; meta: { total: number } } };
export type TaskResponse = { success: boolean; message: string; data: { task: TaskResource } };
export type MonthCalendarDay = { date: string; task_count: number; has_pending: boolean };
export type MonthCalendarResponse = { success: boolean; data: { month: string; days: MonthCalendarDay[] } };
export type DayAgendaResponse = { success: boolean; data: { date: string; items: TaskResource[] } };
export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  timezone?: string | null;
  all_day?: boolean | null;
  recurrence?: TaskRecurrence | null;
};
export type UpdateTaskPayload = Partial<CreateTaskPayload>;

function taskFromEvent(event: EventResource): TaskResource {
  const startsAt = event.starts_at ?? '';
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    status: event.status === 'completed' ? 'completed' : event.status === 'cancelled' ? 'cancelled' : 'active',
    scheduled_date: startsAt.slice(0, 10) || null,
    scheduled_time: startsAt.slice(11, 19) || null,
    timezone: event.timezone,
    all_day: event.all_day,
    is_recurring: Boolean(event.recurrence),
    source_channel: 'app',
    google_task_list_id: null,
    google_task_list_title: null,
    recurrence: event.recurrence ?? null,
    completed_at: null,
    created_at: event.created_at ?? '',
    updated_at: event.updated_at ?? '',
  };
}

function eventPayload(payload: CreateTaskPayload | UpdateTaskPayload) {
  const date = payload.scheduled_date;
  const time = payload.scheduled_time ?? '09:00:00';
  return {
    title: payload.title,
    description: payload.description,
    timezone: payload.timezone ?? 'Asia/Jakarta',
    all_day: payload.all_day ?? false,
    recurrence: payload.recurrence,
    ...(date ? { starts_at: `${date}T${time}` } : {}),
  };
}

export const scheduleApi = {
  getTasks: async (params?: { from?: string; to?: string }) => {
    const { data } = await apiClient.get<EventListResponse>('/v1/events', {
      params: { from: params?.from ?? '2000-01-01', to: params?.to ?? '2100-12-31' },
    });
    return { success: data.success, data: { items: data.data.items.map(taskFromEvent), meta: { total: data.data.items.length } } } satisfies FetchTasksResponse;
  },
  createTask: async (payload: CreateTaskPayload) => {
    const { data } = await apiClient.post<EventResponse>('/v1/events', eventPayload(payload));
    return { success: data.success, message: '', data: { task: taskFromEvent(data.data.event) } } satisfies TaskResponse;
  },
  updateTask: async (taskId: string, payload: UpdateTaskPayload) => {
    const { data } = await apiClient.patch<EventResponse>(`/v1/events/${taskId}`, eventPayload(payload));
    return { success: data.success, message: '', data: { task: taskFromEvent(data.data.event) } } satisfies TaskResponse;
  },
  deleteTask: async (taskId: string) => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/v1/events/${taskId}`);
    return { success: data.success, message: '', data: { task_id: taskId } };
  },
  getMonthCalendar: async (month: string) => (await apiClient.get<MonthCalendarResponse>('/v1/calendar/month', { params: { month } })).data,
  getDayAgenda: async (date: string) => (await apiClient.get<DayAgendaResponse>('/v1/agenda/day', { params: { date } })).data,
};
