import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardSchedule } from '@/src/features/dashboard/types';
import { formatReadableDate } from '@/src/features/dashboard/utils/date';

type DashboardTaskCardProps = {
  schedule: DashboardSchedule;
};

export function DashboardTaskCard({ schedule }: DashboardTaskCardProps) {
  return (
    <Pressable accessibilityRole="button" style={styles.taskCard}>
      <View style={styles.accentBar} />
      <View style={styles.taskIcon}>
        <MaterialIcons name="event-note" color="#FF9F9F" size={15} />
      </View>
      <View style={styles.taskBody}>
        <Text style={styles.taskTitle}>{schedule.title}</Text>
        <Text numberOfLines={2} style={styles.taskDescription}>
          {schedule.description}
        </Text>
        <Text numberOfLines={1} style={styles.promptText}>
          From prompt: {schedule.sourcePrompt}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <MaterialIcons name="alarm" color="#FFFFFF" size={14} />
            <Text style={styles.metaText}>
              {schedule.time} - {schedule.endTime}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <MaterialIcons name="calendar-month" color="#FFFFFF" size={14} />
            <Text style={styles.metaText}>{formatReadableDate(schedule.date, schedule.endDate)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    backgroundColor: '#665CFF',
    borderRadius: 999,
    bottom: 34,
    left: -4,
    position: 'absolute',
    top: 34,
    width: 4,
  },
  metaChip: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    minHeight: 24,
    paddingHorizontal: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  promptText: {
    color: '#B2BBCB',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  taskBody: {
    flex: 1,
    paddingLeft: 42,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    minHeight: 136,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  taskDescription: {
    color: '#99A5BB',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 19,
    marginTop: 18,
  },
  taskIcon: {
    alignItems: 'center',
    backgroundColor: '#FFE9E9',
    borderRadius: 14,
    height: 26,
    justifyContent: 'center',
    left: 14,
    position: 'absolute',
    top: 16,
    width: 26,
  },
  taskTitle: {
    color: '#121827',
    fontSize: 15,
    fontWeight: '600',
  },
});
