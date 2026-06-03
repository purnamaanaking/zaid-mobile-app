export type CalendarFilter = 'recent' | 'today' | 'upcoming';

export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
};
