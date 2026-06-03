import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NotificationFilter } from '@/src/features/notifications/types';

const FILTERS: { label: string; value: NotificationFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
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
            style={[styles.pill, active ? styles.pillActive : null]}>
            <Text style={[styles.text, active ? styles.textActive : null]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    backgroundColor: '#EDEFF5',
    borderRadius: 12,
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#665CFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
    marginTop: 18,
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
