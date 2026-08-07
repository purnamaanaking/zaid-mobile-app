import { useSyncExternalStore } from 'react';
import { PromptSchedule } from '@/src/types/schedule.types';
import { Config } from '@/src/constants/config';
import { buildPromptSchedules } from '@/src/features/schedule/data/promptSchedules';
import { scheduleApi } from '@/src/services/api/schedule.api';
import { deleteReminder, fetchReminders, remindersForEvent, saveReminder, updateReminder } from '@/src/features/reminders/store/reminderStore';

let schedules: PromptSchedule[] = [];
let isLoading = false;
let isLoaded = false;
let error: string | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function normalizeApiTime(value?: string | null): string {
  if (!value) return '09:00';
  const [hour = '09', minute = '00'] = value.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function toApiTime(value?: string | null): string | null {
  if (!value) return null;
  const normalized = normalizeApiTime(value);
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

function addOneHour(time: string): string {
  const [h, m] = normalizeApiTime(time).split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function applyReminderState(schedule: PromptSchedule): PromptSchedule {
  const reminder = remindersForEvent(schedule.id).find((item) => item.status === 'pending');

  return {
    ...schedule,
    reminderMinutes: reminder?.minutes_before ?? schedule.reminderMinutes,
    reminderEnabled: Boolean(reminder),
    reminderChannel: reminder?.channel ?? schedule.reminderChannel ?? 'whatsapp',
    reminderId: reminder?.id,
  };
}

export function usePromptSchedules() {
  return useSyncExternalStore(subscribe, () => schedules, () => schedules);
}

export function usePromptSchedulesState() {
  const currentSchedules = useSyncExternalStore(subscribe, () => schedules, () => schedules);
  const loading = useSyncExternalStore(subscribe, () => isLoading, () => isLoading);
  const loaded = useSyncExternalStore(subscribe, () => isLoaded, () => isLoaded);
  const currentError = useSyncExternalStore(subscribe, () => error, () => error);

  return {
    schedules: currentSchedules,
    isLoading: loading,
    isLoaded: loaded,
    error: currentError,
  };
}

export async function fetchPromptSchedules() {
  isLoading = true;
  error = null;
  emit();
  if (Config.useLocalUiData) {
    try {
      if (!isLoaded && schedules.length === 0) {
        schedules = buildPromptSchedules(new Date());
      }
      await fetchReminders();
      schedules = schedules.map(applyReminderState);
    } finally {
      isLoading = false;
      isLoaded = true;
      emit();
    }
    return;
  }

  try {
    const [res] = await Promise.all([scheduleApi.getTasks(), fetchReminders()]);
    if (res.success && res.data && res.data.items) {
      schedules = res.data.items.map((item) => {
        const time = normalizeApiTime(item.scheduled_time);

        return {
          id: item.id,
          userId: 'user-1',
          title: item.title,
          date: item.scheduled_date || new Date().toISOString().slice(0, 10),
          endDate: item.scheduled_date || undefined,
          time,
          endTime: addOneHour(time),
          location: 'Google Calendar & Tasks',
          description: item.description || '',
          reminderMinutes: remindersForEvent(item.id).find((reminder) => reminder.status === 'pending')?.minutes_before ?? 30,
          reminderEnabled: remindersForEvent(item.id).some((reminder) => reminder.status === 'pending'),
          reminderChannel: remindersForEvent(item.id).find((reminder) => reminder.status === 'pending')?.channel ?? 'whatsapp',
          reminderId: remindersForEvent(item.id).find((reminder) => reminder.status === 'pending')?.id,
          status: item.status === 'completed' ? 'done' : 'active',
          recurring: item.recurrence?.type || 'none',
          sourcePrompt: item.description || '',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      });
    }
  } catch (err) {
    console.warn('Failed to fetch tasks from REST API', err);
    schedules = [];
    error = 'Jadwal gagal dimuat. Periksa koneksi lalu coba lagi.';
  } finally {
    isLoading = false;
    isLoaded = true;
    emit();
  }
}

export async function addPromptSchedule(schedule: PromptSchedule) {
  const previous = schedules;
  schedules = [schedule, ...schedules];
  error = null;
  emit();

  if (Config.useLocalUiData) {
    try {
      if (schedule.reminderEnabled) {
        const reminder = await saveReminder({
          calendar_event_id: schedule.id,
          minutes_before: schedule.reminderMinutes,
          channel: schedule.reminderChannel ?? 'whatsapp',
        });
        schedules = schedules.map((item) =>
          item.id === schedule.id
            ? { ...item, reminderEnabled: true, reminderId: reminder.id }
            : item
        );
        emit();
      }
      return;
    } catch (err) {
      schedules = previous;
      error = 'Jadwal lokal gagal disimpan.';
      emit();
      throw err;
    }
  }

  try {
    const payload = {
      title: schedule.title,
      description: schedule.description || '',
      scheduled_date: schedule.date,
      scheduled_time: toApiTime(schedule.time),
      all_day: false,
      recurrence: schedule.recurring && schedule.recurring !== 'none'
        ? { type: schedule.recurring, interval: 1 }
        : null,
    };
    const created = await scheduleApi.createTask(payload);
    if (schedule.reminderEnabled) {
      await saveReminder({
        calendar_event_id: created.data.task.id,
        minutes_before: schedule.reminderMinutes,
        channel: schedule.reminderChannel ?? 'whatsapp',
      });
    }
    await fetchPromptSchedules();
  } catch (err) {
    schedules = previous;
    error = 'Jadwal gagal disimpan.';
    emit();
    throw err;
  }
}

export async function deletePromptSchedule(scheduleId: string) {
  const previous = schedules;
  schedules = schedules.filter((schedule) => schedule.id !== scheduleId);
  error = null;
  emit();

  if (Config.useLocalUiData) {
    try {
      const taskReminders = remindersForEvent(scheduleId);
      for (const reminder of taskReminders) await deleteReminder(reminder.id);
      return;
    } catch (err) {
      schedules = previous;
      error = 'Jadwal lokal gagal dihapus.';
      emit();
      throw err;
    }
  }

  try {
    const taskReminders = remindersForEvent(scheduleId);
    for (const reminder of taskReminders) await deleteReminder(reminder.id);
    await scheduleApi.deleteTask(scheduleId);
  } catch (err) {
    schedules = previous;
    error = 'Jadwal gagal dihapus.';
    emit();
    throw err;
  }
}

export async function updatePromptSchedule(scheduleId: string, patch: Partial<PromptSchedule>) {
  const previous = schedules;
  schedules = schedules.map((schedule) =>
    schedule.id === scheduleId
      ? { ...schedule, ...patch, updatedAt: new Date().toISOString() }
      : schedule
  );
  emit();

  if (Config.useLocalUiData) {
    try {
      const existingReminder = remindersForEvent(scheduleId).find((item) => item.status === 'pending');
      const nextSchedule = schedules.find((item) => item.id === scheduleId);
      if (nextSchedule?.reminderEnabled) {
        const reminderPayload = {
          minutes_before: nextSchedule.reminderMinutes,
          channel: nextSchedule.reminderChannel ?? 'whatsapp' as const,
        };
        const reminder = existingReminder
          ? await updateReminder(existingReminder.id, reminderPayload)
          : await saveReminder({ calendar_event_id: scheduleId, ...reminderPayload });
        schedules = schedules.map((item) =>
          item.id === scheduleId
            ? { ...item, reminderEnabled: true, reminderId: reminder.id }
            : item
        );
      } else if (existingReminder) {
        await deleteReminder(existingReminder.id);
        schedules = schedules.map((item) =>
          item.id === scheduleId
            ? { ...item, reminderEnabled: false, reminderId: undefined }
            : item
        );
      }
      emit();
      return;
    } catch (err) {
      schedules = previous;
      error = 'Jadwal lokal gagal diperbarui.';
      emit();
      throw err;
    }
  }

  try {
    const payload = {
      title: patch.title,
      description: patch.description,
      scheduled_date: patch.date,
      scheduled_time: toApiTime(patch.time),
    };
    await scheduleApi.updateTask(scheduleId, payload);
    const existingReminder = remindersForEvent(scheduleId).find((item) => item.status === 'pending');
    const nextSchedule = schedules.find((item) => item.id === scheduleId);
    if (nextSchedule?.reminderEnabled) {
      const reminderPayload = {
        minutes_before: nextSchedule.reminderMinutes,
        channel: nextSchedule.reminderChannel ?? 'whatsapp' as const,
      };
      if (existingReminder) await updateReminder(existingReminder.id, reminderPayload);
      else await saveReminder({ calendar_event_id: scheduleId, ...reminderPayload });
    } else if (existingReminder) {
      await deleteReminder(existingReminder.id);
    }
  } catch (err) {
    schedules = previous;
    error = 'Jadwal gagal diperbarui.';
    emit();
    throw err;
  }
}
