import type { PromptSchedule } from '@/src/types/schedule.types';

function parseDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
}

function parseClockTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

export function validateScheduleFields(
  schedule: Pick<PromptSchedule, 'date' | 'endDate' | 'time' | 'endTime'>,
) {
  const problems: string[] = [];
  const startDate = parseDateKey(schedule.date);
  const endDate = schedule.endDate ? parseDateKey(schedule.endDate) : null;
  const startTime = parseClockTime(schedule.time);
  const endTime = schedule.endTime ? parseClockTime(schedule.endTime) : null;

  if (!startDate) problems.push('Start Date harus tanggal valid dengan format YYYY-MM-DD.');
  if (startTime == null) problems.push('Start Time harus format HH:mm.');

  if (schedule.endDate) {
    if (!endDate) {
      problems.push('End Date harus tanggal valid dengan format YYYY-MM-DD.');
    } else if (startDate && schedule.endDate < schedule.date) {
      problems.push('End Date tidak boleh sebelum Start Date.');
    }
  }

  if (schedule.endTime && endTime == null) {
    problems.push('End Time harus format HH:mm.');
  }

  if (
    startDate &&
    startTime != null &&
    endTime != null &&
    (!schedule.endDate || schedule.endDate === schedule.date) &&
    endTime <= startTime
  ) {
    problems.push('End Time harus setelah Start Time untuk jadwal di tanggal yang sama.');
  }

  return problems;
}
