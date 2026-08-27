import { useSyncExternalStore } from 'react';

import { Config } from '@/src/constants/config';
import { eventApi, EventResource } from '@/src/services/api/event.api';
import { reminderApi, ReminderPayload } from '@/src/services/api/reminder.api';
import { saveReminder } from '@/src/features/reminders/store/reminderStore';
import { addDays, dateKey } from '@/src/utils/date';

let events: EventResource[] = [];
let localEvents: EventResource[] = [];
let isLoading = false;
let error: string | null = null;
let localSeeded = false;
const listeners = new Set<() => void>();

function localDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function seedLocalEvents() {
  if (localSeeded) return;

  const today = new Date();
  const todayKey = dateKey(today);
  const tomorrowKey = dateKey(addDays(today, 1));

  localEvents = [
    {
      id: 'local-event-1',
      title: 'Demo Calendar Sync',
      description: 'Contoh event lokal untuk testing tampilan kalender.',
      starts_at: localDateTime(todayKey, '10:00'),
      ends_at: localDateTime(todayKey, '11:00'),
      timezone: 'Asia/Jakarta',
      all_day: false,
      reminders: [],
    },
    {
      id: 'local-event-2',
      title: 'Design Review',
      description: 'Validasi flow reminder dan schedule card.',
      starts_at: localDateTime(tomorrowKey, '14:00'),
      ends_at: localDateTime(tomorrowKey, '15:00'),
      timezone: 'Asia/Jakarta',
      all_day: false,
      reminders: [],
    },
  ];
  events = localEvents;
  localSeeded = true;
}

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
  if (Config.useLocalUiData) {
    seedLocalEvents();
    events = localEvents.filter((event) => {
      const eventDate = event.starts_at ? dateKey(new Date(event.starts_at)) : null;
      if (!eventDate) return true;
      return eventDate >= from && eventDate <= to;
    });
    isLoading = false;
    emit();
    return;
  }

  try { events = (await eventApi.list(from, to)).data.items; }
  catch (cause) { console.warn('Failed to fetch events', cause); error = 'Event gagal dimuat.'; }
  finally { isLoading = false; emit(); }
}

export async function createEvent(payload: Omit<EventResource, 'id' | 'reminders'>, reminder?: Omit<ReminderPayload, 'task_id'>) {
  if (Config.useLocalUiData) {
    seedLocalEvents();
    const event = { ...payload, id: `local-event-${Date.now()}`, reminders: [] };
    if (reminder) await saveReminder({ ...reminder, calendar_event_id: event.id });
    localEvents = [event, ...localEvents];
    events = [event, ...events];
    emit();
    return event;
  }

  const event = (await eventApi.create(payload)).data.event;
  if (reminder) await reminderApi.create({ ...reminder, calendar_event_id: event.id });
  events = [event, ...events]; emit(); return event;
}

export async function updateEvent(eventId: string, payload: Partial<Omit<EventResource, 'id' | 'reminders'>>) {
  if (Config.useLocalUiData) {
    seedLocalEvents();
    let updatedEvent: EventResource | undefined;
    localEvents = localEvents.map((item) => {
      if (item.id !== eventId) return item;
      updatedEvent = { ...item, ...payload };
      return updatedEvent;
    });
    events = events.map((item) => item.id === eventId && updatedEvent ? updatedEvent : item);
    emit();
    if (!updatedEvent) throw new Error('Event tidak ditemukan.');
    return updatedEvent;
  }

  const event = (await eventApi.update(eventId, payload)).data.event;
  events = events.map((item) => item.id === eventId ? event : item); emit(); return event;
}

export async function deleteEvent(eventId: string) {
  const previous = events;
  events = events.filter((item) => item.id !== eventId);
  emit();

  if (Config.useLocalUiData) {
    seedLocalEvents();
    localEvents = localEvents.filter((item) => item.id !== eventId);
    return;
  }

  try {
    await eventApi.remove(eventId);
  } catch (err) {
    events = previous;
    emit();
    throw err;
  }
}
