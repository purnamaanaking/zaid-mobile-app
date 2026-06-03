import { Pressable, StyleSheet, Text, View } from 'react-native';

type DashboardFilterPillProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

export function DashboardFilterPill({ active, label, onPress }: DashboardFilterPillProps) {
  return (
    <Pressable
      accessibilityLabel={`Filter ${label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterPill, active ? styles.filterPillActive : null]}>
      {active ? <View style={styles.filterDot} /> : null}
      <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterDot: {
    backgroundColor: '#FF8B73',
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
  filterText: {
    color: '#98A1B5',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
});
