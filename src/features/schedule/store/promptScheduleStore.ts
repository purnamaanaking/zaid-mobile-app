import { useSyncExternalStore } from 'react';

import { buildPromptSchedules } from '@/src/features/schedule/data/promptSchedules';
import { PromptSchedule } from '@/src/types/schedule.types';

let schedules = buildPromptSchedules(new Date());
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

export function addPromptSchedule(schedule: PromptSchedule) {
  schedules = [schedule, ...schedules];
  emit();
}

export function deletePromptSchedule(scheduleId: string) {
  schedules = schedules.filter((schedule) => schedule.id !== scheduleId);
  emit();
}

export function updatePromptSchedule(scheduleId: string, patch: Partial<PromptSchedule>) {
  schedules = schedules.map((schedule) =>
    schedule.id === scheduleId ? { ...schedule, ...patch, updatedAt: new Date().toISOString() } : schedule,
  );
  emit();
}
