export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// JS Date.getDay(): 0 = Sunday .. 6 = Saturday
const JS_DAY: Record<WeekDay, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

// expo-notifications WEEKLY trigger weekday: 1 = Sunday .. 7 = Saturday
export const WEEKDAY_BY_DAY: Record<WeekDay, number> = {
  sunday: 1, monday: 2, tuesday: 3, wednesday: 4,
  thursday: 5, friday: 6, saturday: 7,
};

export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function nextWeeklyTrigger(day: WeekDay, time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();
  const daysAhead = (JS_DAY[day] - now.getDay() + 7) % 7;
  const target = new Date(now);
  target.setDate(now.getDate() + daysAhead);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 7);
  return target;
}
