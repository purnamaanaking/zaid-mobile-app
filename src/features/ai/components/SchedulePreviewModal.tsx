import { MaterialIcons } from '@expo/vector-icons';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { RecurringOption } from '@/src/features/ai/types';
import { PromptSchedule } from '@/src/types/schedule.types';
import { ReminderFields } from '@/src/features/reminders/components/ReminderFields';
import { validateScheduleFields } from '@/src/utils/scheduleValidation';

const RECURRING_OPTIONS: { label: string; value: RecurringOption }[] = [
  { label: 'Tanpa Ulang', value: 'none' },
  { label: 'Harian', value: 'daily' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' },
];

type SchedulePreviewModalProps = {
  onChangeSchedule: (patch: Partial<PromptSchedule>) => void;
  onClose: () => void;
  onSave: () => void;
  schedule: PromptSchedule | null;
  visible: boolean;
};

export function SchedulePreviewModal({
  onChangeSchedule,
  onClose,
  onSave,
  schedule,
  visible,
}: SchedulePreviewModalProps) {
  function handleSavePress() {
    if (!schedule) return;
    const problems = validateScheduleFields(schedule);
    if (problems.length) {
      Alert.alert('Periksa input', problems.join('\n'));
      return;
    }
    onSave();
  }

  if (!schedule) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      navigationBarTranslucent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Tutup pratinjau jadwal"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          pointerEvents="box-none"
          style={styles.keyboardView}>
          <View style={styles.card}>
            {/* Header with Sparkle Icon and Close */}
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.sparkleBadge}>
                  <MaterialIcons name="auto-awesome" color="#FFFFFF" size={14} />
                  <Text style={styles.sparkleText}>Ekstraksi AI</Text>
                </View>
                <Text style={styles.title}>Jadwal Terdeteksi</Text>
              </View>
              <Pressable accessibilityLabel="Tutup modal" onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" color="#9CA3AF" size={22} />
              </Pressable>
            </View>

            <Text style={styles.subtitle}>
              Tinjau dan sesuaikan kolom kalender hasil ekstraksi di bawah.
            </Text>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={styles.scrollArea}>
              {/* Title Field */}
              <Field
                icon="title"
                label="Judul Aktivitas"
                onChangeText={(title) => onChangeSchedule({ title })}
                value={schedule.title}
                placeholder="cth. Meeting Client"
              />

              {/* Date Range Row */}
              <View style={styles.fieldRow}>
                <Field
                  icon="event"
                  label="Tanggal Mulai"
                  onChangeText={(date) => onChangeSchedule({ date })}
                  value={schedule.date}
                  placeholder="YYYY-MM-DD"
                  containerStyle={{ flex: 1 }}
                />
                <Field
                  icon="event"
                  label="Tanggal Selesai (Opsional)"
                  onChangeText={(endDate) => onChangeSchedule({ endDate: endDate || undefined })}
                  value={schedule.endDate ?? ''}
                  placeholder="YYYY-MM-DD"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              {/* Time Range Row */}
              <View style={styles.fieldRow}>
                <Field
                  icon="schedule"
                  label="Jam Mulai"
                  onChangeText={(time) => onChangeSchedule({ time })}
                  value={schedule.time}
                  placeholder="HH:mm"
                  containerStyle={{ flex: 1 }}
                />
                <Field
                  icon="schedule"
                  label="Jam Selesai"
                  onChangeText={(endTime) => onChangeSchedule({ endTime })}
                  value={schedule.endTime}
                  placeholder="HH:mm"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              {/* Description Field */}
              <Field
                icon="notes"
                label="Deskripsi"
                multiline
                numberOfLines={3}
                onChangeText={(description) => onChangeSchedule({ description })}
                value={schedule.description ?? ''}
                placeholder="Tulis catatan deskripsi..."
                inputStyle={styles.multilineInput}
              />

              <ReminderFields
                channel={schedule.reminderChannel ?? 'whatsapp'}
                enabled={schedule.reminderEnabled ?? false}
                minutes={schedule.reminderMinutes}
                onChangeChannel={(reminderChannel) => onChangeSchedule({ reminderChannel })}
                onChangeEnabled={(reminderEnabled) => onChangeSchedule({ reminderEnabled })}
                onChangeMinutes={(reminderMinutes) => onChangeSchedule({ reminderMinutes })}
              />

              {/* Recurring Section */}
              <View style={styles.recurringSection}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons name="repeat" color="#665CFF" size={16} />
                  <Text style={styles.sectionLabel}>Interval Pengulangan</Text>
                </View>
                <View style={styles.recurringRow}>
                  {RECURRING_OPTIONS.map((option) => {
                    const active = schedule.recurring === option.value;

                    return (
                      <Pressable
                        accessibilityLabel={`Atur pengulangan ${option.label}`}
                        accessibilityRole="button"
                        key={option.value}
                        onPress={() => onChangeSchedule({ recurring: option.value })}
                        style={[styles.recurringPill, active ? styles.recurringPillActive : null]}>
                        <Text style={[styles.recurringText, active ? styles.recurringTextActive : null]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Edit Nanti</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={handleSavePress} style={styles.primaryButton}>
                <MaterialIcons name="check-circle" color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                <Text style={styles.primaryText}>Simpan Jadwal</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Field({
  icon,
  label,
  onChangeText,
  value,
  placeholder,
  multiline = false,
  numberOfLines,
  containerStyle,
  inputStyle,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  containerStyle?: object;
  inputStyle?: object;
}) {
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrapper}>
        <MaterialIcons name={icon} color="#9CA3AF" size={18} style={styles.fieldIcon} />
        <TextInput
          onChangeText={onChangeText}
          style={[styles.fieldInput, inputStyle]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    maxHeight: '85%',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    alignSelf: 'flex-start',
    gap: 3,
    marginBottom: 6,
  },
  sparkleText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  scrollContainer: {
    paddingBottom: 16,
  },
  scrollArea: {
    flexShrink: 1,
  },
  fieldContainer: {
    marginTop: 12,
  },
  fieldLabel: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    paddingLeft: 2,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    height: 44,
  },
  multilineInput: {
    height: 64,
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recurringSection: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  recurringRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recurringPill: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recurringPillActive: {
    backgroundColor: '#665CFF',
    borderColor: '#665CFF',
  },
  recurringText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  recurringTextActive: {
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 12,
    flex: 1.3,
    height: 48,
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    flex: 1,
    height: 48,
    justifyContent: 'center',
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  secondaryText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
});
