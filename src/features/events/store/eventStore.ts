import { useSyncExternalStore } from 'react';

import { eventApi, EventResource } from '@/src/services/api/event.api';
import { reminderApi, ReminderPayload } from '@/src/services/api/reminder.api';

let events: EventResource[] = [];
let isLoading = false;
let error: string | null = null;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useEvents() {
  const items = useSyncExternalStore(subscribe, () => events, () => events);
  const loading = useSyncExternalStore(subscribe, () => isLoading, () => isLoading);
  const currentError = useSyncExternalStore(subscribe, () => error, () => error);
  return { events: items, isLoading: loading, error: currentError };
}

export async function fetchEvents(from: string, to: string) {
  isLoading = true; error = null; emit();
  try { events = (await eventApi.list(from, to)).data.items; }
  catch (cause) { console.warn('Failed to fetch events', cause); error = 'Event gagal dimuat.'; }
  finally { isLoading = false; emit(); }
}

export async function createEvent(payload: Omit<EventResource, 'id' | 'reminders'>, reminder?: Omit<ReminderPayload, 'task_id'>) {
  const event = (await eventApi.create(payload)).data.event;
  if (reminder) await reminderApi.create({ ...reminder, calendar_event_id: event.id });
  events = [event, ...events]; emit(); return event;
}

export async function updateEvent(eventId: string, payload: Partial<Omit<EventResource, 'id' | 'reminders'>>) {
  const event = (await eventApi.update(eventId, payload)).data.event;
  events = events.map((item) => item.id === eventId ? event : item); emit(); return event;
}

export async function deleteEvent(eventId: string) {
  await eventApi.remove(eventId);
  events = events.filter((item) => item.id !== eventId); emit();
}
