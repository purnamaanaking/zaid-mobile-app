import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type AppTabKey = 'home' | 'schedule' | 'notification' | 'profile';

type AppBottomDockProps = {
  activeTab: AppTabKey;
};

const TAB_ITEMS: {
  icon: keyof typeof MaterialIcons.glyphMap;
  key: AppTabKey;
  label: string;
  route: Href;
}[] = [
  { icon: 'home', key: 'home', label: 'Home', route: '/' },
  { icon: 'calendar-month', key: 'schedule', label: 'Schedule', route: '/explore' },
  { icon: 'notifications', key: 'notification', label: 'Notification', route: '/notification' as Href },
  { icon: 'person', key: 'profile', label: 'Profile', route: '/profile' as Href },
];

export function AppBottomDock({ activeTab }: AppBottomDockProps) {
  const router = useRouter();

  return (
    <View pointerEvents="box-none" style={styles.bottomDockWrap}>
      <View style={styles.bottomDock}>
        {TAB_ITEMS.slice(0, 2).map((item) => (
          <NavItem
            active={item.key === activeTab}
            icon={item.icon}
            key={item.key}
            label={item.label}
            onPress={() => router.push(item.route)}
          />
        ))}
        <View style={styles.addButtonSpace} />
        {TAB_ITEMS.slice(2).map((item) => (
          <NavItem
            active={item.key === activeTab}
            icon={item.icon}
            key={item.key}
            label={item.label}
            onPress={() => router.push(item.route)}
          />
        ))}
      </View>
      <Pressable
        accessibilityLabel="Create schedule from AI prompt"
        accessibilityRole="button"
        onPress={() => router.push('/ai' as Href)}
        style={styles.fab}>
        <View style={styles.boltIconContainer}>
          <FontAwesome name="bolt" color="#000000" size={30} style={styles.boltOutline} />
          <FontAwesome name="bolt" color="#FFFFFF" size={24} style={styles.boltFill} />
        </View>
      </Pressable>
    </View>
  );
}

function NavItem({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.navItem}>
      <MaterialIcons name={icon} color={active ? '#675CFF' : '#9AA2B2'} size={25} />
      <Text style={[styles.navText, active ? styles.navTextActive : null]}>{label}</Text>
      {active ? <View style={styles.navIndicator} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  addButtonSpace: {
    width: 58,
  },
  boltFill: {
    position: 'absolute',
  },
  boltIconContainer: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  boltOutline: {
    position: 'absolute',
  },
  bottomDock: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 12,
    flexDirection: 'row',
    height: 74,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    shadowColor: '#1D2433',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  bottomDockWrap: {
    bottom: 24,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  fab: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 32,
    bottom: 38,
    elevation: 14,
    height: 64,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: '#665CFF',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    width: 64,
  },
  navIndicator: {
    backgroundColor: '#675CFF',
    borderRadius: 999,
    bottom: -8,
    height: 3,
    position: 'absolute',
    width: 38,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  navText: {
    color: '#9AA2B2',
    fontSize: 10,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#675CFF',
  },
});
