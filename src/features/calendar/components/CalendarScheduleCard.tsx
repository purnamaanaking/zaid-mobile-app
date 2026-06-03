import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortMonth } from '@/src/features/calendar/utils/date';
import { PromptSchedule } from '@/src/types/schedule.types';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
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

  const startDateNum = new Date(`${schedule.date}T00:00:00`).getDate();
  const isRange = schedule.endDate && schedule.endDate !== schedule.date;
  const endDateNum = isRange ? new Date(`${schedule.endDate}T00:00:00`).getDate() : null;

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
      <View style={styles.dateBadge}>
        {isRange ? (
          <View style={styles.dateRangeContent}>
            <Text style={styles.dateNumberText}>{startDateNum}</Text>
            <Text style={styles.dateToText}>to</Text>
            <Text style={styles.dateNumberText}>{endDateNum}</Text>
            <Text style={styles.dateMonthText}>{formatShortMonth(schedule.date)}</Text>
          </View>
        ) : (
          <View style={styles.dateSingleContent}>
            <Text style={styles.dateNumberTextLarge}>{startDateNum}</Text>
            <Text style={styles.dateMonthText}>{formatShortMonth(schedule.date)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="event-note" color="#FF9F9F" size={14} />
          </View>
          <Text numberOfLines={1} style={styles.title}>
            {schedule.title}
          </Text>
          <View style={styles.actionRow}>
            <Pressable
              accessibilityLabel={`Edit ${schedule.title}`}
              accessibilityRole="button"
              onPress={onEdit}
              style={styles.actionButton}>
              <MaterialIcons name="edit" color="#665CFF" size={18} />
            </Pressable>
            <Pressable
              accessibilityLabel={`Delete ${schedule.title}`}
              accessibilityRole="button"
              onPress={onDelete}
              style={styles.actionButton}>
              <MaterialIcons name="delete-outline" color="#FF5F67" size={19} />
            </Pressable>
          </View>
        </View>

        <Text numberOfLines={1} style={styles.description}>
          {schedule.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>
              {schedule.time} - {schedule.endTime}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>No Recurring</Text>
            <MaterialIcons name="sync" color="#FFFFFF" size={12} />
          </View>
        </View>

        <Text numberOfLines={1} style={styles.promptText}>
          Prompt: {schedule.sourcePrompt}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  actionRow: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    elevation: 8,
    flexDirection: 'row',
    marginBottom: 30,
    minHeight: 96,
    overflow: 'hidden',
    shadowColor: '#1D2433',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  cardEditing: {
    borderColor: '#665CFF',
    borderWidth: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 12,
    paddingLeft: 18,
    paddingRight: 8,
    paddingTop: 14,
  },
  dateBadge: {
    alignItems: 'center',
    backgroundColor: '#F5F4FF',
    borderRightColor: '#EBE9F9',
    borderRightWidth: 1,
    justifyContent: 'center',
    width: 64,
  },
  dateRangeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSingleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumberTextLarge: {
    color: '#665CFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  dateNumberText: {
    color: '#665CFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
  },
  dateToText: {
    color: '#8E96A6',
    fontSize: 10,
    fontWeight: '500',
    marginVertical: 1,
  },
  dateMonthText: {
    color: '#8E96A6',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    color: '#98A4B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: '#FFE9E9',
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  metaChip: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    minHeight: 24,
    paddingHorizontal: 11,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  metaText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  promptText: {
    color: '#B1B9C8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
  },
  title: {
    color: '#111827',
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
