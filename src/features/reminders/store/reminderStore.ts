import { useSyncExternalStore } from 'react';

import { Config } from '@/src/constants/config';
import { reminderApi, ReminderPayload, ReminderResource } from '@/src/services/api/reminder.api';
import { requestReminderPermission, syncAppReminderNotifications } from '@/src/services/notifications/nativeNotifications';
import { addDays, dateKey } from '@/src/utils/date';

let reminders: ReminderResource[] = [];
let isLoading = false;
let error: string | null = null;
let localSeeded = false;
const listeners = new Set<() => void>();

function localIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function seedLocalReminders() {
  if (localSeeded) return;

  const today = new Date();
  const todayKey = dateKey(today);
  const tomorrowKey = dateKey(addDays(today, 1));
  const createdAt = addDays(today, -1).toISOString();

  reminders = [
    {
      id: 'local-reminder-1',
      task_id: 'schedule-1',
      calendar_event_id: null,
      minutes_before: 30,
      channel: 'app',
      remind_at: localIso(todayKey, '18:30'),
      status: 'pending',
      sent_at: null,
      error_message: null,
      task: {
        id: 'schedule-1',
        title: 'Meeting Client',
        scheduled_date: todayKey,
        scheduled_time: '19:00:00',
      },
      calendar_event: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: 'local-reminder-2',
      task_id: 'schedule-3',
      calendar_event_id: null,
      minutes_before: 60,
      channel: 'whatsapp',
      remind_at: localIso(tomorrowKey, '08:00'),
      status: 'pending',
      sent_at: null,
      error_message: null,
      task: {
        id: 'schedule-3',
        title: 'Submit Proposal',
        scheduled_date: tomorrowKey,
        scheduled_time: '09:00:00',
      },
      calendar_event: null,
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];
  localSeeded = true;
}

function createLocalReminder(payload: ReminderPayload): ReminderResource {
  const now = new Date();
  const id = `local-reminder-${now.getTime()}`;

  return {
    id,
    task_id: payload.task_id ?? null,
    calendar_event_id: payload.calendar_event_id ?? null,
    minutes_before: payload.minutes_before,
    channel: payload.channel,
    remind_at: now.toISOString(),
    status: 'pending',
    sent_at: null,
    error_message: null,
    task: payload.task_id
      ? {
        id: payload.task_id,
        title: 'Local Task',
      }
      : null,
    calendar_event: payload.calendar_event_id
      ? {
        id: payload.calendar_event_id,
        title: 'Local Event',
      }
      : null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useReminders() {
  const items = useSyncExternalStore(subscribe, () => reminders, () => reminders);
  const loading = useSyncExternalStore(subscribe, () => isLoading, () => isLoading);
  const currentError = useSyncExternalStore(subscribe, () => error, () => error);
  return { reminders: items, isLoading: loading, error: currentError };
}

export async function fetchReminders() {
  isLoading = true;
  error = null;
  emit();
  if (Config.useLocalUiData) {
    seedLocalReminders();
    isLoading = false;
    emit();
    return;
  }

  try {
    const response = await reminderApi.list();
    reminders = response.data.items;
  } catch (cause) {
    console.warn('Failed to fetch reminders', cause);
    error = 'Reminder gagal dimuat.';
  } finally {
    isLoading = false;
    emit();
  }
}

export async function saveReminder(payload: ReminderPayload) {
  if (Config.useLocalUiData) {
    seedLocalReminders();
    const reminder = createLocalReminder(payload);
    reminders = [reminder, ...reminders.filter((item) => item.id !== reminder.id)];
    await syncAppReminderNotifications(reminders);
    emit();
    return reminder;
  }

  if (payload.channel !== 'whatsapp') await requestReminderPermission();
  const response = await reminderApi.create(payload);
  const reminder = response.data.reminder;
  reminders = [reminder, ...reminders.filter((item) => item.id !== reminder.id)];
  await syncAppReminderNotifications(reminders);
  emit();
  return reminder;
}

export async function updateReminder(
  reminderId: string,
  payload: Pick<ReminderPayload, 'minutes_before' | 'channel'>,
) {
  if (Config.useLocalUiData) {
    seedLocalReminders();
    const now = new Date().toISOString();
    let updatedReminder: ReminderResource | undefined;
    reminders = reminders.map((item) => {
      if (item.id !== reminderId) return item;
      updatedReminder = { ...item, ...payload, updated_at: now };
      return updatedReminder;
    });
    await syncAppReminderNotifications(reminders);
    emit();
    if (!updatedReminder) throw new Error('Reminder tidak ditemukan.');
    return updatedReminder;
  }

  const response = await reminderApi.update(reminderId, payload);
  reminders = reminders.map((item) => item.id === reminderId ? response.data.reminder : item);
  await syncAppReminderNotifications(reminders);
  emit();
  return response.data.reminder;
}

export async function deleteReminder(reminderId: string) {
  if (Config.useLocalUiData) {
    seedLocalReminders();
    reminders = reminders.filter((item) => item.id !== reminderId);
    await syncAppReminderNotifications(reminders);
    emit();
    return;
  }

  await reminderApi.remove(reminderId);
  reminders = reminders.filter((item) => item.id !== reminderId);
  await syncAppReminderNotifications(reminders);
  emit();
}

export function remindersForTask(taskId: string) {
  return reminders.filter((reminder) => reminder.task_id === taskId);
}

export function reminderForTask(taskId: string) {
  return remindersForTask(taskId).find((reminder) => reminder.status === 'pending');
}

export function remindersForEvent(eventId: string) {
  return reminders.filter((reminder) => reminder.calendar_event_id === eventId);
}
