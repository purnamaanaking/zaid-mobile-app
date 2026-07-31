import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSettings, WeeklyReminderDay } from '@/src/features/settings/store/appSettings.store';

const DAYS: { label: string; value: WeeklyReminderDay }[] = [
  { label: 'Sen', value: 'monday' },
  { label: 'Sel', value: 'tuesday' },
  { label: 'Rab', value: 'wednesday' },
  { label: 'Kam', value: 'thursday' },
  { label: 'Jum', value: 'friday' },
  { label: 'Sab', value: 'saturday' },
  { label: 'Min', value: 'sunday' },
];

export default function NotificationSettingsRoute() {
  const { settings, updateAppSettings } = useAppSettings();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kbv}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Kembali" onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text style={styles.title}>Pengaturan Notifikasi</Text>
          <View style={styles.iconSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.cardTitle}>Weekly reminder</Text>
                <Text style={styles.cardSubtitle}>Pengingat mingguan untuk cek agenda.</Text>
              </View>
              <Switch
                enabled={settings.weeklyReminderEnabled}
                onPress={() => updateAppSettings({ weeklyReminderEnabled: !settings.weeklyReminderEnabled })}
              />
            </View>

            <Text style={styles.label}>Hari</Text>
            <View style={styles.days}>
              {DAYS.map((day) => (
                <Pressable
                  key={day.value}
                  onPress={() => updateAppSettings({ weeklyReminderDay: day.value })}
                  style={[styles.dayPill, settings.weeklyReminderDay === day.value ? styles.dayPillActive : null]}>
                  <Text style={[styles.dayText, settings.weeklyReminderDay === day.value ? styles.dayTextActive : null]}>{day.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Jam reminder</Text>
            <TextInput
              keyboardType="numbers-and-punctuation"
              onChangeText={(weeklyReminderTime) => updateAppSettings({ weeklyReminderTime })}
              placeholder="08:00"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={settings.weeklyReminderTime}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Switch({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: enabled }} onPress={onPress} style={[styles.switch, enabled ? styles.switchOn : null]}>
      <View style={[styles.knob, enabled ? styles.knobOn : null]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 16, borderWidth: 1, padding: 18 },
  cardSubtitle: { color: '#6B7280', fontSize: 13, lineHeight: 19, marginTop: 4 },
  cardTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  content: { padding: 24 },
  dayPill: { alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 11, minHeight: 40, minWidth: 42, justifyContent: 'center', paddingHorizontal: 10 },
  dayPillActive: { backgroundColor: '#665CFF' },
  dayText: { color: '#4B5563', fontSize: 12, fontWeight: '800' },
  dayTextActive: { color: '#FFFFFF' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  iconButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  iconSpacer: { width: 40 },
  input: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderRadius: 12, borderWidth: 1, color: '#111827', fontSize: 15, fontWeight: '700', minHeight: 46, paddingHorizontal: 14 },
  kbv: { flex: 1 },
  knob: { backgroundColor: '#FFFFFF', borderRadius: 9, height: 18, transform: [{ translateX: 2 }], width: 18 },
  knobOn: { transform: [{ translateX: 22 }] },
  label: { color: '#374151', fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 18, textTransform: 'uppercase' },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rowText: { flex: 1, paddingRight: 12 },
  safeArea: { backgroundColor: '#FAFAFB', flex: 1 },
  switch: { backgroundColor: '#D1D5DB', borderRadius: 14, height: 24, justifyContent: 'center', width: 44 },
  switchOn: { backgroundColor: '#665CFF' },
  title: { color: '#111827', fontSize: 18, fontWeight: '800' },
});
