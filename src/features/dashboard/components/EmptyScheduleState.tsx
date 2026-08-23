import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

export function EmptyScheduleState() {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>Tidak ada jadwal ditemukan</Text>
      <Text style={styles.emptyText}>Tugas yang dibuat melalui ekstraksi prompt akan muncul di sini.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
  },
  emptyText: {
    color: '#95A0B4',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
