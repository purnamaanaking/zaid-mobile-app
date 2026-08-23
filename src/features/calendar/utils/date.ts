import { CalendarDay } from '@/src/features/calendar/types';
import { dateKey } from '@/src/utils/date';

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export { dateKey };

export function monthTitle(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date);
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
  return new Intl.DateTimeFormat('id-ID', { month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .toUpperCase();
}

export function formatFullDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function formatSelectedDateLabel(value: string, endValue?: string | null) {
  const start = new Date(`${value}T00:00:00`);

  if (!endValue || endValue === value) {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(start);
  }

  const end = new Date(`${endValue}T00:00:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(start);
    return `${start.getDate()} - ${end.getDate()} ${monthYear}`;
  }

  return `${new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(start)} - ${new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(end)}`;
}

export function formatDateRangeLabel(value: string, endValue?: string) {
  const startDay = new Date(`${value}T00:00:00`).getDate();

  if (!endValue || endValue === value) {
    return String(startDay);
  }

  const endDay = new Date(`${endValue}T00:00:00`).getDate();
  return `${startDay} - ${endDay}`;
}
