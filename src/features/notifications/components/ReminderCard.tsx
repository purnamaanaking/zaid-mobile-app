import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ReminderResource } from '@/src/services/api/reminder.api';

export function ReminderCard({ reminder, onDelete }: { reminder: ReminderResource; onDelete: () => void }) {
  const source = reminder.task || reminder.calendar_event;
  const channel = reminder.channel === 'both' ? 'WhatsApp + App' : reminder.channel === 'app' ? 'App' : 'WhatsApp';
  const offset = reminder.minutes_before >= 1440
    ? `${reminder.minutes_before / 1440} hari`
    : reminder.minutes_before >= 60
      ? `${reminder.minutes_before / 60} jam`
      : `${reminder.minutes_before} menit`;

  return (
    <View style={styles.card}>
      <View style={styles.icon}><MaterialIcons name="notifications-active" color="#665CFF" size={20} /></View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>{source?.title || 'Reminder'}</Text>
        <Text style={styles.meta}>{offset} sebelumnya · {channel}</Text>
        <Text style={[styles.status, reminder.status === 'sent' ? styles.sent : null, reminder.status === 'failed' ? styles.failed : null]}>{reminder.status}</Text>
        {reminder.error_message ? <Text style={styles.error}>{reminder.error_message}</Text> : null}
      </View>
      {reminder.status === 'pending' ? (
        <Pressable accessibilityLabel="Hapus reminder" onPress={onDelete} style={styles.delete}>
          <MaterialIcons name="delete-outline" color="#EF4444" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', gap: 12, marginBottom: 12, padding: 16 },
  content: { flex: 1 },
  delete: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  icon: { alignItems: 'center', backgroundColor: '#F0EEFF', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  meta: { color: '#8B95A8', fontSize: 12, marginTop: 5 },
  error: { color: '#B42318', fontSize: 11, marginTop: 4 },
  failed: { color: '#B42318' },
  sent: { color: '#059669' },
  status: { color: '#665CFF', fontSize: 11, fontWeight: '800', marginTop: 7, textTransform: 'uppercase' },
  title: { color: '#111827', fontSize: 15, fontWeight: '700' },
});
