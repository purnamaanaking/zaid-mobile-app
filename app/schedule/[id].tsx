import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePromptSchedulesState, deletePromptSchedule } from '@/src/features/schedule/store/promptScheduleStore';

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { schedules } = usePromptSchedulesState();

  const schedule = useMemo(() => schedules.find((s) => s.id === id), [id, schedules]);

  const handleDelete = async () => {
    Alert.alert('Hapus Jadwal', 'Apakah Anda yakin ingin menghapus jadwal ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePromptSchedule(id);
            router.back();
          } catch (err: any) {
            Alert.alert('Gagal menghapus', err.message || 'Terjadi kesalahan.');
          }
        },
      },
    ]);
  };

  if (!schedule) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Kembali" onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text style={styles.title}>Jadwal Tidak Ditemukan</Text>
          <View style={styles.iconSpacer} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Kembali" onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Detail Jadwal</Text>
        <View style={styles.iconSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, schedule.status === 'done' ? styles.statusDone : null]}>
              <Text style={styles.statusText}>{schedule.status === 'done' ? 'Selesai' : 'Aktif'}</Text>
            </View>
          </View>

          <Text style={styles.scheduleTitle}>{schedule.title}</Text>

          <View style={styles.detailRow}>
            <MaterialIcons name="calendar-today" size={18} color="#665CFF" />
            <Text style={styles.detailText}>
              {schedule.date}{schedule.endDate ? ` - ${schedule.endDate}` : ''}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={18} color="#665CFF" />
            <Text style={styles.detailText}>
              {schedule.time}{schedule.endTime ? ` - ${schedule.endTime}` : ''}
            </Text>
          </View>

          {schedule.location ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={18} color="#665CFF" />
              <Text style={styles.detailText}>{schedule.location}</Text>
            </View>
          ) : null}

          {schedule.description ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="description" size={18} color="#665CFF" />
              <Text style={styles.detailText}>{schedule.description}</Text>
            </View>
          ) : null}

          {schedule.reminderEnabled ? (
            <View style={styles.detailRow}>
              <MaterialIcons name="notifications-active" size={18} color="#F59E0B" />
              <Text style={styles.detailText}>Pengingat {schedule.reminderMinutes} menit sebelumnya</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel="Hapus jadwal"
          accessibilityRole="button"
          onPress={handleDelete}
          style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" color="#EF4444" size={20} />
          <Text style={styles.deleteText}>Hapus Jadwal</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFAFB', flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  iconButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  iconSpacer: { width: 40 },
  title: { color: '#111827', fontSize: 18, fontWeight: '800' },
  content: { gap: 16, padding: 24, paddingBottom: 48 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
  statusRow: { alignItems: 'flex-start' },
  statusBadge: { backgroundColor: '#F3F1FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 },
  statusDone: { backgroundColor: '#D1FAE5' },
  statusText: { color: '#665CFF', fontSize: 12, fontWeight: '700' },
  scheduleTitle: { color: '#111827', fontSize: 20, fontWeight: '700', lineHeight: 28 },
  detailRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  detailText: { color: '#374151', flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 21 },
  deleteButton: { alignItems: 'center', backgroundColor: '#FEF2F2', borderColor: '#FEE2E2', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 8, height: 52, justifyContent: 'center', marginTop: 8 },
  deleteText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
