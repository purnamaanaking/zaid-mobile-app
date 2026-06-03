import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomDock } from '@/src/features/navigation/components/AppBottomDock';
import { NotificationCard } from '@/src/features/notifications/components/NotificationCard';
import { NotificationFilterBar } from '@/src/features/notifications/components/NotificationFilterBar';
import { NotificationFilter } from '@/src/features/notifications/types';
import { usePromptSchedules } from '@/src/features/schedule/store/promptScheduleStore';

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
        items.push({
          id: `${schedule.id}-oneday`,
          schedule,
          minutes: 1440,
        });
      }
      if (remindOneHour) {
        items.push({
          id: `${schedule.id}-onehour`,
          schedule,
          minutes: 60,
        });
      }
    });
    return items;
  }, [visibleSchedules, remindOneDay, remindOneHour]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification</Text>
        </View>

        <NotificationFilterBar activeFilter={activeFilter} onChangeFilter={setActiveFilter} />

        {/* Configurations Setting Switches Card */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsHeader}>
            <MaterialIcons name="settings" color="#665CFF" size={20} />
            <Text style={styles.settingsTitle}>Reminder Configurations</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>1 Day Before</Text>
              <Text style={styles.settingDesc}>Notify 24 hours prior to scheduled events</Text>
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
              <Text style={styles.settingDesc}>Notify 60 minutes prior to scheduled events</Text>
            </View>
            <Switch
              value={remindOneHour}
              onValueChange={setRemindOneHour}
              trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
              thumbColor={remindOneHour ? '#665CFF' : '#F3F4F6'}
            />
          </View>
        </View>

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
  content: {
    paddingBottom: 126,
    paddingHorizontal: 25,
    paddingTop: 56,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  list: {
    marginTop: 26,
  },
  safeArea: {
    backgroundColor: '#FAFAFB',
    flex: 1,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    shadowColor: '#1D2433',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  settingsTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  separator: {
    backgroundColor: '#F3F4F6',
    height: 1,
    marginVertical: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#1D2433',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
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
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '600',
  },
});
