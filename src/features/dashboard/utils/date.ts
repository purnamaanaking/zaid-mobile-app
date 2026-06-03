export const DAY_LABELS = ['SUN', 'MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT'];

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

export function buildWeekDays(referenceDate: Date) {
  const start = new Date(referenceDate);
  start.setDate(referenceDate.getDate() - referenceDate.getDay());

  return Array.from({ length: 5 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

export function buildMonthDays(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    return new Date(year, month, index + 1);
  });
}

export function formatReadableDate(value: string, endValue?: string) {
  const startDate = new Date(`${value}T00:00:00`);
  const startStr = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(startDate);

  if (!endValue || endValue === value) {
    return startStr;
  }

  const endDate = new Date(`${endValue}T00:00:00`);
  const endStr = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
  }).format(endDate);

  return `${startStr} - ${endStr}`;
}
