import { useSyncExternalStore } from 'react';

import { reminderApi, ReminderPayload, ReminderResource } from '@/src/services/api/reminder.api';
import { requestReminderPermission, syncAppReminderNotifications } from '@/src/services/notifications/nativeNotifications';

let reminders: ReminderResource[] = [];
let isLoading = false;
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
  const response = await reminderApi.update(reminderId, payload);
  reminders = reminders.map((item) => item.id === reminderId ? response.data.reminder : item);
  await syncAppReminderNotifications(reminders);
  emit();
  return response.data.reminder;
}

export async function deleteReminder(reminderId: string) {
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
