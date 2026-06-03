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
  status: 'active' | 'completed';
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string | null; // HH:mm:ss
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

export type FetchTasksResponse = {
  success: boolean;
  data: {
    items: TaskResource[];
    meta: {
      total: number;
    };
  };
};

export type TaskResponse = {
  success: boolean;
  message: string;
  data: {
    task: TaskResource;
  };
};

export type MonthCalendarDay = {
  date: string;
  task_count: number;
  has_pending: boolean;
};

export type MonthCalendarResponse = {
  success: boolean;
  data: {
    month: string;
    days: MonthCalendarDay[];
  };
};

export type DayAgendaResponse = {
  success: boolean;
  data: {
    date: string;
    items: TaskResource[];
  };
};

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null; // HH:mm:ss
  timezone?: string | null;
  all_day?: boolean | null;
  recurrence?: TaskRecurrence | null;
  google_task_list_id?: string | null;
  google_task_list_title?: string | null;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export const scheduleApi = {
  getTasks: async (params?: { date?: string; from?: string; to?: string; status?: string }) => {
    const { data } = await apiClient.get<FetchTasksResponse>('/v1/tasks', {
      params,
    });
    return data;
  },

  getTaskById: async (taskId: string) => {
    const { data } = await apiClient.get<TaskResponse>(`/v1/tasks/${taskId}`);
    return data;
  },

  createTask: async (payload: CreateTaskPayload) => {
    const { data } = await apiClient.post<TaskResponse>('/v1/tasks', payload);
    return data;
  },

  updateTask: async (taskId: string, payload: UpdateTaskPayload) => {
    const { data } = await apiClient.put<TaskResponse>(`/v1/tasks/${taskId}`, payload);
    return data;
  },

  deleteTask: async (taskId: string) => {
    const { data } = await apiClient.delete<{ success: boolean; message: string; data: { task_id: string } }>(
      `/v1/tasks/${taskId}`
    );
    return data;
  },

  completeTask: async (taskId: string) => {
    const { data } = await apiClient.post<TaskResponse>(`/v1/tasks/${taskId}/complete`);
    return data;
  },

  restoreTask: async (taskId: string) => {
    const { data } = await apiClient.post<TaskResponse>(`/v1/tasks/${taskId}/restore`);
    return data;
  },

  getMonthCalendar: async (month: string) => {
    const { data } = await apiClient.get<MonthCalendarResponse>('/v1/calendar/month', {
      params: { month },
    });
    return data;
  },

  getDayAgenda: async (date: string) => {
    const { data } = await apiClient.get<DayAgendaResponse>('/v1/agenda/day', {
      params: { date },
    });
    return data;
  },
};
