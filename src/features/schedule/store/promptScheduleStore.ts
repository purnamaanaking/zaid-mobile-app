import { useSyncExternalStore } from 'react';
import { PromptSchedule } from '@/src/types/schedule.types';
import { buildPromptSchedules } from '@/src/features/schedule/data/promptSchedules';
import { scheduleApi } from '@/src/services/api/schedule.api';

const mockSchedules = buildPromptSchedules(new Date());

let schedules: PromptSchedule[] = [];
let isLoading = false;
let isLoaded = false;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
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

export function usePromptSchedules() {
  return useSyncExternalStore(subscribe, () => schedules, () => schedules);
}

export function usePromptSchedulesState() {
  const currentSchedules = useSyncExternalStore(subscribe, () => schedules, () => schedules);
  const loading = useSyncExternalStore(subscribe, () => isLoading, () => isLoading);
  const loaded = useSyncExternalStore(subscribe, () => isLoaded, () => isLoaded);

  return {
    schedules: currentSchedules,
    isLoading: loading,
    isLoaded: loaded,
  };
}

export async function fetchPromptSchedules() {
  isLoading = true;
  emit();
  try {
    const res = await scheduleApi.getTasks();
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
          reminderMinutes: 30,
          status: item.status === 'completed' ? 'done' : 'active',
          recurring: item.recurrence?.type || 'none',
          sourcePrompt: item.description || '',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        };
      });
    }
  } catch (err) {
    console.warn('Failed to fetch tasks from REST API, falling back to local mocks', err);
    schedules = mockSchedules;
  } finally {
    isLoading = false;
    isLoaded = true;
    emit();
  }
}

export async function addPromptSchedule(schedule: PromptSchedule) {
  // 1. Optimistic update
  schedules = [schedule, ...schedules];
  emit();

  // 2. Call API in the background
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
    await scheduleApi.createTask(payload);
    // Refetch to sync IDs and database properties
    fetchPromptSchedules();
  } catch (err) {
    console.warn('Failed to store task on backend API', err);
  }
}

export async function deletePromptSchedule(scheduleId: string) {
  // 1. Optimistic update
  schedules = schedules.filter((schedule) => schedule.id !== scheduleId);
  emit();

  // 2. Call API
  try {
    if (!scheduleId.startsWith('mock-') && !scheduleId.startsWith('ai-')) {
      await scheduleApi.deleteTask(scheduleId);
    }
  } catch (err) {
    console.warn('Failed to delete task from backend API', err);
  }
}

export async function updatePromptSchedule(scheduleId: string, patch: Partial<PromptSchedule>) {
  // 1. Optimistic update
  schedules = schedules.map((schedule) =>
    schedule.id === scheduleId
      ? { ...schedule, ...patch, updatedAt: new Date().toISOString() }
      : schedule
  );
  emit();

  // 2. Call API
  try {
    if (!scheduleId.startsWith('mock-') && !scheduleId.startsWith('ai-')) {
      const payload = {
        title: patch.title,
        description: patch.description,
        scheduled_date: patch.date,
        scheduled_time: toApiTime(patch.time),
      };
      await scheduleApi.updateTask(scheduleId, payload);
    }
  } catch (err) {
    console.warn('Failed to update task on backend API', err);
  }
}
