import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSettings } from '@/src/features/settings/store/appSettings.store';

export default function ConfirmationSettingsRoute() {
  const { settings, updateAppSettings } = useAppSettings();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Kembali" onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Konfirmasi Agenda</Text>
        <View style={styles.iconSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.cardTitle}>Form konfirmasi AI</Text>
              <Text style={styles.cardSubtitle}>
                Jika aktif, hasil prompt akan membuka form review. Jika mati, agenda langsung disimpan dan ZAID membalas lewat chat.
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 16, borderWidth: 1, padding: 18 },
  cardSubtitle: { color: '#6B7280', fontSize: 13, lineHeight: 20, marginTop: 6 },
  cardTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  content: { padding: 24 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  iconButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  iconSpacer: { width: 40 },
  knob: { backgroundColor: '#FFFFFF', borderRadius: 9, height: 18, transform: [{ translateX: 2 }], width: 18 },
  knobOn: { transform: [{ translateX: 22 }] },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rowText: { flex: 1, paddingRight: 14 },
  safeArea: { backgroundColor: '#FAFAFB', flex: 1 },
  switch: { backgroundColor: '#D1D5DB', borderRadius: 14, height: 24, justifyContent: 'center', width: 44 },
  switchOn: { backgroundColor: '#665CFF' },
  title: { color: '#111827', fontSize: 18, fontWeight: '800' },
});
