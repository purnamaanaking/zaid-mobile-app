import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ReminderChannel } from '@/src/services/api/reminder.api';

const PRESETS = [
  { label: '15 menit', value: 15 },
  { label: '30 menit', value: 30 },
  { label: '1 jam', value: 60 },
  { label: '1 hari', value: 1440 },
];

const CHANNELS: { label: string; value: ReminderChannel }[] = [
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'App', value: 'app' },
  { label: 'WA + App', value: 'both' },
];

type ReminderFieldsProps = {
  channel: ReminderChannel;
  enabled: boolean;
  minutes: number;
  onChangeChannel: (channel: ReminderChannel) => void;
  onChangeEnabled: (enabled: boolean) => void;
  onChangeMinutes: (minutes: number) => void;
};

export function ReminderFields({
  channel,
  enabled,
  minutes,
  onChangeChannel,
  onChangeEnabled,
  onChangeMinutes,
}: ReminderFieldsProps) {
  const custom = !PRESETS.some((preset) => preset.value === minutes);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Reminder</Text>
          <Text style={styles.helper}>Item wajib punya tanggal dan jam.</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: enabled }}
          onPress={() => onChangeEnabled(!enabled)}
          style={[styles.toggle, enabled ? styles.toggleOn : null]}>
          <View style={[styles.knob, enabled ? styles.knobOn : null]} />
        </Pressable>
      </View>

      {enabled ? (
        <>
          <Text style={styles.label}>Waktu</Text>
          <View style={styles.options}>
            {PRESETS.map((preset) => (
              <Option
                active={!custom && minutes === preset.value}
                key={preset.value}
                label={preset.label}
                onPress={() => onChangeMinutes(preset.value)}
              />
            ))}
            <Option active={custom} label="Custom" onPress={() => custom || onChangeMinutes(10)} />
          </View>
          {custom ? (
            <TextInput
              accessibilityLabel="Custom reminder minutes"
              keyboardType="number-pad"
              onChangeText={(value) => onChangeMinutes(Math.max(1, Number(value) || 1))}
              placeholder="Menit sebelumnya"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={String(minutes)}
            />
          ) : null}

          <Text style={styles.label}>Channel</Text>
          <View style={styles.options}>
            {CHANNELS.map((option) => (
              <Option
                active={channel === option.value}
                key={option.value}
                label={option.label}
                onPress={() => onChangeChannel(option.value)}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function Option({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, active ? styles.optionActive : null]}>
      <Text style={[styles.optionText, active ? styles.optionTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerText: { flex: 1 },
  helper: { color: '#8B95A8', fontSize: 11, marginTop: 3 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 12, borderWidth: 1, color: '#111827', marginTop: 10, paddingHorizontal: 13, paddingVertical: 10 },
  knob: { backgroundColor: '#FFFFFF', borderRadius: 8, height: 16, transform: [{ translateX: 2 }], width: 16 },
  knobOn: { transform: [{ translateX: 20 }] },
  label: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 7, marginTop: 14, textTransform: 'uppercase' },
  option: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 10, borderWidth: 1, minHeight: 38, paddingHorizontal: 12, justifyContent: 'center' },
  optionActive: { backgroundColor: '#665CFF', borderColor: '#665CFF' },
  optionText: { color: '#596173', fontSize: 12, fontWeight: '700' },
  optionTextActive: { color: '#FFFFFF' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  section: { backgroundColor: '#F8F7FF', borderColor: '#E8E6FF', borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 13 },
  title: { color: '#111827', fontSize: 14, fontWeight: '800' },
  toggle: { backgroundColor: '#D1D5DB', borderRadius: 12, height: 20, justifyContent: 'center', width: 40 },
  toggleOn: { backgroundColor: '#665CFF' },
});
