import { CalendarDay } from '@/src/features/calendar/types';

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function monthTitle(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
}

export function yearTitle(date: Date) {
  return String(date.getFullYear());
}

export function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function buildCalendarDays(monthDate: Date): CalendarDay[] {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);

    return {
      date: next,
      dateKey: dateKey(next),
      dayNumber: next.getDate(),
      inCurrentMonth: next.getMonth() === monthDate.getMonth(),
    };
  });
}

export function formatShortMonth(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .toUpperCase();
}

export function formatDateRangeLabel(value: string, endValue?: string) {
  const startDay = new Date(`${value}T00:00:00`).getDate();

  if (!endValue || endValue === value) {
    return String(startDay);
  }

  const endDay = new Date(`${endValue}T00:00:00`).getDate();
  return `${startDay} - ${endDay}`;
}
