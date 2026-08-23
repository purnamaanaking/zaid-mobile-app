import { useCallback, useMemo, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarDay } from '@/src/features/calendar/types';
import { WEEKDAY_LABELS } from '@/src/features/calendar/utils/date';

type CalendarGridProps = {
  days: CalendarDay[];
  markedDates: Set<string>;
  onRangeChange: (startDate: string, endDate: string) => void;
  onRangeComplete: (startDate: string, endDate: string) => void;
  onTap: (date: string) => void;
  startDate: string | null;
  endDate: string | null;
};

const DRAG_ACTIVATION_PX = 15;
const HORIZONTAL_BIAS = 2;

export function CalendarGrid({
  days,
  markedDates,
  onRangeChange,
  onRangeComplete,
  onTap,
  startDate,
  endDate,
}: CalendarGridProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const dragStartDate = useRef<string | null>(null);
  const dragEndDate = useRef<string | null>(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  const getDateFromEvent = useCallback((event: GestureResponderEvent) => {
    if (!gridWidth) return null;

    const cellWidth = gridWidth / 7;
    const column = Math.max(0, Math.min(6, Math.floor(event.nativeEvent.locationX / cellWidth)));
    const row = Math.max(0, Math.min(5, Math.floor(event.nativeEvent.locationY / 54)));
    const index = row * 7 + column;

    return days[index]?.dateKey ?? null;
  }, [days, gridWidth]);

  const normalizeRange = useCallback((from: string, to: string) => {
    return from <= to ? [from, to] : [to, from];
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          const absX = Math.abs(gesture.dx);
          const absY = Math.abs(gesture.dy);
          return absX > DRAG_ACTIVATION_PX && absX > absY * HORIZONTAL_BIAS;
        },
        onPanResponderGrant: (event) => {
          const date = getDateFromEvent(event);
          if (!date) return;

          isDragging.current = false;
          hasMoved.current = false;
          dragStartDate.current = date;
          dragEndDate.current = date;
        },
        onPanResponderMove: (event) => {
          const from = dragStartDate.current;
          const to = getDateFromEvent(event);
          if (!from || !to || to === dragEndDate.current) return;

          hasMoved.current = true;
          isDragging.current = true;
          dragEndDate.current = to;
          const [rangeStart, rangeEnd] = normalizeRange(from, to);
          onRangeChange(rangeStart, rangeEnd);
        },
        onPanResponderRelease: (/* event */) => {
          const from = dragStartDate.current;
          const to = dragEndDate.current;

          if (!from) {
            cleanup();
            return;
          }

          if (!hasMoved.current) {
            cleanup();
            onTap(from);
            return;
          }

          if (!to) {
            cleanup();
            return;
          }

          cleanup();
          const [rangeStart, rangeEnd] = normalizeRange(from, to);
          onRangeComplete(rangeStart, rangeEnd);
        },
        onPanResponderTerminate: () => {
          cleanup();
        },
      }),
    [getDateFromEvent, normalizeRange, onRangeChange, onRangeComplete, onTap]
  );

  function cleanup() {
    dragStartDate.current = null;
    dragEndDate.current = null;
    isDragging.current = false;
    hasMoved.current = false;
  }

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

      <View
        {...panResponder.panHandlers}
        onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
        style={styles.grid}>
        {days.map((day) => {
          const isSelected = day.dateKey === startDate || day.dateKey === endDate;
          const isRangeStart = startDate && day.dateKey === startDate && endDate && endDate !== startDate;
          const isRangeEnd = endDate && day.dateKey === endDate && startDate && endDate !== startDate;
          const isInRange = startDate && endDate && day.dateKey > startDate && day.dateKey < endDate;
          const isMarked = markedDates.has(day.dateKey);
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

          return (
            <Pressable
              accessibilityLabel={`Pilih tanggal ${day.dateKey}`}
              accessibilityRole="button"
              key={day.dateKey}
              onPress={() => onTap(day.dateKey)}
              style={({ pressed }) => [styles.dayCell, pressed ? styles.dayCellPressed : null]}>
              
              {isRangeStart && <View style={styles.rangeBackgroundRight} />}
              {isRangeEnd && <View style={styles.rangeBackgroundLeft} />}
              {isInRange && <View style={styles.rangeBackgroundFull} />}

              {isSelected ? (
                <View style={styles.activeCircle}>
                  <Text style={styles.dayTextActive}>
                    {day.dayNumber}
                  </Text>
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
  dayCellPressed: {
    opacity: 0.72,
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
