import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { monthTitle, yearTitle } from '@/src/features/calendar/utils/date';

type CalendarHeaderProps = {
  monthDate: Date;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
};

export function CalendarHeader({ monthDate, onNextMonth, onPreviousMonth }: CalendarHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.month}>{monthTitle(monthDate)}</Text>
        <View style={styles.yearBadge}>
          <Text style={styles.yearText}>{yearTitle(monthDate)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          onPress={onPreviousMonth}
          style={styles.iconButton}>
          <MaterialIcons name="chevron-left" color="#445066" size={34} />
        </Pressable>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          onPress={onNextMonth}
          style={styles.iconButton}>
          <MaterialIcons name="chevron-right" color="#445066" size={34} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  iconButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  month: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '600',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  yearBadge: {
    backgroundColor: '#E9E8FF',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  yearText: {
    color: '#665CFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
