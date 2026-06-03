import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ProfileSetting } from '@/src/features/profile/types';

export function ProfileSettingGroup({ items }: { items: ProfileSetting[] }) {
  return (
    <View style={styles.group}>
      {items.map((item) => (
        <Pressable
          accessibilityLabel={item.title}
          accessibilityRole="button"
          key={item.title}
          style={styles.row}>
          <View style={styles.iconCircle}>
            <MaterialIcons name={item.icon} color="#665CFF" size={21} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>{item.title}</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          </View>
          {item.hasAlert ? <MaterialIcons name="warning" color="#FF5F67" size={18} /> : null}
          {item.type === 'toggle' ? (
            <Switch
              accessibilityLabel={`${item.title} toggle`}
              thumbColor="#A9A9A9"
              trackColor={{ false: '#E1E1E1', true: '#D7D3FF' }}
              value={false}
            />
          ) : (
            <MaterialIcons name="chevron-right" color="#A6A6A6" size={28} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    color: '#A4A4A4',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#F5F4FF',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    minHeight: 54,
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
  },
});
