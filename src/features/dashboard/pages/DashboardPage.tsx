import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardBottomDock } from '@/src/features/dashboard/components/DashboardBottomDock';
import { DashboardDateStrip } from '@/src/features/dashboard/components/DashboardDateStrip';
import { DashboardFilterPill } from '@/src/features/dashboard/components/DashboardFilterPill';
import { DashboardSearch } from '@/src/features/dashboard/components/DashboardSearch';
import { DashboardTaskCard } from '@/src/features/dashboard/components/DashboardTaskCard';
import { EmptyScheduleState } from '@/src/features/dashboard/components/EmptyScheduleState';
import { DashboardFilter } from '@/src/features/dashboard/types';
import { buildMonthDays, dateKey } from '@/src/features/dashboard/utils/date';
import { usePromptSchedules } from '@/src/features/schedule/store/promptScheduleStore';

export function DashboardPage() {
  const { width } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('recent');
  const [search, setSearch] = useState('');
  const promptSchedules = usePromptSchedules();

  const calendarDays = useMemo(() => buildMonthDays(today), [today]);
  const cardWidth = Math.max(64, Math.min(70, (width - 48 - 48) / 5));

  const schedules = useMemo(() => {
    const query = search.trim().toLowerCase();
    const todayKey = dateKey(today);

    return promptSchedules.filter((schedule) => {
      const matchesSearch =
        !query ||
        schedule.title.toLowerCase().includes(query) ||
        schedule.description?.toLowerCase().includes(query) ||
        schedule.sourcePrompt.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

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

      const sEnd = schedule.endDate || schedule.date;
      return sEnd >= selectedDate;
    });
  }, [activeFilter, promptSchedules, search, selectedDate, today]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerGlow} />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Day</Text>
          <Text style={styles.name}>Adam Smith</Text>
        </View>

        <DashboardSearch onChangeSearch={setSearch} search={search} />

        <DashboardDateStrip
          cardWidth={cardWidth}
          days={calendarDays}
          onSelectDate={setSelectedDate}
          selectedDate={selectedDate}
        />

        <View style={styles.filterRow}>
          <DashboardFilterPill
            active={activeFilter === 'recent'}
            label="Recent"
            onPress={() => setActiveFilter('recent')}
          />
          <DashboardFilterPill
            active={activeFilter === 'today'}
            label="Today"
            onPress={() => setActiveFilter('today')}
          />
          <DashboardFilterPill
            active={activeFilter === 'upcoming'}
            label="Upcoming"
            onPress={() => setActiveFilter('upcoming')}
          />
        </View>

        <View style={styles.taskList}>
          {schedules.length > 0 ? (
            schedules.map((schedule) => <DashboardTaskCard key={schedule.id} schedule={schedule} />)
          ) : (
            <EmptyScheduleState />
          )}
        </View>
      </ScrollView>

      <DashboardBottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 116,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 60,
  },
  greeting: {
    color: '#69738D',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    gap: 12,
    marginTop: 22,
  },
  headerGlow: {
    backgroundColor: '#F4EFEA',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    height: 344,
    left: 0,
    opacity: 0.86,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  name: {
    color: '#12182A',
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: 0,
  },
  safeArea: {
    backgroundColor: '#F7F7FB',
    flex: 1,
  },
  taskList: {
    marginTop: 34,
  },
});
