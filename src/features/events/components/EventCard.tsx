import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EventResource } from '@/src/services/api/event.api';

export function EventCard({ event, onDelete }: { event: EventResource; onDelete: () => void }) {
  const start = event.starts_at ? new Date(event.starts_at) : null;
  return (
    <View style={styles.card}>
      <View style={styles.icon}><MaterialIcons name="event" color="#665CFF" size={18} /></View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>{start ? start.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tanpa waktu'}</Text>
        {event.reminders?.length ? <Text style={styles.reminder}>{event.reminders.length} pengingat</Text> : null}
      </View>
      <Pressable accessibilityLabel={`Hapus event ${event.title}`} onPress={onDelete} style={styles.delete}>
        <MaterialIcons name="delete-outline" color="#EF4444" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', gap: 12, marginBottom: 12, padding: 16 },
  content: { flex: 1 },
  delete: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  icon: { alignItems: 'center', backgroundColor: '#F0EEFF', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  meta: { color: '#8B95A8', fontSize: 12, marginTop: 4 },
  reminder: { color: '#665CFF', fontSize: 11, fontWeight: '700', marginTop: 6 },
  title: { color: '#111827', fontSize: 15, fontWeight: '700' },
});
