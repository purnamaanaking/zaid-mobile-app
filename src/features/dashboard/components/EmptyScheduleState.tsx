import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

export function EmptyScheduleState() {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>No schedule found</Text>
      <Text style={styles.emptyText}>Tasks created through prompt extraction will appear here.</Text>
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
