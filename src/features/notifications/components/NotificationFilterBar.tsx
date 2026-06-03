import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NotificationFilter } from '@/src/features/notifications/types';

const FILTERS: { label: string; value: NotificationFilter; activeColor: string; dotColor: string }[] = [
  { label: 'All',      value: 'all',      activeColor: '#665CFF', dotColor: '#9992FF' },
  { label: 'Today',    value: 'today',    activeColor: '#EF4444', dotColor: '#FCA5A5' },
  { label: 'Upcoming', value: 'upcoming', activeColor: '#D97706', dotColor: '#FCD34D' },
];

export function NotificationFilterBar({
  activeFilter,
  onChangeFilter,
}: {
  activeFilter: NotificationFilter;
  onChangeFilter: (filter: NotificationFilter) => void;
}) {
  return (
    <View style={styles.row}>
      {FILTERS.map((filter) => {
        const active = filter.value === activeFilter;

        return (
          <Pressable
            accessibilityLabel={`Filter notifications ${filter.label}`}
            accessibilityRole="button"
            key={filter.value}
            onPress={() => onChangeFilter(filter.value)}
            style={[
              styles.pill,
              active ? { backgroundColor: filter.activeColor } : null,
            ]}>
            {active && <View style={[styles.dot, { backgroundColor: filter.dotColor }]} />}
            <Text style={[styles.text, active ? styles.textActive : null]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: 5,
    height: 7,
    width: 7,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: '#EDEFF5',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    height: 40,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  text: {
    color: '#8E99AE',
    fontSize: 13,
    fontWeight: '600',
  },
  textActive: {
    color: '#FFFFFF',
  },
});
