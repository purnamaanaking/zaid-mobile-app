import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { AppBottomDock } from '@/src/features/navigation/components/AppBottomDock';
import { ProfileHeaderCard } from '@/src/features/profile/components/ProfileHeaderCard';
import { ProfileSettingGroup } from '@/src/features/profile/components/ProfileSettingGroup';
import { ProfileSetting } from '@/src/features/profile/types';
import { useAuthStore } from '@/src/store/auth.store';

const ACCOUNT_SETTINGS: ProfileSetting[] = [
  {
    description: 'Synced from your connected Google profile',
    hasAlert: false,
    icon: 'person-outline',
    title: 'My Account',
  },
  {
    description: 'Manage your device security',
    icon: 'lock-outline',
    title: 'Face ID / Touch ID',
    type: 'toggle',
  },
  {
    description: 'Further secure your account for safety',
    icon: 'shield',
    title: 'Two-Factor Authentication',
  },
];

const SUPPORT_SETTINGS: ProfileSetting[] = [
  { icon: 'notifications-none', title: 'Help & Support' },
  { icon: 'favorite-border', title: 'About App' },
];

export function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>
        <ProfileHeaderCard />
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <ProfileSettingGroup items={ACCOUNT_SETTINGS} />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <ProfileSettingGroup items={SUPPORT_SETTINGS} />
        </View>

        {/* Separated Logout button at the bottom */}
        <Pressable
          accessibilityLabel="Log out of application"
          accessibilityRole="button"
          onPress={handleLogout}
          style={styles.logoutButton}>
          <MaterialIcons name="logout" color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
      <AppBottomDock activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
    paddingBottom: 136,
    paddingHorizontal: 26,
    paddingTop: 56,
  },
  pageTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  settingsSection: {
    gap: 10,
  },
  sectionTitle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    paddingLeft: 4,
  },
  safeArea: {
    backgroundColor: '#FAFAFB',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    borderRadius: 14,
    height: 52,
    marginTop: 22,
    shadowColor: '#EF4444',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
