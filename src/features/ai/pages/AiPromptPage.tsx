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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AiPromptComposer } from '@/src/features/ai/components/AiPromptComposer';
import { Config } from '@/src/constants/config';
import { Fonts } from '@/src/constants/typography';
import { addPromptSchedule, fetchPromptSchedules } from '@/src/features/schedule/store/promptScheduleStore';
import { extractApi, PromptAttachment } from '@/src/services/api/extract.api';
import { useAuthStore } from '@/src/store/auth.store';
import { PromptSchedule } from '@/src/types/schedule.types';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { fetchReminders, useReminders } from '@/src/features/reminders/store/reminderStore';
import { addDays, addOneHour, dateKey, normalizeApiTime } from '@/src/utils/date';
import ZaidBlackLogo from '@/assets/brand/zaid-black.svg';

type ParsedSchedule = {
  schedule?: PromptSchedule;
  backendSaved: boolean;
  promptRequestId?: string;
  response?: string;
};

type ChatMessage = {
  attachment?: {
    name: string;
    type: string;
    uri?: string;
  } | null;
  id: string;
  role: 'assistant' | 'user';
  status?: 'error' | 'success' | 'thinking';
  text: string;
};

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

function getInitials(name?: string | null, email?: string | null) {
  const source = (name || email || 'ZAID').trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function parseLocalDate(text: string): string {
  const lower = text.toLowerCase();
  const now = new Date();
  const isoMatch = lower.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const slashMatch = lower.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year || now.getFullYear()}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  if (/\blusa\b|day after tomorrow/.test(lower)) return dateKey(addDays(now, 2));
  if (/\bbesok\b|tomorrow/.test(lower)) return dateKey(addDays(now, 1));
  if (/minggu depan|next week/.test(lower)) return dateKey(addDays(now, 7));
  return dateKey(now);
}

function parseLocalTime(text: string): string {
  const lower = text.toLowerCase();
  const match = lower.match(/\b(?:jam|pukul|at)?\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam|am|pm)?\b/);
  if (!match) return '09:00';

  let hour = Number(match[1]);
  const minute = match[2] || '00';
  const period = match[3];

  if ((period === 'malam' || period === 'sore' || period === 'pm') && hour < 12) hour += 12;
  if (period === 'pagi' && hour === 12) hour = 0;
  if (period === 'siang' && hour < 11) hour += 12;

  return `${String(hour % 24).padStart(2, '0')}:${minute}`;
}

function parseLocalReminderMinutes(text: string): number {
  const lower = text.toLowerCase();
  const match = lower.match(/(?:ingatkan|reminder|remind).*?(\d+)\s*(menit|minute|minutes|jam|hour|hours|hari|day|days)/);
  if (!match) return 30;

  const value = Number(match[1]);
  const unit = match[2];
  if (/hari|day/.test(unit)) return value * 1440;
  if (/jam|hour/.test(unit)) return value * 60;
  return value;
}

