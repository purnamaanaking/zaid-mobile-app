import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { ProfileHeaderCard } from '@/src/features/profile/components/ProfileHeaderCard';
import { useAuthStore } from '@/src/store/auth.store';
import { PreferencesTheme, useAppSettings } from '@/src/features/settings/store/appSettings.store';
import { useAppTheme } from '@/src/theme/useAppTheme';

const THEME_OPTIONS: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: PreferencesTheme }[] = [
  { icon: 'brightness-auto', label: 'Sistem', value: 'system' },
  { icon: 'light-mode', label: 'Terang', value: 'light' },
  { icon: 'dark-mode', label: 'Gelap', value: 'dark' },
];

const PROFILE_MENUS: { icon: keyof typeof MaterialIcons.glyphMap; route: Href; title: string }[] = [
  { icon: 'person-outline', route: '/(app)/settings-profile' as Href, title: 'Pengaturan Profil' },
  { icon: 'notifications-none', route: '/(app)/settings-notifications' as Href, title: 'Pengaturan Notifikasi' },
];

export function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { settings, updateAppSettings } = useAppSettings();
  const theme = useAppTheme();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgSecondary }]}>
      <View style={styles.backHeader}>
        <Pressable
          accessibilityLabel="Kembali ke halaman utama"
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/ai')}
          style={({ pressed }) => [styles.backButton, pressed ? { opacity: 0.7 } : null]}>
          <MaterialIcons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Pengaturan</Text>
        <View style={styles.backSpacer} />
      </View>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <ProfileHeaderCard />

        <View style={styles.settingsSection}>
          {PROFILE_MENUS.map((item) => (
            <Pressable
              key={item.title}
              accessibilityLabel={item.title}
              accessibilityRole="button"
              onPress={() => router.push(item.route)}
              style={({ pressed }) => [styles.menuItem, pressed ? { opacity: 0.7 } : null]}>
              <MaterialIcons name={item.icon} size={22} color="#374151" />
              <Text style={styles.menuText}>{item.title}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#D1D5DB" style={{ marginLeft: 'auto' }} />
            </Pressable>
          ))}
          <View style={styles.menuItem}>
            <MaterialIcons name="check-circle-outline" size={22} color="#374151" />
            <View style={styles.confirmRow}>
              <Text style={styles.menuText}>Form konfirmasi agenda</Text>
              <Text style={styles.confirmHint}>
                {settings.agendaConfirmationEnabled ? 'Aktif — hasil prompt buka form review' : 'Nonaktif — agenda langsung disimpan'}
              </Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: settings.agendaConfirmationEnabled }}
              onPress={() => updateAppSettings({ agendaConfirmationEnabled: !settings.agendaConfirmationEnabled })}
              style={[styles.switch, settings.agendaConfirmationEnabled ? styles.switchOn : null]}>
              <View style={[styles.knob, settings.agendaConfirmationEnabled ? styles.knobOn : null]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.menuItem, { borderBottomColor: '#F3F4F6', borderBottomWidth: 1 }, styles.sectionLabel]}>Tampilan</Text>
          {THEME_OPTIONS.map((option) => {
            const active = settings.theme === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityLabel={option.label}
                accessibilityRole="button"
                onPress={() => updateAppSettings({ theme: option.value })}
                style={[styles.menuItem, active ? styles.menuItemActive : null]}>
                <MaterialIcons name={option.icon} size={22} color={active ? '#665CFF' : '#374151'} />
                <Text style={[styles.menuText, active ? styles.menuTextActive : null]}>{option.label}</Text>
                {active ? <MaterialIcons name="check" size={20} color="#665CFF" style={{ marginLeft: 'auto' }} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityLabel="Keluar dari aplikasi"
          accessibilityRole="button"
          onPress={handleLogout}
          style={styles.logoutButton}>
          <MaterialIcons name="logout" color="#EF4444" size={20} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backSpacer: {
    width: 40,
  },
  content: {
    gap: 24,
    paddingBottom: 48,
    paddingHorizontal: 26,
    paddingTop: 16,
  },
  pageTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
  },
  menuText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  menuTextActive: {
    color: '#665CFF',
    fontWeight: '600',
  },
  menuItemActive: {
    backgroundColor: '#F3F1FF',
  },
  sectionLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  confirmRow: {
    flex: 1,
    marginRight: 8,
  },
  confirmHint: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  switch: {
    backgroundColor: '#D1D5DB',
    borderRadius: 14,
    height: 24,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 44,
  },
  switchOn: {
    backgroundColor: '#665CFF',
  },
  knob: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    height: 18,
    transform: [{ translateX: 2 }],
    width: 18,
  },
  knobOn: {
    transform: [{ translateX: 22 }],
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
