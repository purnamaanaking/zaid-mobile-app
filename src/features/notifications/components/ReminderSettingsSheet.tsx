import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReminderOption } from '@/src/features/notifications/types';

type ReminderSettingsSheetProps = {
  onClose: () => void;
  onSelectReminder: (minutes: number) => void;
  options: ReminderOption[];
  selectedMinutes: number;
  visible: boolean;
};

export function ReminderSettingsSheet({
  onClose,
  onSelectReminder,
  options,
  selectedMinutes,
  visible,
}: ReminderSettingsSheetProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Pressable accessibilityLabel="Tutup pengaturan pengingat" onPress={onClose} style={styles.backdrop}>
        <Pressable style={styles.sheet}>
          <Text style={styles.title}>Pengaturan Pengingat</Text>
          <Text style={styles.subtitle}>Pilih kapan ZAID mengingatkanmu sebelum jadwal dimulai.</Text>
          <View style={styles.options}>
            {options.map((option) => {
              const active = option.minutes === selectedMinutes;

              return (
                <Pressable
                  accessibilityLabel={`Atur pengingat ${option.label}`}
                  accessibilityRole="button"
                  key={option.minutes}
                  onPress={() => onSelectReminder(option.minutes)}
                  style={[styles.option, active ? styles.optionActive : null]}>
                  <Text style={[styles.optionText, active ? styles.optionTextActive : null]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionMeta, active ? styles.optionTextActive : null]}>
                    {option.minutes >= 1440
                      ? 'Cocok untuk jadwal penting'
                      : 'Cocok untuk tugas harian'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  option: {
    backgroundColor: '#F3F5FA',
    borderRadius: 14,
    padding: 14,
  },
  optionActive: {
    backgroundColor: '#665CFF',
  },
  optionMeta: {
    color: '#8F9AAF',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 5,
  },
  optionText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  options: {
    gap: 10,
    marginTop: 20,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 34,
  },
  subtitle: {
    color: '#8F9AAF',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 8,
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '600',
  },
});
