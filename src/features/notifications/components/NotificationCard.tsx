import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PromptSchedule } from '@/src/types/schedule.types';

type NotificationCardProps = {
  reminderMinutes: number;
  schedule: PromptSchedule;
};

function reminderLabel(minutes: number) {
  if (minutes >= 1440) {
    return '1 day before';
  }

  if (minutes >= 60) {
    return `${minutes / 60} hour before`;
  }

  return `${minutes} min`;
}

export function NotificationCard({ reminderMinutes, schedule }: NotificationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.iconWrap}>
        <MaterialIcons name="warning" color="#FF5B50" size={18} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Reminder</Text>
          <Text style={styles.timeText}>{reminderLabel(reminderMinutes)}</Text>
        </View>
        <Text style={styles.body}>
          {schedule.title} starts at {schedule.time}. {schedule.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accent: {
    backgroundColor: '#FF4444',
    borderRadius: 999,
    bottom: 24,
    left: -4,
    position: 'absolute',
    top: 24,
    width: 4,
  },
  body: {
    color: '#92A0B6',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    marginBottom: 22,
    minHeight: 90,
    padding: 18,
    shadowColor: '#95a4c3ff',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#FFE4E4',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  timeText: {
    color: '#8A96AA',
    fontSize: 9,
    fontWeight: '600',
  },
  title: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '600',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
