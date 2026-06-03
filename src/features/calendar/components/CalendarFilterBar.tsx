import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarFilter } from '@/src/features/calendar/types';

type CalendarFilterBarProps = {
  activeFilter: CalendarFilter;
  onChangeFilter: (filter: CalendarFilter) => void;
};

const FILTERS: { label: string; value: CalendarFilter }[] = [
  { label: 'Recent', value: 'recent' },
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
];

export function CalendarFilterBar({ activeFilter, onChangeFilter }: CalendarFilterBarProps) {
  return (
    <View style={styles.filterRow}>
      {FILTERS.map((filter) => {
        const active = filter.value === activeFilter;

        return (
          <Pressable
            accessibilityLabel={`Filter ${filter.label}`}
            accessibilityRole="button"
            key={filter.value}
            onPress={() => onChangeFilter(filter.value)}
            style={[styles.filterPill, active ? styles.filterPillActive : null]}>
            {active ? <View style={styles.filterDot} /> : null}
            <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filterDot: {
    backgroundColor: '#7BE38F',
    borderRadius: 5,
    height: 8,
    width: 8,
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: '#ECEFF4',
    borderRadius: 11,
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    height: 42,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#665CFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 26,
  },
  filterText: {
    color: '#98A1B5',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
});
