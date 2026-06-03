export type ScheduleStatus = 'active' | 'done';

export type Schedule = {
  id: string;
  userId: string;
  title: string;
  date: string;
  endDate?: string;
  time: string;
  location?: string;
  description?: string;
  reminderMinutes: number;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
};

export type PromptSchedule = Schedule & {
  endTime: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  sourcePrompt: string;
};
