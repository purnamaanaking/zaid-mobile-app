import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatShortMonth } from '@/src/features/calendar/utils/date';
import { PromptSchedule } from '@/src/types/schedule.types';
import { updatePromptSchedule } from '@/src/features/schedule/store/promptScheduleStore';

type CalendarScheduleCardProps = {
  isEditing: boolean;
  onDelete: () => void;
  onEdit: () => void;
  schedule: PromptSchedule;
};

export function CalendarScheduleCard({
  isEditing,
  onDelete,
  onEdit,
  schedule,
}: CalendarScheduleCardProps) {
  // ── animasi masuk card ──────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  // ── animasi dropdown form edit ──────────────────────────────────────
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // ── state ───────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(schedule.title);
  const [draftDesc, setDraftDesc] = useState(schedule.description || '');
  const [draftDate, setDraftDate] = useState(schedule.date);
  const [draftTime, setDraftTime] = useState(schedule.time);
  const [draftEndTime, setDraftEndTime] = useState(schedule.endTime || '');

  // sync draft ketika isEditing berubah dari luar
  useEffect(() => {
    if (isEditing) {
      setDraftTitle(schedule.title);
      setDraftDesc(schedule.description || '');
      setDraftDate(schedule.date);
      setDraftTime(schedule.time);
      setDraftEndTime(schedule.endTime || '');
    }
  }, [isEditing, schedule]);

  // animasi dropdown form edit
  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: isEditing ? 1 : 0,
      duration: 320,
      useNativeDriver: false, // perlu false karena kita animate height
    }).start();
  }, [isEditing, dropdownAnim]);

  // animasi masuk card
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(15);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSave = () => {
    updatePromptSchedule(schedule.id, {
      title: draftTitle,
      description: draftDesc,
      date: draftDate,
      time: draftTime,
      endTime: draftEndTime,
    });
    onEdit(); // tutup editing
  };

  const handleMenuEdit = () => {
    setMenuOpen(false);
    onEdit(); // toggle isEditing dari parent
  };

  const handleMenuDelete = () => {
    setMenuOpen(false);
    onDelete();
  };

  const startDateNum = new Date(`${schedule.date}T00:00:00`).getDate();
  const isRange = schedule.endDate && schedule.endDate !== schedule.date;
  const endDateNum = isRange ? new Date(`${schedule.endDate}T00:00:00`).getDate() : null;

  // interpolasi tinggi dropdown form
  const formMaxHeight = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  });
  const formOpacity = dropdownAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        isEditing ? styles.cardEditing : null,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      {/* Accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.content}>
        {/* ── Title row ─────────────────────────────────────────── */}
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="event-note" color="#FF9F9F" size={14} />
          </View>
          <Text numberOfLines={1} style={styles.title}>
            {schedule.title}
          </Text>

          {/* Tanggal horizontal di kanan judul */}
          <View style={styles.dateBadge}>
            {isRange ? (
              <>
                <Text style={styles.dateText}>{startDateNum}</Text>
                <Text style={styles.dateSepText}>–</Text>
                <Text style={styles.dateText}>{endDateNum}</Text>
                <Text style={styles.dateMonthText}> {formatShortMonth(schedule.date)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.dateText}>{startDateNum}</Text>
                <Text style={styles.dateMonthText}> {formatShortMonth(schedule.date)}</Text>
              </>
            )}
          </View>

          {/* Tombol titik tiga */}
          <Pressable
            accessibilityLabel="More options"
            accessibilityRole="button"
            onPress={() => setMenuOpen((v) => !v)}
            style={styles.moreButton}>
            <MaterialIcons name="more-vert" color="#9AA5B8" size={20} />
          </Pressable>
        </View>

        {/* ── Context menu (muncul saat titik tiga ditekan) ─────── */}
        {menuOpen && (
          <View style={styles.contextMenu}>
            <Pressable
              accessibilityLabel={`Edit ${schedule.title}`}
              accessibilityRole="button"
              onPress={handleMenuEdit}
              style={styles.contextMenuItem}>
              <MaterialIcons name="edit" color="#665CFF" size={16} />
              <Text style={[styles.contextMenuText, { color: '#665CFF' }]}>Edit</Text>
            </Pressable>
            <View style={styles.contextMenuDivider} />
            <Pressable
              accessibilityLabel={`Delete ${schedule.title}`}
              accessibilityRole="button"
              onPress={handleMenuDelete}
              style={styles.contextMenuItem}>
              <MaterialIcons name="delete-outline" color="#FF5F67" size={16} />
              <Text style={[styles.contextMenuText, { color: '#FF5F67' }]}>Hapus</Text>
            </Pressable>
          </View>
        )}

        {/* ── Prompt ────────────────────────────────────────────── */}
        <Text numberOfLines={1} style={styles.promptText}>
          Prompt: {schedule.sourcePrompt}
        </Text>

        {/* ── Chip waktu & recurring ─────────────────────────────── */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <MaterialIcons name="alarm" color="#FFFFFF" size={13} />
            <Text style={styles.metaText}>
              {schedule.time} - {schedule.endTime}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <MaterialIcons name="sync" color="#FFFFFF" size={13} />
            <Text style={styles.metaText}>No Recurring</Text>
          </View>
        </View>

        {/* ── Dropdown form edit (animasi expand ke bawah) ────────── */}
        <Animated.View style={[styles.editDropdown, { maxHeight: formMaxHeight, opacity: formOpacity }]}>
          <View style={styles.editDivider} />

          <Text style={styles.editSectionLabel}>Edit Schedule</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Judul</Text>
            <TextInput
              style={styles.textInput}
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder="Schedule title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Deskripsi</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={draftDesc}
              onChangeText={setDraftDesc}
              placeholder="Add description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Tanggal</Text>
              <TextInput
                style={styles.textInput}
                value={draftDate}
                onChangeText={setDraftDate}
                placeholder="2026-06-03"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Mulai</Text>
              <TextInput
                style={styles.textInput}
                value={draftTime}
                onChangeText={setDraftTime}
                placeholder="09:00"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Selesai</Text>
              <TextInput
                style={styles.textInput}
                value={draftEndTime}
                onChangeText={setDraftEndTime}
                placeholder="10:00"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <Pressable
              accessibilityLabel="Cancel editing"
              accessibilityRole="button"
              onPress={onEdit}
              style={[styles.btnAction, styles.btnCancel]}>
              <MaterialIcons name="close" color="#6B7280" size={16} />
              <Text style={styles.btnCancelText}>Batal</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Save schedule changes"
              accessibilityRole="button"
              onPress={handleSave}
              style={[styles.btnAction, styles.btnSave]}>
              <MaterialIcons name="check" color="#FFFFFF" size={16} />
              <Text style={styles.btnSaveText}>Simpan</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    backgroundColor: '#665CFF',
    borderRadius: 999,
    bottom: 34,
    left: -4,
    position: 'absolute',
    top: 34,
    width: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 5,
    flexDirection: 'row',
    marginBottom: 20,
    minHeight: 136,
    shadowColor: '#95a4c3ff',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  cardEditing: {
    borderColor: '#665CFF',
    borderWidth: 1.5,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 14,
    paddingTop: 16,
  },

  // ── title row ──────────────────────────────────────────────────────
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#FFE9E9',
    borderRadius: 14,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  title: {
    color: '#121827',
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 6,
  },

  // ── tanggal horizontal ────────────────────────────────────────────
  dateBadge: {
    alignItems: 'center',
    backgroundColor: '#F5F4FF',
    borderRadius: 8,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateText: {
    color: '#665CFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dateSepText: {
    color: '#9AA5B8',
    fontSize: 11,
    fontWeight: '500',
    marginHorizontal: 2,
  },
  dateMonthText: {
    color: '#665CFF',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // ── tombol titik tiga ─────────────────────────────────────────────
  moreButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },

  // ── context menu ──────────────────────────────────────────────────
  contextMenu: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8EAF0',
    borderRadius: 12,
    borderWidth: 1,
    elevation: 12,
    overflow: 'hidden',
    position: 'absolute',
    right: 14,
    shadowColor: '#1D2433',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    top: 42,
    zIndex: 99,
  },
  contextMenuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contextMenuText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contextMenuDivider: {
    backgroundColor: '#F0F2F5',
    height: 1,
    marginHorizontal: 8,
  },

  // ── prompt & chips ────────────────────────────────────────────────
  promptText: {
    color: '#B2BBCB',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
  },
  metaChip: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    minHeight: 24,
    paddingHorizontal: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 12,
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  // ── dropdown form edit ────────────────────────────────────────────
  editDropdown: {
    overflow: 'hidden',
  },
  editDivider: {
    backgroundColor: '#EDF0F5',
    height: 1,
    marginBottom: 14,
    marginTop: 16,
  },
  editSectionLabel: {
    color: '#665CFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderWidth: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginBottom: 4,
    marginTop: 6,
  },
  btnAction: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnCancel: {
    backgroundColor: '#F3F4F6',
  },
  btnCancelText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
  btnSave: {
    backgroundColor: '#665CFF',
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
