import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { monthTitle, yearTitle } from '@/src/features/calendar/utils/date';

type CalendarHeaderProps = {
  monthDate: Date;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onTodayPress: () => void;
};

export function CalendarHeader({ monthDate, onNextMonth, onPreviousMonth, onTodayPress }: CalendarHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.month}>{monthTitle(monthDate)}</Text>
        <Text style={styles.year}>{yearTitle(monthDate)}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Bulan sebelumnya"
          accessibilityRole="button"
          onPress={onPreviousMonth}
          style={styles.iconButton}>
          <MaterialIcons name="chevron-left" color="#445066" size={34} />
        </Pressable>
        <Pressable
          accessibilityLabel="Ke hari ini"
          accessibilityRole="button"
          onPress={onTodayPress}
          style={styles.todayButton}>
          <Text style={styles.todayText}>Hari Ini</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Bulan berikutnya"
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
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
  year: {
    color: '#98A1B5',
    fontSize: 16,
    fontWeight: '600',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  todayButton: {
    alignItems: 'center',
    backgroundColor: '#F3F1FF',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  todayText: {
    color: '#665CFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
