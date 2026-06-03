import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState, useEffect } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef } from 'react';

import { AppBottomDock } from '@/src/features/navigation/components/AppBottomDock';
import { NotificationCard } from '@/src/features/notifications/components/NotificationCard';
import { NotificationFilterBar } from '@/src/features/notifications/components/NotificationFilterBar';
import { NotificationFilter } from '@/src/features/notifications/types';
import { usePromptSchedules, fetchPromptSchedules } from '@/src/features/schedule/store/promptScheduleStore';

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function NotificationsPage() {
  const schedules = usePromptSchedules();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [remindOneDay, setRemindOneDay] = useState(true);
  const [remindOneHour, setRemindOneHour] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);

  // animasi dropdown config
  const configAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchPromptSchedules();
  }, []);

  useEffect(() => {
    Animated.timing(configAnim, {
      toValue: configOpen ? 1 : 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [configOpen, configAnim]);

  const configMaxHeight = configAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });
  const configOpacity = configAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const visibleSchedules = useMemo(() => {
    const today = dateKey(new Date());

    return schedules.filter((schedule) => {
      if (activeFilter === 'today') {
        if (schedule.endDate) {
          return today >= schedule.date && today <= schedule.endDate;
        }
        return schedule.date === today;
      }

      if (activeFilter === 'upcoming') {
        const sEnd = schedule.endDate || schedule.date;
        return sEnd > today;
      }

      return true;
    });
  }, [activeFilter, schedules]);

  const notificationItems = useMemo(() => {
    const items: { id: string; schedule: typeof schedules[0]; minutes: number }[] = [];
    visibleSchedules.forEach((schedule) => {
      if (remindOneDay) {
        items.push({ id: `${schedule.id}-oneday`, schedule, minutes: 1440 });
      }
      if (remindOneHour) {
        items.push({ id: `${schedule.id}-onehour`, schedule, minutes: 60 });
      }
    });
    return items;
  }, [visibleSchedules, remindOneDay, remindOneHour]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <View style={styles.stickyHeader}>
        {/* Title + config icon */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notification</Text>
          <Pressable
            accessibilityLabel="Reminder configuration"
            accessibilityRole="button"
            onPress={() => setConfigOpen((v) => !v)}
            style={[styles.configButton, configOpen ? styles.configButtonActive : null]}>
            <MaterialIcons
              name="tune"
              color={configOpen ? '#FFFFFF' : '#665CFF'}
              size={20}
            />
          </Pressable>
        </View>

        {/* Config panel — animated dropdown */}
        <Animated.View style={[styles.configPanel, { maxHeight: configMaxHeight, opacity: configOpacity }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>1 Day Before</Text>
              <Text style={styles.settingDesc}>Notify 24 hours prior</Text>
            </View>
            <Switch
              value={remindOneDay}
              onValueChange={setRemindOneDay}
              trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
              thumbColor={remindOneDay ? '#665CFF' : '#F3F4F6'}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>1 Hour Before</Text>
              <Text style={styles.settingDesc}>Notify 60 minutes prior</Text>
            </View>
            <Switch
              value={remindOneHour}
              onValueChange={setRemindOneHour}
              trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
              thumbColor={remindOneHour ? '#665CFF' : '#F3F4F6'}
            />
          </View>
        </Animated.View>

        {/* Filter bar */}
        <View style={styles.filterWrap}>
          <NotificationFilterBar activeFilter={activeFilter} onChangeFilter={setActiveFilter} />
        </View>
      </View>

      {/* ── SCROLLABLE NOTIFICATION LIST ──────────────────────────────── */}
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {notificationItems.map((item) => (
            <NotificationCard
              key={item.id}
              reminderMinutes={item.minutes}
              schedule={item.schedule}
            />
          ))}
          {notificationItems.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No active reminders</Text>
              <Text style={styles.emptyText}>
                Turn on the reminder toggles above or add schedules to view notifications.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AppBottomDock activeTab="notification" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  configButton: {
    alignItems: 'center',
    backgroundColor: '#EEF0FF',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  configButtonActive: {
    backgroundColor: '#665CFF',
  },
  configPanel: {
    overflow: 'hidden',
  },
  content: {
    paddingBottom: 126,
    paddingHorizontal: 25,
    paddingTop: 12,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    padding: 24,
    shadowColor: '#95a4c3ff',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterWrap: {
    marginTop: 14,
    marginBottom: 2,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  list: {
    marginTop: 8,
  },
  safeArea: {
    backgroundColor: '#FAFAFB',
    flex: 1,
  },
  separator: {
    backgroundColor: '#F3F4F6',
    height: 1,
    marginVertical: 10,
  },
  settingDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  settingLabel: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  stickyHeader: {
    backgroundColor: '#FAFAFB',
    borderBottomColor: '#ECEEF3',
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '600',
  },
});