function parseLocalSchedule(text: string, currentAttachments: PromptAttachment[] | null): ParsedSchedule {
  const now = new Date();
  const scheduledTime = parseLocalTime(text);
  const task = {
    id: `local-ai-${now.getTime()}`,
    title: parseTitle(text),
    description: currentAttachments?.length
      ? `${text}\n\nLampiran lokal disertakan untuk simulasi UI.`
      : text,
    scheduled_date: parseLocalDate(text),
    scheduled_time: scheduledTime,
    reminder_minutes_before: /ingatkan|reminder|remind/i.test(text) ? parseLocalReminderMinutes(text) : 30,
    reminder_channel: 'app',
    recurrence: /mingguan|weekly|setiap minggu/i.test(text)
      ? { type: 'weekly' }
      : /harian|daily|setiap hari/i.test(text)
        ? { type: 'daily' }
        : /bulanan|monthly|setiap bulan/i.test(text)
          ? { type: 'monthly' }
          : null,
    status: 'active',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  return {
    schedule: taskToSchedule(task, text),
    backendSaved: false,
  };
}

function taskToSchedule(task: any, sourcePrompt: string): PromptSchedule {
  const now = new Date();
  const time = normalizeApiTime(task.scheduled_time);
  return {
    id: task.id || `ai-${now.getTime()}`,
    userId: 'current-user',
    title: task.title || parseTitle(sourcePrompt),
    date: task.scheduled_date || dateKey(now),
    endDate: task.scheduled_end_date || undefined,
    time,
    endTime: task.scheduled_end_time ? normalizeApiTime(task.scheduled_end_time) : addOneHour(time),
    location: task.location || 'ZAID',
    description: task.description || '',
    reminderMinutes: task.reminder_minutes_before ?? 30,
    reminderEnabled: task.reminder_minutes_before != null,
    reminderChannel: task.reminder_channel || 'whatsapp',
    recurring: task.recurrence?.type || 'none',
    sourcePrompt,
    status: task.status === 'completed' ? 'done' : 'active',
    createdAt: task.created_at || now.toISOString(),
    updatedAt: task.updated_at || now.toISOString(),
  };
}

function formatScheduleDate(value: string, formatter: Intl.DateTimeFormat) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value || 'tanggal belum terisi';

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return value;
  }

  return formatter.format(date);
}

function buildScheduleSummary(schedule: PromptSchedule) {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const start = formatScheduleDate(schedule.date, formatter);
  const end = schedule.endDate && schedule.endDate !== schedule.date
    ? formatScheduleDate(schedule.endDate, formatter)
    : null;

  const dateText = end ? `${start} - ${end}` : start;
  return `Saya menemukan jadwal: ${schedule.title} pada ${dateText} pukul ${schedule.time}. Tinjau detail sebelum menyimpan.`;
}

