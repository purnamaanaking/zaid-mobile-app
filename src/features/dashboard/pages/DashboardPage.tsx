import { useMemo, useState, useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { DashboardBottomDock } from '@/src/features/dashboard/components/DashboardBottomDock';
import { DashboardDateStrip } from '@/src/features/dashboard/components/DashboardDateStrip';
import { DashboardSearch } from '@/src/features/dashboard/components/DashboardSearch';
import { DashboardTaskCard } from '@/src/features/dashboard/components/DashboardTaskCard';
import { EmptyScheduleState } from '@/src/features/dashboard/components/EmptyScheduleState';
import { buildMonthDays, dateKey } from '@/src/features/dashboard/utils/date';
import { usePromptSchedules, fetchPromptSchedules } from '@/src/features/schedule/store/promptScheduleStore';
import { useAuthStore } from '@/src/store/auth.store';

export function DashboardPage() {
  const { width } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [search, setSearch] = useState('');
  const promptSchedules = usePromptSchedules();
  const { user } = useAuthStore();

  // ── animasi lambaian tangan ──────────────────────────────────────
  const waveAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(2000), // jeda 2 detik sebelum wave lagi
      ])
    ).start();
  }, [waveAnim]);

  const waveRotate = waveAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-25deg', '0deg', '25deg'],
  });

  useEffect(() => {
    fetchPromptSchedules();
  }, []);

  const calendarDays = useMemo(() => buildMonthDays(today), [today]);
  const cardWidth = Math.max(64, Math.min(70, (width - 48 - 48) / 5));

  const schedules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return promptSchedules.filter((schedule) => {
      const matchesSearch =
        !query ||
        schedule.title.toLowerCase().includes(query) ||
        schedule.description?.toLowerCase().includes(query) ||
        schedule.sourcePrompt.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      const sEnd = schedule.endDate || schedule.date;
      return sEnd >= selectedDate;
    });
  }, [promptSchedules, search, selectedDate]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#E3DFFF', '#F3F4F9', '#F7F7FB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* ── STICKY HEADER ─────────────────────────────────────────── */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>Good Day</Text>
              <Animated.Text
                style={[
                  styles.waveEmoji,
                  { transform: [{ rotate: waveRotate }, { translateY: -2 }] },
                ]}>
                👋
              </Animated.Text>
            </View>
            <Text style={styles.name}>{user?.full_name || 'User'}</Text>
          </View>

          <DashboardSearch onChangeSearch={setSearch} search={search} />

          <DashboardDateStrip
            cardWidth={cardWidth}
            days={calendarDays}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />


        </View>

        {/* ── SCROLLABLE CARD LIST ───────────────────────────────────── */}
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 116,
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  greeting: {
    color: '#69738D',
    fontSize: 15,
    fontWeight: '600',
  },
  greetingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  waveEmoji: {
    fontSize: 16,
  },
  header: {
    gap: 12,
    marginBottom: 14,
    marginTop: 22,
  },
  name: {
    color: '#12182A',
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: 0,
  },
  safeArea: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  stickyHeader: {
    paddingBottom: 14,
    paddingHorizontal: 24,
  },
  taskList: {
    marginTop: 20,
  },
});
