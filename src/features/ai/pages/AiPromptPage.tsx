import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AiPromptComposer } from '@/src/features/ai/components/AiPromptComposer';
import { SchedulePreviewModal } from '@/src/features/ai/components/SchedulePreviewModal';
import { Fonts } from '@/src/constants/typography';
import { addPromptSchedule } from '@/src/features/schedule/store/promptScheduleStore';
import { extractApi, PromptAttachment } from '@/src/services/api/extract.api';
import { PromptSchedule } from '@/src/types/schedule.types';

type ChatMessage = {
  attachment?: {
    name: string;
    type: string;
  } | null;
  id: string;
  role: 'assistant' | 'user';
  status?: 'error' | 'success' | 'thinking';
  text: string;
};

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(text: string, now: Date): string {
  const lower = text.toLowerCase();
  const nextDate = new Date(now);

  if (/\bbesok\b/.test(lower)) {
    nextDate.setDate(now.getDate() + 1);
    return dateKey(nextDate);
  }
  if (/\blusa\b/.test(lower)) {
    nextDate.setDate(now.getDate() + 2);
    return dateKey(nextDate);
  }
  if (/\bminggu depan\b/.test(lower)) {
    nextDate.setDate(now.getDate() + 7);
    return dateKey(nextDate);
  }
  if (/\bhari ini\b|\bsekarang\b/.test(lower)) {
    return dateKey(now);
  }

  const dayMap: Record<string, number> = {
    minggu: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
  };

  for (const [dayName, dayIndex] of Object.entries(dayMap)) {
    if (new RegExp(`\\b${dayName}\\b`).test(lower)) {
      const current = now.getDay();
      let diff = dayIndex - current;
      if (diff <= 0) diff += 7;
      nextDate.setDate(now.getDate() + diff);
      return dateKey(nextDate);
    }
  }

  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  return dateKey(now);
}

function parseTime(text: string): string {
  const lower = text.toLowerCase();
  const timeMatch = lower.match(/jam\s+(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/);

  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3];
    if ((period === 'siang' || period === 'sore' || period === 'malam') && hour < 12) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const colonMatch = text.match(/\b(\d{1,2})[.:h](\d{2})\b/);
  if (colonMatch) {
    return `${String(parseInt(colonMatch[1], 10)).padStart(2, '0')}:${colonMatch[2]}`;
  }

  return '09:00';
}

