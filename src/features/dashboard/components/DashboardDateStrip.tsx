import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';

import { DAY_LABELS, dateKey, formatReadableDate } from '@/src/features/dashboard/utils/date';

type DashboardDateStripProps = {
  cardWidth: number;
  days: Date[];
  onSelectDate: (date: string) => void;
  selectedDate: string;
};

export function DashboardDateStrip({
  cardWidth,
  days,
  onSelectDate,
  selectedDate,
}: DashboardDateStripProps) {
  const fixedCardWidth = 68;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={styles.scrollView}
    >
      <View style={styles.calendarRow}>
        {days.map((day) => {
          const key = dateKey(day);
          const isSelected = key === selectedDate;

          return (
            <Pressable
              accessibilityLabel={`Select ${formatReadableDate(key)}`}
              accessibilityRole="button"
              key={key}
              onPress={() => onSelectDate(key)}
              style={[styles.dateCard, { width: fixedCardWidth }, isSelected ? styles.dateCardActive : null]}>
              <Text style={[styles.dayLabel, isSelected ? styles.dateTextActive : null]}>
                {DAY_LABELS[day.getDay()]}
              </Text>
              <View style={[styles.dateDivider, isSelected ? styles.dateDividerActive : null]} />
              <Text style={[styles.dateNumber, isSelected ? styles.dateTextActive : null]}>
                {day.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: -24,
    marginTop: 34,
  },
  scrollContainer: {
    paddingHorizontal: 24,
  },
  calendarRow: {
    flexDirection: 'row',
    gap: 14,
  },
  dateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    height: 84,
    justifyContent: 'center',
  },
  dateCardActive: {
    backgroundColor: '#665CFF',
  },
  dateDivider: {
    backgroundColor: '#D4D9E5',
    height: 2,
    marginBottom: 6,
    marginTop: 4,
    width: 26,
  },
  dateDividerActive: {
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  dateNumber: {
    color: '#4C586B',
    fontSize: 24,
    fontWeight: '600',
  },
  dateTextActive: {
    color: '#FFFFFF',
  },
  dayLabel: {
    color: '#97A0B4',
    fontSize: 14,
    fontWeight: '600',
  },
});
