import { useMemo, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarBottomDock } from '@/src/features/calendar/components/CalendarBottomDock';
import { CalendarFilterBar } from '@/src/features/calendar/components/CalendarFilterBar';
import { CalendarGrid } from '@/src/features/calendar/components/CalendarGrid';
import { CalendarHeader } from '@/src/features/calendar/components/CalendarHeader';
import { CalendarScheduleCard } from '@/src/features/calendar/components/CalendarScheduleCard';
import { CalendarTaskSheet } from '@/src/features/calendar/components/CalendarTaskSheet';
import { CalendarFilter } from '@/src/features/calendar/types';
import { buildCalendarDays, dateKey, formatSelectedDateLabel, shiftMonth } from '@/src/features/calendar/utils/date';
import {
  addPromptSchedule,
  deletePromptSchedule,
  usePromptSchedules,
  fetchPromptSchedules,
} from '@/src/features/schedule/store/promptScheduleStore';
import { PromptSchedule } from '@/src/types/schedule.types';

export function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [startDate, setStartDate] = useState<string | null>(dateKey(today));
  const [endDate, setEndDate] = useState<string | null>(dateKey(today));
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>('recent');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [calendarSectionHeight, setCalendarSectionHeight] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const [taskSheetVisible, setTaskSheetVisible] = useState(false);
  const schedules = usePromptSchedules();

  useEffect(() => {
    fetchPromptSchedules();
  }, []);

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

  const selectedDateLabel = useMemo(() => {
    return startDate ? formatSelectedDateLabel(startDate, endDate) : formatSelectedDateLabel(dateKey(today));
  }, [endDate, startDate, today]);

  function syncMonthToDate(value: string) {
    const selected = new Date(`${value}T00:00:00`);

    if (selected.getMonth() !== monthDate.getMonth() || selected.getFullYear() !== monthDate.getFullYear()) {
      setMonthDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }

  function handleRangeChange(rangeStart: string, rangeEnd: string) {
    syncMonthToDate(rangeStart);
    setStartDate(rangeStart);
    setEndDate(rangeEnd);
    setActiveFilter('recent');
  }

  function handleRangeComplete(rangeStart: string, rangeEnd: string) {
    handleRangeChange(rangeStart, rangeEnd);
    setTaskSheetVisible(true);
  }

  function handleJumpToday() {
    const todayKey = dateKey(today);
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setStartDate(todayKey);
    setEndDate(todayKey);
    setActiveFilter('today');
    setTaskSheetVisible(true);
  }

  function handleChangeFilter(filter: CalendarFilter) {
    setActiveFilter(filter);

    if (filter === 'today') {
      const todayKey = dateKey(today);
      setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
      setStartDate(todayKey);
      setEndDate(todayKey);
    }
  }

  function handleDelete(scheduleId: string) {
    deletePromptSchedule(scheduleId);
    setEditingScheduleId((current) => (current === scheduleId ? null : current));
  }

  function handleEdit(scheduleId: string) {
    setEditingScheduleId((current) => (current === scheduleId ? null : scheduleId));
  }

  function handleAddManualSchedule(schedule: PromptSchedule) {
    addPromptSchedule(schedule);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        {/*
          stickyHeaderIndices={[1]} → child index ke-1 (StickyBar) akan menempel
          di atas ketika discroll melewatinya ke atas.

          Layout ScrollView children:
            [0] Kalender penuh (header + grid) — scroll & hilang normal
            [1] Sticky bar: label bulan kecil + filter bar
            [2] Daftar schedule card
        */}
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            setIsSticky(y >= calendarSectionHeight - 2);
          }}
          stickyHeaderIndices={[1]}>

          <View
            style={styles.calendarSection}
            onLayout={(e) => setCalendarSectionHeight(e.nativeEvent.layout.height)}>
            <CalendarHeader
              monthDate={monthDate}
              onNextMonth={() => setMonthDate((current) => shiftMonth(current, 1))}
              onPreviousMonth={() => setMonthDate((current) => shiftMonth(current, -1))}
              onTodayPress={handleJumpToday}
            />
            <CalendarGrid
              days={calendarDays}
              markedDates={markedDates}
              onRangeChange={handleRangeChange}
              onRangeComplete={handleRangeComplete}
              startDate={startDate}
              endDate={endDate}
            />
          </View>

          {/* ── [1] STICKY BAR: bulan mini + filter ────────────────── */}
          <View style={[
            styles.stickyBar,
            isSticky ? styles.stickyBarActive : null,
          ]}>
            <Text style={styles.stickyMonthLabel}>
              {selectedDateLabel}
            </Text>
            <CalendarFilterBar activeFilter={activeFilter} onChangeFilter={handleChangeFilter} />
          </View>

          {/* ── [2] Schedule cards ──────────────────────────────────── */}
          <View style={styles.scheduleList}>
            {visibleSchedules.length > 0 ? (
              visibleSchedules.map((schedule) => (
                <CalendarScheduleCard
                  isEditing={editingScheduleId === schedule.id}
                  key={`${schedule.id}-${editingScheduleId === schedule.id}`}
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
      </KeyboardAvoidingView>

      <CalendarTaskSheet
        editingScheduleId={editingScheduleId}
        endDate={endDate}
        onAddSchedule={handleAddManualSchedule}
        onClose={() => setTaskSheetVisible(false)}
        onDeleteSchedule={handleDelete}
        onEditSchedule={handleEdit}
        schedules={visibleSchedules}
        startDate={startDate}
        visible={taskSheetVisible}
      />

      <CalendarBottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  calendarSection: {
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  content: {
    paddingBottom: 126,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  emptyText: {
    color: '#98A4B8',
    fontSize: 13,
    fontWeight: '400',
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
    marginTop: 16,
    paddingHorizontal: 24,
  },
  // ── Sticky bar ─────────────────────────────────────────────────────
  stickyBar: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 12,
    // tidak ada border/shadow saat nyatu dengan background
  },
  stickyBarActive: {
    borderBottomColor: '#E8EAF0',
    borderBottomWidth: 0.5,
  },
  stickyMonthLabel: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
});
