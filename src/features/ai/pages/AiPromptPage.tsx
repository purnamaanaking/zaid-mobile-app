import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { AiPromptComposer } from '@/src/features/ai/components/AiPromptComposer';
import { SchedulePreviewModal } from '@/src/features/ai/components/SchedulePreviewModal';
import { addPromptSchedule } from '@/src/features/schedule/store/promptScheduleStore';
import { PromptSchedule } from '@/src/types/schedule.types';
import { extractApi } from '@/src/services/api/extract.api';

const ZAID_LOGO = require('@/src/components/image/logo-zaid.png');

// ─── Smart NLP Parser (Offline Regex Parser) ───────────────────────────────────

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
  // Day of week: senin, selasa, rabu, kamis, jumat, sabtu, minggu
  const dayMap: Record<string, number> = {
    minggu: 0, senin: 1, selasa: 2, rabu: 3,
    kamis: 4, jumat: 5, sabtu: 6,
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
  // ISO date in text (YYYY-MM-DD)
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  return dateKey(now); // default today
}

function parseTime(text: string): string {
  const lower = text.toLowerCase();
  // "jam 10 pagi" / "jam 10:30" / "10:00"
  const timeMatch = lower.match(/jam\s+(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3];
    if (period === 'siang' && hour < 12) hour += 12;
    if (period === 'sore' && hour < 12) hour += 12;
    if (period === 'malam' && hour < 12) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  // "14:30" or "9.00"
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
  if (/makan|lunch|dinner/.test(lower)) return 'Makan Bersama';
  // Capitalize first words
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
  if (!rangeMatch) {
    return undefined;
  }
  const targetText = rangeMatch[1];
  const parsed = parseDate(targetText, now);
  if (parsed && parsed >= startDateKey) {
    return parsed;
  }
  return undefined;
}

function buildScheduleFromPrompt(prompt: string): PromptSchedule {
  const now = new Date();
  const title = parseTitle(prompt);
  const date = parseDate(prompt, now);
  const endDate = parseEndDate(prompt, date, now);
  const time = normalizeApiTime(parseTime(prompt));
  const recurring = parseRecurring(prompt);

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
    recurring,
    sourcePrompt: prompt,
    status: 'active',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// ─── Voice Recording Modal ────────────────────────────────────────────────────

const FAKE_VOICE_TRANSCRIPTS = [
  'Besok jam 10 pagi rapat koordinasi mingguan',
  'Jumat sore jam 3 review sprint dengan tim produk',
  'Besok lusa submit proposal penelitian jam 9 pagi',
  'Setiap Senin jam 8 kuliah algoritma di Gedung B',
];

function VoiceRecordingModal({
  visible,
  onDone,
  onCancel,
}: {
  visible: boolean;
  onDone: (transcript: string) => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<'recording' | 'transcribing'>('recording');
  const barAnims = useRef([...Array(7)].map(() => new Animated.Value(0.3))).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setPhase('recording');
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    setPhase('recording');

    const animateBars = () => {
      const anims = barAnims.map((bar) =>
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.8,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.4,
            duration: 200 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ])
      );
      Animated.stagger(60, anims).start(() => {
        if (visible) animateBars();
      });
    };
    animateBars();

    timerRef.current = setTimeout(() => {
      setPhase('transcribing');
      timerRef.current = setTimeout(() => {
        const transcript =
          FAKE_VOICE_TRANSCRIPTS[Math.floor(Math.random() * FAKE_VOICE_TRANSCRIPTS.length)];
        onDone(transcript);
      }, 1200);
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={voiceStyles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={voiceStyles.sheet}>
              {phase === 'recording' ? (
                <>
                  <View style={voiceStyles.micCircle}>
                    <MaterialIcons name="mic" color="#FFFFFF" size={36} />
                  </View>
                  <Text style={voiceStyles.statusText}>Listening...</Text>
                  <Text style={voiceStyles.hintText}>
                    Speak now. Recording will stop automatically.
                  </Text>
                  <View style={voiceStyles.waveform}>
                    {barAnims.map((anim, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          voiceStyles.bar,
                          {
                            height: anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [8, 52],
                            }),
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Pressable onPress={onCancel} style={voiceStyles.cancelBtn}>
                    <Text style={voiceStyles.cancelText}>Cancel</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <ActivityIndicator color="#665CFF" size="large" />
                  <Text style={[voiceStyles.statusText, { marginTop: 18 }]}>
                    Transcribing voice...
                  </Text>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AiPromptPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [preview, setPreview] = useState<PromptSchedule | null>(null);
  const [statusText, setStatusText] = useState('Type, speak, or attach a file to get started');
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string } | null>(null);
  const [attachments, setAttachments] = useState<any[] | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // ── Animasi 3 titik loading ──────────────────────────────────
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

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
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); dot1.setValue(0); dot2.setValue(0); dot3.setValue(0); };
  }, [isProcessing, dot1, dot2, dot3]);

  // ── Animasi success checkmark ──────────────────────────────
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  function triggerSuccess(callback: () => void) {
    setShowSuccess(true);
    successScale.setValue(0);
    successOpacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(900),
      Animated.timing(successOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setShowSuccess(false);
      callback();
    });
  }

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

  async function processPrompt(text: string) {
    if (!text.trim()) return;
    setIsProcessing(true);
    setStatusText('AI is analyzing your schedule input...');

    try {
      const res = await extractApi.processPrompt(text, attachments);
      if (res.success && res.data) {
        const { parse_status, result, confirmation } = res.data;
        
        if ((parse_status === 'success' || parse_status === 'parsed') && result) {
          const task = result.task || result;
          const now = new Date();
          const time = normalizeApiTime(task.scheduled_time);
          setStatusText('Schedule detected by AI. Please verify before saving.');
          triggerSuccess(() => setPreview({
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
          }));
        } else if (parse_status === 'requires_confirmation' && confirmation) {
          const entities = confirmation.entities || {};
          const now = new Date();
          const time = normalizeApiTime(entities.scheduled_time);
          setPreview({
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
          });
          setStatusText(`AI asks: "${confirmation.question || 'Is this correct?'}"`);
        } else {
          const localParsed = buildScheduleFromPrompt(text);
          setPreview(localParsed);
          setStatusText('Schedule parsed locally. Please verify before saving.');
        }
      } else {
        const localParsed = buildScheduleFromPrompt(text);
        setPreview(localParsed);
        setStatusText('Schedule parsed locally. Please verify before saving.');
      }
    } catch (err: any) {
      const apiErrMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
      console.warn('Backend LLM parsing failed, using local regex parser fallback:', apiErrMsg);
      const localParsed = buildScheduleFromPrompt(text);
      setPreview(localParsed);
      setStatusText(`Parsed locally. API Error: ${apiErrMsg}`);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleVoiceDone(transcript: string) {
    setVoiceVisible(false);
    setPrompt(transcript);
    setStatusText(`Voice transcribed: "${transcript.slice(0, 40)}..."`);
    setTimeout(() => processPrompt(transcript), 400);
  }

  async function handleFilePick() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setStatusText(`Uploading file: ${asset.name}...`);
        setIsProcessing(true);

        try {
          const mime = asset.mimeType || '';
          let type: 'image' | 'audio' | 'document' = 'document';
          if (mime.startsWith('image/')) type = 'image';
          else if (mime.startsWith('audio/')) type = 'audio';

          const uploadRes = await extractApi.uploadFile(
            asset.uri,
            asset.name,
            mime || 'application/octet-stream',
            type
          );

          if (uploadRes.success && uploadRes.data) {
            setAttachedFile({ name: asset.name, type: asset.mimeType || 'document' });
            
            const newAttachment = {
              type: type === 'image' ? 'image' : 'audio_transcription',
              url: uploadRes.data.url,
              text: `File: ${asset.name}`,
            };
            setAttachments([newAttachment]);
            
            const filePrompt = prompt
              ? `${prompt} [file: ${asset.name}]`
              : `Ekstrak jadwal dari file: ${asset.name}`;
            setPrompt(filePrompt);
            setStatusText(`File uploaded successfully: ${asset.name}`);
          } else {
            Alert.alert('Error', 'Failed to upload file to backend API.');
            setStatusText('Failed to upload file.');
          }
        } catch (uploadErr: any) {
          const errMsg = uploadErr.response?.data?.error?.message || uploadErr.message;
          console.warn('File upload failed, falling back to local simulation:', errMsg);
          
          setAttachedFile({ name: asset.name, type: asset.mimeType || 'document' });
          const mockFileUrl = `https://zaid-assist.my.id/storage/mocks/${asset.name}`;
          setAttachments([{
            type: asset.mimeType?.startsWith('image/') ? 'image' : 'audio_transcription',
            url: mockFileUrl,
            text: `Local mock file: ${asset.name}`
          }]);
          const filePrompt = prompt
            ? `${prompt} [file: ${asset.name}]`
            : `Ekstrak jadwal dari file: ${asset.name}`;
          setPrompt(filePrompt);
          setStatusText(`File attached (local fallback). API Error: ${errMsg}`);
        }
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
    setPreview(null);
    setPrompt('');
    setAttachedFile(null);
    setAttachments(null);
    setStatusText('Saved to Dashboard and Calendar ✓');
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <LinearGradient
        colors={['#E6E3FF', '#F4F5FA', '#FBFAF8']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}>
              <MaterialIcons name="chevron-left" color="#1F2937" size={28} />
            </Pressable>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={ZAID_LOGO}
              style={styles.logo}
            />
            <Text style={styles.brand}>ZAID.</Text>
          </View>

          {/* Quote section */}
          {!isKeyboardVisible && (
            <View style={styles.quoteWrap}>
              <Text style={styles.quote}>{"The time has\npassed so quickly."}</Text>
              <Text style={styles.author}>— Socrates</Text>
            </View>
          )}

          {/* Status chip */}
          <View style={[styles.statusRow, isKeyboardVisible && { marginTop: 16 }]}>
            {isProcessing ? (
              // Animasi 3 titik bergerak naik turun
              <View style={styles.dotsRow}>
                {[dot1, dot2, dot3].map((dot, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.loadingDot,
                      {
                        transform: [{
                          translateY: dot.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -6],
                          }),
                        }],
                        opacity: dot.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.35, 1],
                        }),
                      },
                    ]}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.statusDot} />
            )}
            <Text style={styles.statusText}>{statusText}</Text>
          </View>

          {/* Animasi Success Overlay */}
          {showSuccess && (
            <Animated.View
              style={[
                styles.successOverlay,
                { opacity: successOpacity, transform: [{ scale: successScale }] },
              ]}>
              <View style={styles.successCircle}>
                <MaterialIcons name="check" color="#FFFFFF" size={40} />
              </View>
              <Text style={styles.successLabel}>Schedule Extracted!</Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* Prompt Composer — pinned at bottom */}
        <AiPromptComposer
          isProcessing={isProcessing}
          onAttachFile={handleFilePick}
          onChangePrompt={setPrompt}
          onRecordVoice={() => setVoiceVisible(true)}
          onSubmit={() => processPrompt(prompt)}
          prompt={prompt}
          attachedFile={attachedFile}
          onRemoveAttachedFile={() => {
            setAttachedFile(null);
            setAttachments(null);
            setStatusText('Attachment removed');
          }}
          isKeyboardVisible={isKeyboardVisible}
          bottomInset={insets.bottom}
        />

        {/* Modals */}
        <VoiceRecordingModal
          visible={voiceVisible}
          onDone={handleVoiceDone}
          onCancel={() => setVoiceVisible(false)}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 20,
    justifyContent: 'center',
  },
  loadingDot: {
    backgroundColor: '#665CFF',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  successCircle: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 50,
    height: 80,
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#10B981',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    width: 80,
  },
  successLabel: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  successOverlay: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 16,
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  author: {

    color: '#6B7280',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 18,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  brand: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '700',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginTop: 24,
    position: 'relative',
    width: '100%',
  },
  logo: {
    height: 26,
    width: 26,
  },
  quote: {
    color: '#1F2937',
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 52,
    textAlign: 'center',
  },
  quoteWrap: {
    alignItems: 'center',
    marginTop: 56,
    paddingHorizontal: 32,
  },
  safeArea: {
    backgroundColor: '#FBFAF8',
    flex: 1,
  },
  statusDot: {
    backgroundColor: '#10B981',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusRow: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: '#E5E7EB',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 240,
  },
});

const voiceStyles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(17,24,39,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: '#665CFF',
    borderRadius: 4,
    width: 6,
  },
  cancelBtn: {
    marginTop: 24,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  hintText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  micCircle: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#665CFF',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    width: 80,
  },
  sheet: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 32,
    paddingBottom: 48,
  },
  statusText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  waveform: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 5,
    height: 60,
    marginTop: 28,
  },
});