function parseTitle(text: string): string {
  const lower = text.toLowerCase();
  if (/laporan/.test(lower)) return 'Laporan Penjualan';
  if (/meeting|rapat/.test(lower)) return 'Meeting';
  if (/presentasi/.test(lower)) return 'Presentasi';
  if (/submit|kumpul/.test(lower)) return 'Submit Tugas';
  if (/review/.test(lower)) return 'Review Sprint';
  if (/kuliah|kelas|lecture/.test(lower)) return 'Kuliah';

  const words = text.split(/\s+/).slice(0, 5).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function normalizeApiTime(value?: string | null): string {
  if (!value) return '09:00';
  const [hour = '09', minute = '00'] = value.split(':');
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function addOneHour(time: string): string {
  const [h, m] = normalizeApiTime(time).split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseRecurring(text: string): PromptSchedule['recurring'] {
  const lower = text.toLowerCase();
  if (/\bsetiap hari\b|\bdaily\b/.test(lower)) return 'daily';
  if (/\bsetiap minggu\b|\bmingguan\b|\bweekly\b/.test(lower)) return 'weekly';
  if (/\bsetiap bulan\b|\bbulanan\b|\bmonthly\b/.test(lower)) return 'monthly';
  return 'none';
}

function parseEndDate(text: string, startDateKey: string, now: Date): string | undefined {
  const lower = text.toLowerCase();
  const rangeMatch = lower.match(/(?:sampai|hingga|s\/d|\bto\b)\s+(.*)/);
  if (!rangeMatch) return undefined;

  const parsed = parseDate(rangeMatch[1], now);
  return parsed && parsed >= startDateKey ? parsed : undefined;
}

function buildScheduleFromPrompt(prompt: string): PromptSchedule {
  const now = new Date();
  const title = parseTitle(prompt);
  const date = parseDate(prompt, now);
  const endDate = parseEndDate(prompt, date, now);
  const time = normalizeApiTime(parseTime(prompt));

  return {
    id: `ai-${now.getTime()}`,
    userId: 'user-1',
    title,
    date,
    endDate,
    time,
    endTime: addOneHour(time),
    location: 'ZAID AI',
    description: prompt,
    reminderMinutes: 60,
    recurring: parseRecurring(prompt),
    sourcePrompt: prompt,
    status: 'active',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function buildScheduleSummary(schedule: PromptSchedule) {
  const dateText = schedule.endDate && schedule.endDate !== schedule.date
    ? `${schedule.date} - ${schedule.endDate}`
    : schedule.date;

  return `I found a schedule: ${schedule.title} on ${dateText} at ${schedule.time}. Review the details before saving it.`;
}

export function AiPromptPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [preview, setPreview] = useState<PromptSchedule | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string } | null>(null);
  const [attachments, setAttachments] = useState<PromptAttachment[] | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I can help turn your messages, documents, or images into schedules. Send a quick note like WhatsApp, and I will structure it for your calendar.',
    },
  ]);

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const statusText = useMemo(() => {
    if (isProcessing) return 'ZAID is reading your message...';
    if (attachedFile) return `Attached: ${attachedFile.name}`;
    return 'Attach a document/image or type a schedule message';
  }, [attachedFile, isProcessing]);

  useEffect(() => {
    if (!isProcessing) return;

    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay(640 - delay),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    };
  }, [isProcessing, dot1, dot2, dot3]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, isProcessing]);

  function triggerSuccess(callback: () => void) {
    setShowSuccess(true);
    successScale.setValue(0);
    successOpacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(650),
      Animated.timing(successOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setShowSuccess(false);
      callback();
    });
  }

  function appendMessage(message: ChatMessage) {
    setMessages((current) => [...current, message]);
  }

  function replaceMessage(messageId: string, patch: Partial<ChatMessage>) {
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, ...patch } : message))
    );
  }

  async function parseSchedule(text: string, currentAttachments: PromptAttachment[] | null) {
    const res = await extractApi.processPrompt(text, currentAttachments);

    if (res.success && res.data) {
      const { parse_status, result, confirmation } = res.data;

      if ((parse_status === 'success' || parse_status === 'parsed') && result) {
        const task = result.task || result;
        const now = new Date();
        const time = normalizeApiTime(task.scheduled_time);
        return {
          id: task.id || `ai-${now.getTime()}`,
          userId: 'user-1',
          title: task.title || parseTitle(text),
          date: task.scheduled_date || dateKey(now),
          time,
          endTime: addOneHour(time),
          location: 'ZAID AI',
          description: task.description || '',
          reminderMinutes: 30,
          status: task.status === 'completed' ? 'done' : 'active',
          sourcePrompt: text,
          createdAt: task.created_at || now.toISOString(),
          updatedAt: task.updated_at || now.toISOString(),
        } satisfies PromptSchedule;
      }

      if (parse_status === 'requires_confirmation' && confirmation) {
        const entities = confirmation.entities || {};
        const now = new Date();
        const time = normalizeApiTime(entities.scheduled_time);
        return {
          id: `ai-${now.getTime()}`,
          userId: 'user-1',
          title: entities.title || parseTitle(text),
          date: entities.scheduled_date || dateKey(now),
          time,
          endTime: addOneHour(time),
          location: 'ZAID AI',
          description: entities.description || '',
          reminderMinutes: 30,
          status: 'active',
          sourcePrompt: text,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        } satisfies PromptSchedule;
      }
    }

    return buildScheduleFromPrompt(text);
  }

  async function handleSubmit() {
    const text = prompt.trim() || (attachedFile ? `Ekstrak jadwal dari file: ${attachedFile.name}` : '');
    if (!text || isProcessing) return;

    const currentFile = attachedFile;
    const currentAttachments = attachments;
    const thinkingId = `assistant-${Date.now()}`;

    appendMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      attachment: currentFile,
    });
    appendMessage({
      id: thinkingId,
      role: 'assistant',
      status: 'thinking',
      text: 'Reading your message and looking for schedule details...',
    });

    setPrompt('');
    setAttachedFile(null);
    setAttachments(null);
    setIsProcessing(true);

    try {
      const schedule = await parseSchedule(text, currentAttachments);
      replaceMessage(thinkingId, {
        status: 'success',
        text: buildScheduleSummary(schedule),
      });
      triggerSuccess(() => setPreview(schedule));
    } catch (err: any) {
      const apiErrMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      console.warn('Backend LLM parsing failed, using local regex parser fallback:', apiErrMsg);
      const localParsed = buildScheduleFromPrompt(text);
      replaceMessage(thinkingId, {
        status: 'success',
        text: `${buildScheduleSummary(localParsed)} I used local parsing because the API was unavailable.`,
      });
      triggerSuccess(() => setPreview(localParsed));
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFilePick() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: '*/*',
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const mime = asset.mimeType || '';
      let type: 'document' | 'image' = 'document';
      if (mime.startsWith('image/')) type = 'image';

      setIsProcessing(true);

      try {
        const uploadRes = await extractApi.uploadFile(
          asset.uri,
          asset.name,
          mime || 'application/octet-stream',
          type
        );

        if (uploadRes.success && uploadRes.data) {
          setAttachedFile({ name: asset.name, type: asset.mimeType || 'document' });
          setAttachments([{
            type: type === 'image' ? 'image' : 'document',
            url: uploadRes.data.url,
            text: `File: ${asset.name}`,
          }]);
        } else {
          Alert.alert('Error', 'Failed to upload file to backend API.');
        }
      } catch (uploadErr: any) {
        const errMsg = uploadErr.response?.data?.error?.message || uploadErr.message;
        console.warn('File upload failed, falling back to local simulation:', errMsg);
        setAttachedFile({ name: asset.name, type: asset.mimeType || 'document' });
        setAttachments([{
          type: type === 'image' ? 'image' : 'document',
          url: `https://zaid-assist.my.id/storage/mocks/${asset.name}`,
          text: `Local mock file: ${asset.name}`,
        }]);
      }
    } catch (err) {
      console.warn('Error picking document', err);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSave() {
    if (!preview) return;

    addPromptSchedule(preview);
    appendMessage({
      id: `saved-${Date.now()}`,
      role: 'assistant',
      status: 'success',
      text: `Saved "${preview.title}" to Dashboard and Calendar.`,
    });
    setPreview(null);
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <LinearGradient
        colors={['#F5F3FF', '#F8FAFC', '#FFFFFF']}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.buttonPressed : null]}>
            <MaterialIcons name="chevron-left" color="#1F2937" size={28} />
          </Pressable>
          <View style={styles.brandWrap}>
            <Text style={styles.brand}>ZAID</Text>
            <Text style={styles.subtitle}>Schedule assistant</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          style={styles.chatScroll}>
          <View style={styles.contextStrip}>
            <MaterialIcons name="auto-awesome" color="#665CFF" size={18} />
            <Text style={styles.contextText}>Fast like chat, structured for your calendar.</Text>
          </View>

          {messages.map((message) => (
            <ChatBubble
              dot1={dot1}
              dot2={dot2}
              dot3={dot3}
              key={message.id}
              message={message}
            />
          ))}

          {showSuccess ? (
            <Animated.View
              style={[
                styles.successOverlay,
                { opacity: successOpacity, transform: [{ scale: successScale }] },
              ]}>
              <View style={styles.successCircle}>
                <MaterialIcons name="check" color="#FFFFFF" size={32} />
              </View>
              <Text style={styles.successLabel}>Schedule detected</Text>
            </Animated.View>
          ) : null}
        </ScrollView>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isProcessing ? styles.statusDotProcessing : null]} />
          <Text numberOfLines={1} style={styles.statusText}>{statusText}</Text>
        </View>

        <AiPromptComposer
          attachedFile={attachedFile}
          bottomInset={insets.bottom}
          isKeyboardVisible={isKeyboardVisible}
          isProcessing={isProcessing}
          onAttachFile={handleFilePick}
          onChangePrompt={setPrompt}
          onRemoveAttachedFile={() => {
            setAttachedFile(null);
            setAttachments(null);
          }}
          onSubmit={handleSubmit}
          prompt={prompt}
        />

        <SchedulePreviewModal
          onChangeSchedule={(patch) =>
            setPreview((current) => (current ? { ...current, ...patch } : current))
          }
          onClose={() => setPreview(null)}
          onSave={handleSave}
          schedule={preview}
          visible={Boolean(preview)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

function ChatBubble({
  dot1,
  dot2,
  dot3,
  message,
}: {
  dot1: Animated.Value;
  dot2: Animated.Value;
  dot3: Animated.Value;
  message: ChatMessage;
}) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : null]}>
      {!isUser ? (
        <View style={styles.assistantAvatar}>
          <MaterialIcons name="auto-awesome" color="#FFFFFF" size={15} />
        </View>
      ) : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {message.attachment ? (
          <View style={styles.messageAttachment}>
            <MaterialIcons
              color={message.attachment.type.startsWith('image/') ? '#3B82F6' : '#665CFF'}
              name={message.attachment.type.startsWith('image/') ? 'image' : 'insert-drive-file'}
              size={16}
            />
            <Text numberOfLines={1} style={styles.messageAttachmentText}>{message.attachment.name}</Text>
          </View>
        ) : null}

        {message.status === 'thinking' ? (
          <View style={styles.thinkingRow}>
            {[dot1, dot2, dot3].map((dot, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.loadingDot,
                  {
                    opacity: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.35, 1],
                    }),
                    transform: [{
                      translateY: dot.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    }],
                  },
                ]}
              />
            ))}
          </View>
        ) : null}

        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  assistantAvatar: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
    width: 30,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6E8F0',
    borderWidth: 1,
  },
  assistantText: {
    color: '#273044',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  brand: {
    color: '#111827',
    fontFamily: Fonts.displaySemi,
    fontSize: 19,
    lineHeight: 24,
  },
  brandWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    borderRadius: 18,
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  chatContent: {
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  chatScroll: {
    flex: 1,
  },
  contextStrip: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: '#E8E6FF',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  contextText: {
    color: '#596173',
    fontFamily: Fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerSpacer: {
    width: 38,
  },
  loadingDot: {
    backgroundColor: '#665CFF',
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  messageAttachment: {
    alignItems: 'center',
    backgroundColor: 'rgba(102, 92, 255, 0.08)',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 7,
    maxWidth: 220,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  messageAttachmentText: {
    color: '#374151',
    flexShrink: 1,
    fontFamily: Fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  messageRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 14,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  statusDot: {
    backgroundColor: '#10B981',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusDotProcessing: {
    backgroundColor: '#665CFF',
  },
  statusRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  statusText: {
    color: '#667085',
    fontFamily: Fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 300,
  },
  subtitle: {
    color: '#7B8497',
    fontFamily: Fonts.bodyRegular,
    fontSize: 11,
    lineHeight: 16,
  },
  successCircle: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 36,
    height: 58,
    justifyContent: 'center',
    marginBottom: 8,
    width: 58,
  },
  successLabel: {
    color: '#111827',
    fontFamily: Fonts.displaySemi,
    fontSize: 14,
    lineHeight: 20,
  },
  successOverlay: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#E5E7EB',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 12,
    marginTop: 4,
    paddingHorizontal: 26,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  thinkingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 16,
    marginBottom: 5,
  },
  userBubble: {
    backgroundColor: '#665CFF',
    borderTopRightRadius: 6,
  },
  userText: {
    color: '#FFFFFF',
  },
});
