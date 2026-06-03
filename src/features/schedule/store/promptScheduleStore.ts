import { useSyncExternalStore } from 'react';
import { PromptSchedule } from '@/src/types/schedule.types';
import { buildPromptSchedules } from '@/src/features/schedule/data/promptSchedules';
import { scheduleApi } from '@/src/services/api/schedule.api';

// Initialize with rich visual mock schedules
let schedules: PromptSchedule[] = buildPromptSchedules(new Date());
let isLoading = false;
let isLoaded = true;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
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
      schedules = res.data.items.map((item) => ({
        id: item.id,
        userId: 'user-1',
        title: item.title,
        date: item.scheduled_date,
        endDate: item.scheduled_date,
        time: item.scheduled_time || '09:00',
        endTime: (() => {
          const [h, m] = (item.scheduled_time || '09:00').split(':').map(Number);
          return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        })(),
        location: 'API Server',
        description: item.description || '',
        reminderMinutes: 30,
        status: item.status === 'completed' ? 'done' : 'active',
        recurring: item.recurrence?.type || 'none',
        sourcePrompt: item.description || '',
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch tasks from REST API, falling back to local mocks', err);
    // Silent fallback to local in-memory schedules (already loaded with fixtures)
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
      scheduled_time: schedule.time,
      all_day: false,
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
        scheduled_time: patch.time,
        status: patch.status === 'done' ? 'completed' : 'active' as any,
      };
      await scheduleApi.updateTask(scheduleId, payload);
    }
  } catch (err) {
    console.warn('Failed to update task on backend API', err);
  }
}
