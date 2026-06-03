import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarDay } from '@/src/features/calendar/types';
import { WEEKDAY_LABELS } from '@/src/features/calendar/utils/date';

type CalendarGridProps = {
  days: CalendarDay[];
  markedDates: Set<string>;
  onSelectDate: (date: string) => void;
  startDate: string | null;
  endDate: string | null;
};

export function CalendarGrid({ days, markedDates, onSelectDate, startDate, endDate }: CalendarGridProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text
            key={label}
            style={[styles.weekLabel, index === 0 || index === 6 ? styles.weekendLabel : null]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const isSelected = day.dateKey === startDate || day.dateKey === endDate;
          const isRangeStart = startDate && day.dateKey === startDate && endDate && endDate !== startDate;
          const isRangeEnd = endDate && day.dateKey === endDate && startDate && endDate !== startDate;
          const isInRange = startDate && endDate && day.dateKey > startDate && day.dateKey < endDate;
          const isMarked = markedDates.has(day.dateKey);
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

          return (
            <Pressable
              accessibilityLabel={`Select date ${day.dateKey}`}
              accessibilityRole="button"
              key={day.dateKey}
              onPress={() => onSelectDate(day.dateKey)}
              style={styles.dayCell}>
              
              {/* Overlapping Range Background Highlights */}
              {isRangeStart && <View style={styles.rangeBackgroundRight} />}
              {isRangeEnd && <View style={styles.rangeBackgroundLeft} />}
              {isInRange && <View style={styles.rangeBackgroundFull} />}

              {/* Active Circle or Standard cell */}
              {isSelected ? (
                <View style={styles.activeCircle}>
                  <Text style={styles.dayTextActive}>
                    {day.dayNumber}
                  </Text>
                  {isMarked && <View style={styles.dotActive} />}
                </View>
              ) : (
                <View style={styles.innerCell}>
                  <Text
                    style={[
                      styles.dayText,
                      isInRange ? styles.dayTextInRange : null,
                      !day.inCurrentMonth ? styles.dayMuted : null,
                      isWeekend && day.inCurrentMonth ? styles.weekendText : null,
                    ]}>
                    {day.dayNumber}
                  </Text>
                  {isMarked && <View style={styles.dot} />}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dayCell: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: '14.285%',
    position: 'relative',
  },
  innerCell: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  activeCircle: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    width: 42,
    zIndex: 2,
  },
  rangeBackgroundRight: {
    backgroundColor: 'rgba(102, 92, 255, 0.12)',
    bottom: 6,
    left: '50%',
    position: 'absolute',
    right: 0,
    top: 6,
    zIndex: 1,
  },
  rangeBackgroundLeft: {
    backgroundColor: 'rgba(102, 92, 255, 0.12)',
    bottom: 6,
    left: 0,
    position: 'absolute',
    right: '50%',
    top: 6,
    zIndex: 1,
  },
  rangeBackgroundFull: {
    backgroundColor: 'rgba(102, 92, 255, 0.12)',
    bottom: 6,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 6,
    zIndex: 1,
  },
  dayTextInRange: {
    color: '#665CFF',
    fontWeight: '700',
  },
  dayMuted: {
    color: '#A8AFBB',
  },
  dayText: {
    color: '#1F2937',
    fontSize: 20,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  dot: {
    backgroundColor: '#63D997',
    borderRadius: 4,
    height: 6,
    marginTop: 4,
    width: 6,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    height: 6,
    marginTop: 4,
    width: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  weekendLabel: {
    color: '#FF2D24',
  },
  weekendText: {
    color: '#FF2D24',
  },
  weekLabel: {
    color: '#4B5563',
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  wrapper: {
    marginTop: 34,
  },
});
