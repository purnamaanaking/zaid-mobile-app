import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CalendarScheduleCard } from '@/src/features/calendar/components/CalendarScheduleCard';
import { formatFullDate } from '@/src/features/calendar/utils/date';
import { PromptSchedule } from '@/src/types/schedule.types';
import { ReminderFields } from '@/src/features/reminders/components/ReminderFields';
import { ReminderChannel } from '@/src/services/api/reminder.api';
import { validateScheduleFields } from '@/src/utils/scheduleValidation';

type CalendarTaskSheetProps = {
  editingScheduleId: string | null;
  endDate: string | null;
  onAddSchedule: (schedule: PromptSchedule) => void;
  onClose: () => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onEditSchedule: (scheduleId: string) => void;
  schedules: PromptSchedule[];
  startDate: string | null;
  visible: boolean;
};

export function CalendarTaskSheet({
  editingScheduleId,
  endDate,
  onAddSchedule,
  onClose,
  onDeleteSchedule,
  onEditSchedule,
  schedules,
  startDate,
  visible,
}: CalendarTaskSheetProps) {
  const slideAnim = useRef(new Animated.Value(420)).current;
  const dragAnim = useRef(new Animated.Value(0)).current;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isAdding, setAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftTime, setDraftTime] = useState('09:00');
  const [draftEndTime, setDraftEndTime] = useState('10:00');
  const [draftDescription, setDraftDescription] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>('whatsapp');

  const title = useMemo(() => {
    if (!startDate) return 'Selected tasks';
    if (endDate && endDate !== startDate) {
      return `${formatFullDate(startDate)} - ${formatFullDate(endDate)}`;
    }
    return formatFullDate(startDate);
  }, [endDate, startDate]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          dragAnim.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 90 || gesture.vy > 0.8) {
            onClose();
            return;
          }

          Animated.spring(dragAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragAnim, onClose]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const s2 = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  useEffect(() => {
    if (visible) {
      dragAnim.setValue(0);
      Animated.spring(slideAnim, {
        damping: 24,
        mass: 0.9,
        stiffness: 220,
        toValue: 0,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(slideAnim, {
      duration: 180,
      toValue: 420,
      useNativeDriver: true,
    }).start();
  }, [dragAnim, slideAnim, visible]);

  useEffect(() => {
    if (!visible) {
      setAdding(false);
    }
  }, [visible]);

  function handleSaveManualSchedule() {
    if (!startDate || !draftTitle.trim()) return;

    const problems = validateScheduleFields({
      date: startDate,
      endDate: endDate && endDate !== startDate ? endDate : undefined,
      time: draftTime,
      endTime: draftEndTime,
    });

    if (problems.length) {
      Alert.alert('Periksa input', problems.join('\n'));
      return;
    }

    const now = new Date();
    const schedule: PromptSchedule = {
      id: `manual-${now.getTime()}`,
      userId: 'user-1',
      title: draftTitle.trim(),
      date: startDate,
      endDate: endDate && endDate !== startDate ? endDate : undefined,
      time: draftTime || '09:00',
      endTime: draftEndTime || '10:00',
      location: 'Manual Schedule',
      description: draftDescription.trim(),
      reminderMinutes,
      reminderEnabled,
      reminderChannel,
      status: 'active',
      recurring: 'none',
      sourcePrompt: 'Manual entry',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    onAddSchedule(schedule);
    setDraftTitle('');
    setDraftTime('09:00');
    setDraftEndTime('10:00');
    setDraftDescription('');
    setReminderEnabled(false);
    setReminderMinutes(30);
    setReminderChannel('whatsapp');
    setAdding(false);
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kbv}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close selected tasks" style={styles.backdropPressable} onPress={onClose} />
        <Animated.View
            style={[
              styles.sheet,
              { maxHeight: isKeyboardVisible ? '55%' : '78%' },
              {
                transform: [
                  {
                    translateY: Animated.add(slideAnim, dragAnim),
                  },
                ],
              },
            ]}>
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.eyebrow}>Selected date</Text>
              <Text numberOfLines={1} style={styles.title}>
                {title}
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{schedules.length}</Text>
            </View>
            <Pressable
              accessibilityLabel="Add manual task"
              accessibilityRole="button"
              onPress={() => setAdding((current) => !current)}
              style={styles.addButton}>
              <MaterialIcons name={isAdding ? 'remove' : 'add'} color="#FFFFFF" size={22} />
            </Pressable>
            <Pressable
              accessibilityLabel="Close task sheet"
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}>
              <MaterialIcons name="close" color="#6B7280" size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {isAdding ? (
              <View style={styles.manualCard}>
                <View style={styles.manualHeader}>
                  <Text style={styles.manualTitle}>Add task manually</Text>
                  <Text style={styles.manualSubtitle}>Saved to the selected calendar range.</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    onChangeText={setDraftTitle}
                    placeholder="Task title"
                    placeholderTextColor="#9CA3AF"
                    style={styles.textInput}
                    value={draftTitle}
                  />
                </View>

                <View style={styles.timeRow}>
                  <View style={[styles.inputGroup, styles.timeInput]}>
                    <Text style={styles.inputLabel}>Start</Text>
                    <TextInput
                      onChangeText={setDraftTime}
                      placeholder="09:00"
                      placeholderTextColor="#9CA3AF"
                      style={styles.textInput}
                      value={draftTime}
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.timeInput]}>
                    <Text style={styles.inputLabel}>End</Text>
                    <TextInput
                      onChangeText={setDraftEndTime}
                      placeholder="10:00"
                      placeholderTextColor="#9CA3AF"
                      style={styles.textInput}
                      value={draftEndTime}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    multiline
                    onChangeText={setDraftDescription}
                    placeholder="Optional details"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.textInput, styles.textArea]}
                    value={draftDescription}
                  />
                </View>

                <ReminderFields
                  channel={reminderChannel}
                  enabled={reminderEnabled}
                  minutes={reminderMinutes}
                  onChangeChannel={setReminderChannel}
                  onChangeEnabled={setReminderEnabled}
                  onChangeMinutes={setReminderMinutes}
                />

                <View style={styles.formActions}>
                  <Pressable
                    accessibilityLabel="Cancel manual task"
                    accessibilityRole="button"
                    onPress={() => setAdding(false)}
                    style={[styles.formButton, styles.cancelButton]}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Save manual task"
                    accessibilityRole="button"
                    disabled={!draftTitle.trim()}
                    onPress={handleSaveManualSchedule}
                    style={[styles.formButton, styles.saveButton, !draftTitle.trim() ? styles.saveButtonDisabled : null]}>
                    <MaterialIcons name="check" color="#FFFFFF" size={16} />
                    <Text style={styles.saveText}>Save Task</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {schedules.length > 0 ? (
              schedules.map((schedule) => (
                <CalendarScheduleCard
                  isEditing={editingScheduleId === schedule.id}
                  key={schedule.id}
                  onDelete={() => onDeleteSchedule(schedule.id)}
                  onEdit={() => onEditSchedule(schedule.id)}
                  schedule={schedule}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <MaterialIcons name="event-busy" color="#665CFF" size={28} />
                <Text style={styles.emptyTitle}>No task for this date</Text>
                <Text style={styles.emptyText}>Tasks created from AI prompts will appear here.</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  backdrop: {
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    minWidth: 30,
    paddingHorizontal: 9,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dragArea: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 10,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#F7F7FF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  emptyText: {
    color: '#8B95A8',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  eyebrow: {
    color: '#98A1B5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  handle: {
    backgroundColor: '#D6DAE4',
    borderRadius: 999,
    height: 5,
    width: 48,
  },
  kbv: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  formButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  manualCard: {
    backgroundColor: '#F8F7FF',
    borderColor: '#E8E6FF',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  manualHeader: {
    marginBottom: 12,
  },
  manualSubtitle: {
    color: '#8B95A8',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 3,
  },
  manualTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  saveButton: {
    backgroundColor: '#665CFF',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '78%',
    minHeight: 300,
    overflow: 'hidden',
    paddingBottom: 4,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  timeInput: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 3,
  },
  titleBlock: {
    flex: 1,
  },
});