export function AiPromptPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const theme = useAppTheme();
  const { reminders } = useReminders();
  const scrollRef = useRef<ScrollView | null>(null);
  const drawerX = useRef(new Animated.Value(-300)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; uri?: string } | null>(null);
  const [attachments, setAttachments] = useState<PromptAttachment[] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Halo, saya bisa bantu ubah pesan, dokumen, atau gambar kamu jadi jadwal. Kirim catatan singkat seperti WhatsApp, dan saya akan susun untuk kalender kamu.',
    },
  ]);

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const statusText = useMemo(() => {
    if (isProcessing) return 'ZAID sedang membaca pesan kamu...';
    if (attachedFile) return `Terlampir: ${attachedFile.name}`;
    return 'Lampirkan dokumen/gambar atau tulis pesan jadwal';
  }, [attachedFile, isProcessing]);
  const userInitials = getInitials(user?.full_name, user?.email);

  const notifications = useMemo(() => {
    const now = Date.now();
    return reminders
      .filter((reminder) => reminder.status === 'pending' && new Date(reminder.remind_at).getTime() > now)
      .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
      .slice(0, 3);
  }, [reminders]);

  useEffect(() => {
    fetchReminders().catch((err) => {
      console.warn('Failed to fetch reminders for notifications', err);
    });

    // Load riwayat prompt/chat dari backend
    extractApi.listPrompts().then((res) => {
      if (res.success && res.data?.items?.length) {
        const historyMessages: ChatMessage[] = [];
        res.data.items.forEach((item) => {
          if (item.text) {
            historyMessages.push({
              id: `user-${item.id}`,
              role: 'user',
              text: item.text,
            });
          }
          if (item.response) {
            historyMessages.push({
              id: `assistant-${item.id}`,
              role: 'assistant',
              status: 'success',
              text: item.response,
            });
          }
        });
        if (historyMessages.length) {
          setMessages(historyMessages);
        }
      }
    }).catch((err) => {
      console.warn('Failed to fetch prompt history', err);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'ios') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

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
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages, isProcessing]);

  function openDrawer() {
    setDrawerOpen(true);
    Animated.timing(drawerX, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }

  function closeDrawer() {
    setDrawerOpen(false);
    Animated.timing(drawerX, { toValue: -300, duration: 220, useNativeDriver: true }).start();
  }

  function toggleDrawer() {
    if (drawerOpen) closeDrawer(); else openDrawer();
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
    if (Config.useLocalUiData) return parseLocalSchedule(text, currentAttachments);

    const res = await extractApi.processPrompt(text, currentAttachments);
    if (!res.success || !res.data) throw new Error(res.data?.human_response || 'ZAID gagal memproses pesan.');

    if (res.data.requires_confirmation) {
      if (res.data.parse_status === 'ambiguous') {
        return {
          backendSaved: true,
          response: res.data.human_response,
        } satisfies ParsedSchedule;
      }

      const confirmed = await extractApi.confirmPrompt(res.data.prompt_request_id, true);
      return {
        backendSaved: true,
        response: confirmed.data.human_response || 'Jadwal sudah disimpan.',
      } satisfies ParsedSchedule;
    }

    return {
      backendSaved: true,
      response: res.data.human_response || 'Perintah selesai diproses.',
    } satisfies ParsedSchedule;
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
      text: 'Membaca pesan kamu dan mencari detail jadwal...',
    });

    setPrompt('');
    setAttachedFile(null);
    setAttachments(null);
    setIsProcessing(true);

    try {
      const parsed = await parseSchedule(text, currentAttachments);
      if (!parsed.schedule) {
        replaceMessage(thinkingId, { status: 'success', text: parsed.response || 'Perintah selesai diproses.' });
        await fetchPromptSchedules();
        return;
      }

      const schedule = parsed.schedule;
      replaceMessage(thinkingId, { status: 'success', text: buildScheduleSummary(schedule) });
      Keyboard.dismiss();
      await addPromptSchedule(schedule);
      await fetchPromptSchedules();
      appendMessage({ id: `saved-${Date.now()}`, role: 'assistant', status: 'success', text: `Disimpan: "${schedule.title}" ke Kalender.` });
    } catch (err: any) {
      const apiErrMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      console.warn('Backend prompt processing failed:', apiErrMsg);
      replaceMessage(thinkingId, {
        status: 'error',
        text: apiErrMsg || 'ZAID gagal memproses pesan. Coba lagi.',
      });
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
      const documentExtensions = ['pdf', 'csv', 'xls', 'xlsx'];
      const extension = asset.name.split('.').pop()?.toLowerCase();
      if (type === 'document' && !documentExtensions.includes(extension ?? '')) {
        Alert.alert('Format belum didukung', 'Gunakan PDF, CSV, XLS, XLSX, JPG, PNG, atau WEBP.');
        return;
      }

      if (Config.useLocalUiData) {
        setAttachedFile({ name: asset.name, type: asset.mimeType || 'document', uri: asset.uri });
        setAttachments([{
          type: type === 'image' ? 'image' : 'document_text',
          url: type === 'image' ? asset.uri : null,
          text: `Local file: ${asset.name}`,
          name: asset.name,
          mime_type: asset.mimeType || null,
        }]);
        return;
      }

      setIsProcessing(true);

      try {
        const uploadRes = await extractApi.uploadFile(
          asset.uri,
          asset.name,
          mime || 'application/octet-stream',
          type
        );

        if (uploadRes.success && uploadRes.data) {
          setAttachedFile({ name: asset.name, type: asset.mimeType || 'document', uri: uploadRes.data.url });
          setAttachments([{
            type: type === 'image' ? 'image' : 'document_text',
            url: type === 'image' ? uploadRes.data.url : null,
            text: type === 'image' ? `File: ${asset.name}` : uploadRes.data.extracted_text || '',
            name: uploadRes.data.original_name,
            mime_type: uploadRes.data.mime_type,
          }]);
        } else {
          Alert.alert('Error', 'Gagal mengunggah file ke server.');
        }
      } catch (uploadErr: any) {
        const errMsg = uploadErr.response?.data?.error?.message || uploadErr.message;
        console.warn('File upload failed:', errMsg);
        Alert.alert('Upload gagal', errMsg || 'Lampiran gagal diunggah. Coba lagi.');
      }
    } catch (err) {
      console.warn('Error picking document', err);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: theme.bgSecondary }}>
      <LinearGradient
        colors={theme.isDark ? ['#212121', '#1C1C1C', '#171717'] : ['#F5F3FF', '#F8FAFC', '#FFFFFF']}
        end={{ x: 0, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}>
        <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <Pressable
            accessibilityLabel="Buka menu"
            accessibilityRole="button"
            onPress={toggleDrawer}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}>
            <MaterialIcons name="menu" color={theme.text} size={24} />
          </Pressable>
          <View style={styles.brandWrap}>
            <ZaidBlackLogo height={26} width={87} accessibilityLabel="ZAID" />
          </View>
          <Pressable
            accessibilityLabel="Notifikasi"
            accessibilityRole="button"
            onPress={() => setNotifOpen((v) => !v)}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}>
            <MaterialIcons name="notifications-none" color={theme.text} size={24} />
            {notifications.length > 0 ? <View style={styles.notifBadge} /> : null}
          </Pressable>
        </View>

        {notifOpen ? (
          <>
            <Pressable style={styles.notifBackdrop} onPress={() => setNotifOpen(false)} />
            <View style={[styles.notifDropdown, { top: insets.top + (headerHeight || 68) }]}>
              <Text style={styles.notifDropdownTitle}>Notifikasi</Text>
              {notifications.length > 0 ? (
                notifications.map((reminder) => (
                  <View key={reminder.id} style={styles.notifItem}>
                    <MaterialIcons name="event" color="#665CFF" size={20} />
                    <View style={styles.notifItemText}>
                      <Text style={styles.notifItemTitle}>
                        {reminder.task?.title || reminder.calendar_event?.title || 'Pengingat jadwal'}
                      </Text>
                      <Text style={styles.notifItemSub}>
                        {new Date(reminder.remind_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.notifItem}>
                  <MaterialIcons name="notifications-none" color="#9CA3AF" size={20} />
                  <View style={styles.notifItemText}>
                    <Text style={styles.notifItemTitle}>Tidak ada pengingat</Text>
                    <Text style={styles.notifItemSub}>Belum ada agenda yang diingatkan.</Text>
                  </View>
                </View>
              )}
              <Pressable
                onPress={() => { setNotifOpen(false); router.push('/(app)/settings-notifications'); }}
                style={styles.notifFooter}>
                <Text style={styles.notifFooterText}>Pengaturan notifikasi</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {/* Drawer overlay */}
        {drawerOpen ? (
          <Pressable style={styles.drawerBackdrop} onPress={closeDrawer} />
        ) : null}
        <Animated.View
          style={[styles.drawer, { paddingTop: insets.top + 8, transform: [{ translateX: drawerX }] }]}
          pointerEvents={drawerOpen ? 'auto' : 'none'}
        >
          <View style={styles.drawerTop}>
            <View style={styles.drawerLogoWrap}>
              <ZaidBlackLogo height={22} width={74} accessibilityLabel="ZAID" />
            </View>
            <Text style={styles.drawerHint}>Percakapan dan jadwal</Text>
            <Pressable
              accessibilityLabel="Buka Kalender"
              accessibilityRole="button"
              onPress={() => {
                closeDrawer();
                router.push('/(tabs)/explore');
              }}
              style={({ pressed }) => [styles.menuItem, pressed ? styles.menuItemPressed : null]}
            >
              <MaterialIcons name="calendar-today" size={20} color="#111827" />
              <Text style={styles.menuItemText}>Kalender</Text>
            </Pressable>
          </View>
          <View style={[styles.drawerBottom, { bottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
            <Pressable
              accessibilityLabel="Buka Pengaturan"
              accessibilityRole="button"
              onPress={() => {
                closeDrawer();
                router.push('/(tabs)/profile');
              }}
              style={({ pressed }) => [styles.settingsButton, pressed ? styles.menuItemPressed : null]}
            >
              <MaterialIcons name="settings" size={22} color="#111827" />
              <Text style={styles.settingsText}>Pengaturan</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Buka Profil"
              accessibilityRole="button"
              onPress={() => {
                closeDrawer();
                router.push('/(tabs)/profile');
              }}
              style={({ pressed }) => [styles.profileButton, pressed ? styles.menuItemPressed : null]}
            >
              <View style={styles.profileInitials}>
                <Text style={styles.profileInitialsText}>{userInitials}</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          bounces={false}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          style={styles.chatScroll}>
          <View style={styles.contextStrip}>
            <MaterialIcons name="auto-awesome" color="#665CFF" size={18} />
            <Text style={styles.contextText}>Cepat seperti chat, terstruktur untuk kalender kamu.</Text>
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

        </ScrollView>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isProcessing ? styles.statusDotProcessing : null]} />
          <Text numberOfLines={1} style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={{ paddingBottom: keyboardHeight }}>
          <AiPromptComposer
            attachedFile={attachedFile}
            bottomInset={insets.bottom}
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
        </View>

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
  const isImageAttachment = message.attachment?.type.startsWith('image/') && message.attachment.uri;

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : null]}>
      {!isUser ? (
        <View style={styles.assistantAvatar}>
          <MaterialIcons name="auto-awesome" color="#FFFFFF" size={15} />
        </View>
      ) : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {message.attachment ? (
          <View style={styles.messageAttachmentWrap}>
            {isImageAttachment ? (
              <Image
                accessibilityLabel={`Pratinjau ${message.attachment.name}`}
                contentFit="cover"
                source={{ uri: message.attachment.uri }}
                style={styles.messageAttachmentImage}
              />
            ) : null}
            <View style={styles.messageAttachment}>
              <MaterialIcons
                color={message.attachment.type.startsWith('image/') ? '#3B82F6' : '#665CFF'}
                name={message.attachment.type.startsWith('image/') ? 'image' : 'insert-drive-file'}
                size={16}
              />
              <Text numberOfLines={1} style={styles.messageAttachmentText}>{message.attachment.name}</Text>
            </View>
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
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
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
  notifBadge: {
    backgroundColor: '#EF4444',
    borderColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    position: 'absolute',
    right: 6,
    top: 6,
    width: 10,
  },
  notifBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
  },
  notifDropdown: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 16,
    marginHorizontal: 16,
    padding: 16,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    width: 280,
    zIndex: 18,
  },
  notifDropdownTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  notifItem: {
    alignItems: 'flex-start',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  notifItemSub: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  notifItemText: {
    flex: 1,
  },
  notifItemTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  notifFooter: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  notifFooterText: {
    color: '#665CFF',
    fontSize: 13,
    fontWeight: '600',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 20,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    zIndex: 25,
    paddingHorizontal: 12,
  },
  drawerTop: {
    paddingTop: 8,
  },
  drawerBottom: {
    alignItems: 'center',
    borderTopColor: '#F3F4F6',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  drawerHint: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  drawerLogoWrap: {
    marginBottom: 6,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  menuItemPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  menuItemText: { fontSize: 14, color: '#111827', fontWeight: '600' },
  profileButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    minWidth: 0,
    paddingVertical: 4,
  },
  profileInitials: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  profileInitialsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  settingsText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
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
  messageAttachmentImage: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    height: 146,
    width: '100%',
  },
  messageAttachmentText: {
    color: '#374151',
    flexShrink: 1,
    fontFamily: Fonts.bodyRegular,
    fontSize: 12,
    lineHeight: 18,
  },
  messageAttachmentWrap: {
    marginBottom: 8,
    maxWidth: 260,
    minWidth: 210,
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
