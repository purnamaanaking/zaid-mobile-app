import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarBottomDock } from '@/src/features/calendar/components/CalendarBottomDock';
import { CalendarFilterBar } from '@/src/features/calendar/components/CalendarFilterBar';
import { CalendarGrid } from '@/src/features/calendar/components/CalendarGrid';
import { CalendarHeader } from '@/src/features/calendar/components/CalendarHeader';
import { CalendarScheduleCard } from '@/src/features/calendar/components/CalendarScheduleCard';
import { CalendarFilter } from '@/src/features/calendar/types';
import { buildCalendarDays, dateKey, shiftMonth } from '@/src/features/calendar/utils/date';
import {
  deletePromptSchedule,
  usePromptSchedules,
} from '@/src/features/schedule/store/promptScheduleStore';

export function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [startDate, setStartDate] = useState<string | null>(dateKey(today));
  const [endDate, setEndDate] = useState<string | null>(dateKey(today));
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>('recent');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const schedules = usePromptSchedules();

  const calendarDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);
  const markedDates = useMemo(() => {
    const dates = new Set<string>();
    schedules.forEach((schedule) => {
      dates.add(schedule.date);
      if (schedule.endDate) {
        let curr = new Date(`${schedule.date}T00:00:00`);
        const end = new Date(`${schedule.endDate}T00:00:00`);
        while (curr <= end) {
          dates.add(dateKey(curr));
          curr.setDate(curr.getDate() + 1);
        }
      }
    });
    return dates;
  }, [schedules]);

  const visibleSchedules = useMemo(() => {
    const todayKey = dateKey(today);

    return schedules.filter((schedule) => {
      if (activeFilter === 'today') {
        if (schedule.endDate) {
          return todayKey >= schedule.date && todayKey <= schedule.endDate;
        }
        return schedule.date === todayKey;
      }

      if (activeFilter === 'upcoming') {
        const sEnd = schedule.endDate || schedule.date;
        return sEnd > todayKey;
      }

      if (startDate && endDate) {
        const sStart = schedule.date;
        const sEnd = schedule.endDate || schedule.date;
        return sStart <= endDate && sEnd >= startDate;
      }

      const targetDate = startDate || todayKey;
      const sStart = schedule.date;
      const sEnd = schedule.endDate || schedule.date;
      return targetDate >= sStart && targetDate <= sEnd;
    });
  }, [activeFilter, schedules, startDate, endDate, today]);

  function handleSelectDate(value: string) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(value);
      setEndDate(null);
    } else {
      if (value < startDate) {
        setStartDate(value);
        setEndDate(null);
      } else {
        setEndDate(value);
      }
    }
    setActiveFilter('recent');
  }

  function handleDelete(scheduleId: string) {
    deletePromptSchedule(scheduleId);
    setEditingScheduleId((current) => (current === scheduleId ? null : current));
  }

  function handleEdit(scheduleId: string) {
    setEditingScheduleId((current) => (current === scheduleId ? null : scheduleId));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <CalendarHeader
          monthDate={monthDate}
          onNextMonth={() => setMonthDate((current) => shiftMonth(current, 1))}
          onPreviousMonth={() => setMonthDate((current) => shiftMonth(current, -1))}
        />

        <CalendarGrid
          days={calendarDays}
          markedDates={markedDates}
          onSelectDate={handleSelectDate}
          startDate={startDate}
          endDate={endDate}
        />

        {startDate ? (
          <Text style={styles.sectionTitle}>
            {startDate}
            {endDate ? ` to ${endDate}` : ''}
          </Text>
        ) : null}

        <CalendarFilterBar activeFilter={activeFilter} onChangeFilter={setActiveFilter} />

        <View style={styles.scheduleList}>
          {visibleSchedules.length > 0 ? (
            visibleSchedules.map((schedule) => (
              <CalendarScheduleCard
                isEditing={editingScheduleId === schedule.id}
                key={schedule.id}
                onDelete={() => handleDelete(schedule.id)}
                onEdit={() => handleEdit(schedule.id)}
                schedule={schedule}
              />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No schedule on this date range</Text>
              <Text style={styles.emptyText}>
                Schedules created from AI prompt will be marked on the calendar.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <CalendarBottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 126,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  emptyText: {
    color: '#98A4B8',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 6,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scheduleList: {
    marginTop: 34,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 34,
  },
});
