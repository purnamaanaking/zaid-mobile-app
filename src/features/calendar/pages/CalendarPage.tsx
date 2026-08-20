import { useCallback, useMemo, useState, useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

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
  usePromptSchedulesState,
  fetchPromptSchedules,
} from '@/src/features/schedule/store/promptScheduleStore';
import { PromptSchedule } from '@/src/types/schedule.types';
import { deleteEvent, fetchEvents, useEvents } from '@/src/features/events/store/eventStore';
import { EventCard } from '@/src/features/events/components/EventCard';
import { useAppTheme } from '@/src/theme/useAppTheme';

export function CalendarPage() {
  const router = useRouter();
  const theme = useAppTheme();
  const [today, setToday] = useState(() => new Date());
  const [monthDate, setMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [startDate, setStartDate] = useState<string | null>(dateKey(today));
  const [endDate, setEndDate] = useState<string | null>(dateKey(today));
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>('recent');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [calendarSectionHeight, setCalendarSectionHeight] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const [taskSheetVisible, setTaskSheetVisible] = useState(false);
  const { schedules, isLoading, error } = usePromptSchedulesState();
  const { events } = useEvents();

  useEffect(() => {
    fetchPromptSchedules();
  }, []);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timer = setTimeout(() => setToday(new Date()), nextMidnight.getTime() - now.getTime() + 1000);
    return () => clearTimeout(timer);
  }, [today]);

  useEffect(() => {
    const from = dateKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
    const to = dateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
    void fetchEvents(from, to);
  }, [monthDate]);

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
    events.forEach((event) => {
      if (event.starts_at) dates.add(dateKey(new Date(event.starts_at)));
    });
    return dates;
  }, [schedules, events]);

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
        return sEnd >= todayKey;
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

  const visibleEvents = useMemo(() => events.filter((event) => {
    const eventDate = event.starts_at ? dateKey(new Date(event.starts_at)) : null;
    if (!eventDate) return false;
    if (startDate && endDate) return eventDate >= startDate && eventDate <= endDate;
    return eventDate === (startDate || dateKey(today));
  }), [endDate, events, startDate, today]);

  const selectedDateLabel = useMemo(() => {
    if (activeFilter === 'upcoming') return 'Upcoming';
    return startDate ? formatSelectedDateLabel(startDate, endDate) : formatSelectedDateLabel(dateKey(today));
  }, [activeFilter, endDate, startDate, today]);

  const syncMonthToDate = useCallback((value: string) => {
    const selected = new Date(`${value}T00:00:00`);

    setMonthDate((current) => {
      if (selected.getMonth() !== current.getMonth() || selected.getFullYear() !== current.getFullYear()) {
        return new Date(selected.getFullYear(), selected.getMonth(), 1);
      }
      return current;
    });
  }, []);

  const handleRangeChange = useCallback((rangeStart: string, rangeEnd: string) => {
    syncMonthToDate(rangeStart);
    setStartDate(rangeStart);
    setEndDate(rangeEnd);
    setActiveFilter('recent');
  }, [syncMonthToDate]);

  const handleRangeComplete = useCallback((rangeStart: string, rangeEnd: string) => {
    handleRangeChange(rangeStart, rangeEnd);
    setTaskSheetVisible(true);
  }, [handleRangeChange]);

  const handleTap = useCallback((date: string) => {
    syncMonthToDate(date);
    setStartDate(date);
    setEndDate(date);
    setActiveFilter('recent');
    setTaskSheetVisible(true);
  }, [syncMonthToDate]);

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

  async function handleDelete(scheduleId: string) {
    try {
      await deletePromptSchedule(scheduleId);
    } catch (err: any) {
      Alert.alert('Gagal menghapus', err.message || 'Terjadi kesalahan.');
    }
    setEditingScheduleId((current) => (current === scheduleId ? null : current));
  }

  function handleEdit(scheduleId: string) {
    setEditingScheduleId((current) => (current === scheduleId ? null : scheduleId));
  }

  function handleAddManualSchedule(schedule: PromptSchedule) {
    void addPromptSchedule(schedule).catch((err: any) => {
      Alert.alert('Gagal menyimpan', err?.message || 'Terjadi kesalahan.');
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgSecondary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View style={[styles.backHeader, { backgroundColor: theme.bgSecondary }]}>
          <Pressable
            accessibilityLabel="Kembali ke halaman utama"
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/ai')}
            style={({ pressed }) => [styles.backButton, pressed ? { opacity: 0.7 } : null]}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            <Text style={[styles.backButtonText, { color: theme.text }]}>Kembali</Text>
          </Pressable>
        </View>
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
            style={[styles.calendarSection, { backgroundColor: theme.bgSecondary }]}
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
              onTap={handleTap}
              startDate={startDate}
              endDate={endDate}
            />
          </View>

          {/* ── [1] STICKY BAR: bulan mini + filter ────────────────── */}
          <View style={[
            styles.stickyBar,
            { backgroundColor: theme.bgSecondary },
            isSticky ? styles.stickyBarActive : null,
          ]}>
            <Text style={styles.stickyMonthLabel}>
              {selectedDateLabel}
            </Text>
            <CalendarFilterBar activeFilter={activeFilter} onChangeFilter={handleChangeFilter} />
          </View>

          {/* ── [2] Schedule cards ──────────────────────────────────── */}
          <View style={styles.scheduleList}>
            {isLoading ? (
              <View style={styles.emptyCard}><Text style={styles.emptyText}>Memuat kalender…</Text></View>
            ) : error ? (
              <View style={styles.emptyCard}>
                <Text accessibilityRole="alert" style={styles.emptyTitle}>Kalender gagal dimuat</Text>
                <Text onPress={() => void fetchPromptSchedules()} style={styles.emptyText}>{error} Tekan untuk mencoba lagi.</Text>
              </View>
            ) : visibleSchedules.length > 0 ? (
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
                <Text style={styles.emptyTitle}>Tidak ada jadwal di rentang ini</Text>
                <Text style={styles.emptyText}>
                  Jadwal dari AI prompt akan muncul di kalender.
                </Text>
              </View>
            )}
            {visibleEvents.length ? (
              <View style={styles.eventList}>
                <Text style={styles.eventHeading}>Acara</Text>
                {visibleEvents.map((event) => (
                  <EventCard event={event} key={event.id} onDelete={() => {
                    deleteEvent(event.id).catch((err: any) => {
                      Alert.alert('Gagal menghapus', err?.message || 'Terjadi kesalahan.');
                    });
                  }} />
                ))}
              </View>
            ) : null}
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  backHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
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
  eventHeading: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  eventList: {
    marginTop: 20,
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
