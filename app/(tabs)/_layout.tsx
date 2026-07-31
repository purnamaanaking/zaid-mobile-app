import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="notification" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI Assistant' }} />
    </Tabs>
  );
}
