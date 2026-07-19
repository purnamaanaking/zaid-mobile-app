import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomDock } from '@/src/features/navigation/components/AppBottomDock';
import { ReminderCard } from '@/src/features/notifications/components/ReminderCard';
import { NotificationFilterBar } from '@/src/features/notifications/components/NotificationFilterBar';
import { NotificationFilter } from '@/src/features/notifications/types';
import { deleteReminder, fetchReminders, useReminders } from '@/src/features/reminders/store/reminderStore';
import { syncAppReminderNotifications } from '@/src/services/notifications/nativeNotifications';

export function NotificationsPage() {
  const { reminders, isLoading, error } = useReminders();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    void fetchReminders();
  }, []);

  useEffect(() => {
    void syncAppReminderNotifications(reminders);
  }, [reminders]);

  const visibleReminders = useMemo(() => {
    const now = new Date();
    return reminders.filter((reminder) => {
      const date = new Date(reminder.remind_at);
      if (activeFilter === 'today') return date.toDateString() === now.toDateString();
      if (activeFilter === 'upcoming') return reminder.status === 'pending' && date > now;
      return true;
    });
  }, [activeFilter, reminders]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminder</Text>
        <Text style={styles.subtitle}>Sinkron dari backend ZAID. WhatsApp menjadi channel default.</Text>
        <NotificationFilterBar activeFilter={activeFilter} onChangeFilter={setActiveFilter} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void fetchReminders()} />}
        showsVerticalScrollIndicator={false}>
        {error ? (
          <Pressable accessibilityRole="button" onPress={() => void fetchReminders()} style={styles.errorCard}>
            <Text style={styles.errorText}>{error} Tekan untuk mencoba lagi.</Text>
          </Pressable>
        ) : null}

        {visibleReminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            onDelete={() => void deleteReminder(reminder.id).catch((cause) => console.warn('Failed to delete reminder', cause))}
            reminder={reminder}
          />
        ))}

        {!isLoading && visibleReminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum ada reminder</Text>
            <Text style={styles.emptyText}>Tambahkan reminder saat membuat atau mengedit task.</Text>
          </View>
        ) : null}
      </ScrollView>

      <AppBottomDock activeTab="notification" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 126, paddingHorizontal: 24, paddingTop: 18 },
  emptyCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 28 },
  emptyText: { color: '#8B95A8', fontSize: 13, lineHeight: 20, marginTop: 7, textAlign: 'center' },
  emptyTitle: { color: '#111827', fontSize: 16, fontWeight: '700' },
  errorCard: { backgroundColor: '#FEF2F2', borderRadius: 14, marginBottom: 14, padding: 14 },
  errorText: { color: '#B42318', fontSize: 13, textAlign: 'center' },
  header: { backgroundColor: '#FAFAFB', gap: 10, paddingBottom: 14, paddingHorizontal: 24, paddingTop: 22 },
  safeArea: { backgroundColor: '#FAFAFB', flex: 1 },
  subtitle: { color: '#8B95A8', fontSize: 12, lineHeight: 18 },
  title: { color: '#111827', fontSize: 24, fontWeight: '700' },
});
