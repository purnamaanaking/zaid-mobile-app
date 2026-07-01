import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const attentionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(attentionAnim, {
          duration: 1100,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(attentionAnim, {
          duration: 900,
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [attentionAnim]);

  if (isKeyboardVisible) {
    return null;
  }

  const pulseStyle = {
    opacity: attentionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 0],
    }),
    transform: [
      {
        scale: attentionAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.6],
        }),
      },
    ],
  };
  const iconScaleStyle = {
    transform: [
      {
        scale: attentionAnim.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [1, 1.08, 1],
        }),
      },
    ],
  };

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
        <Animated.View pointerEvents="none" style={[styles.fabPulse, pulseStyle]} />
        <Animated.View style={[styles.aiIconContainer, iconScaleStyle]}>
          <MaterialCommunityIcons name="robot-happy" color="#FFFFFF" size={34} />
          <View style={styles.aiStatusDot} />
        </Animated.View>
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
  aiIconContainer: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  aiStatusDot: {
    backgroundColor: '#A7F3D0',
    borderColor: '#665CFF',
    borderRadius: 999,
    borderWidth: 2,
    height: 11,
    right: 4,
    top: 5,
    position: 'absolute',
    width: 11,
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
  fabPulse: {
    backgroundColor: '#665CFF',
    borderRadius: 44,
    height: 76,
    position: 'absolute',
    width: 76,
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
