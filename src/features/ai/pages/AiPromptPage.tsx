import { MaterialIcons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AiPromptComposer } from '@/src/features/ai/components/AiPromptComposer';
import { SchedulePreviewModal } from '@/src/features/ai/components/SchedulePreviewModal';
import { addPromptSchedule } from '@/src/features/schedule/store/promptScheduleStore';
import { PromptSchedule } from '@/src/types/schedule.types';

const ZAID_LOGO = require('@/src/components/image/logo-zaid.png');

// ─── Smart NLP Parser ────────────────────────────────────────────────────────

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
  const time = parseTime(prompt);
  const recurring = parseRecurring(prompt);

  return {
    id: `ai-${now.getTime()}`,
    userId: 'user-1',
    title,
    date,
    endDate,
    time,
    endTime: (() => {
      const [h, m] = time.split(':').map(Number);
      return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    })(),
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

    // Animate waveform bars
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

    // After 3s switch to transcribing, then emit transcript
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
    // barAnims and onDone are stable refs/callbacks — excluding them is intentional
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

// ─── File Attachment Drawer ───────────────────────────────────────────────────

const MOCK_FILES = [
  { name: 'jadwal_sprint_mei.pdf', type: 'pdf', size: '142 KB' },
  { name: 'rencana_kegiatan.xlsx', type: 'xlsx', size: '58 KB' },
  { name: 'timeline_project.png', type: 'image', size: '320 KB' },
  { name: 'notulen_rapat.docx', type: 'docx', size: '87 KB' },
  { name: 'proposal_final.pdf', type: 'pdf', size: '2.1 MB' },
];

function fileIcon(type: string): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case 'pdf': return 'picture-as-pdf';
    case 'image': return 'insert-photo';
    case 'xlsx': return 'table-chart';
    default: return 'insert-drive-file';
  }
}

function fileIconColor(type: string): string {
  switch (type) {
    case 'pdf': return '#EF4444';
    case 'image': return '#3B82F6';
    case 'xlsx': return '#10B981';
    default: return '#6B7280';
  }
}

function FileDrawer({
  visible,
  onSelect,
  onCancel,
}: {
  visible: boolean;
  onSelect: (file: { name: string; type: string }) => void;
  onCancel: () => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={fileStyles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={fileStyles.sheet}>
              <View style={fileStyles.handle} />
              <Text style={fileStyles.title}>Attach File</Text>
              <Text style={fileStyles.subtitle}>
                Select a file to attach to your schedule prompt
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                {MOCK_FILES.map((file) => (
                  <Pressable
                    key={file.name}
                    style={fileStyles.fileRow}
                    onPress={() => onSelect({ name: file.name, type: file.type })}>
                    <View
                      style={[
                        fileStyles.fileIcon,
                        { backgroundColor: fileIconColor(file.type) + '22' },
                      ]}>
                      <MaterialIcons
                        name={fileIcon(file.type)}
                        color={fileIconColor(file.type)}
                        size={22}
                      />
                    </View>
                    <View style={fileStyles.fileInfo}>
                      <Text style={fileStyles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={fileStyles.fileSize}>{file.size}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" color="#D1D5DB" size={22} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AiPromptPage() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<PromptSchedule | null>(null);
  const [statusText, setStatusText] = useState('Type, speak, or attach a file to get started');
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [fileDrawerVisible, setFileDrawerVisible] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string } | null>(null);

  function processPrompt(text: string) {
    if (!text.trim()) return;
    setIsProcessing(true);
    setStatusText('AI is analyzing your schedule input...');
    setTimeout(() => {
      setPreview(buildScheduleFromPrompt(text));
      setIsProcessing(false);
      setStatusText('Schedule detected. Please verify before saving.');
    }, 800);
  }

  function handleVoiceDone(transcript: string) {
    setVoiceVisible(false);
    setPrompt(transcript);
    setStatusText(`Voice transcribed: "${transcript.slice(0, 40)}..."`);
    setTimeout(() => processPrompt(transcript), 400);
  }

  function handleFileSelect(file: { name: string; type: string }) {
    setFileDrawerVisible(false);
    setAttachedFile(file);
    const filePrompt = prompt
      ? `${prompt} [file: ${file.name}]`
      : `Ekstrak jadwal dari file: ${file.name}`;
    setPrompt(filePrompt);
    setStatusText(`File attached: ${file.name}`);
  }

  function handleSave() {
    if (!preview) return;
    addPromptSchedule(preview);
    setPreview(null);
    setPrompt('');
    setAttachedFile(null);
    setStatusText('Saved to Dashboard and Calendar ✓');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Brand */}
      <View style={styles.brandRow}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={ZAID_LOGO}
          style={styles.logo}
        />
        <Text style={styles.brand}>ZAID.</Text>
      </View>

      {/* Quote section */}
      <View style={styles.quoteWrap}>
        <Text style={styles.quote}>{"The time has\npassed so quickly."}</Text>
        <Text style={styles.author}>— Socrates</Text>
      </View>

      {/* Status chip */}
      <View style={styles.statusRow}>
        {isProcessing ? (
          <ActivityIndicator color="#665CFF" size="small" />
        ) : (
          <View style={styles.statusDot} />
        )}
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {/* Prompt Composer — pinned at bottom */}
      <AiPromptComposer
        isProcessing={isProcessing}
        onAttachFile={() => setFileDrawerVisible(true)}
        onChangePrompt={setPrompt}
        onRecordVoice={() => setVoiceVisible(true)}
        onSubmit={() => processPrompt(prompt)}
        prompt={prompt}
        attachedFile={attachedFile}
        onRemoveAttachedFile={() => {
          setAttachedFile(null);
          setStatusText('Attachment removed');
        }}
      />

      {/* Modals */}
      <VoiceRecordingModal
        visible={voiceVisible}
        onDone={handleVoiceDone}
        onCancel={() => setVoiceVisible(false)}
      />

      <FileDrawer
        visible={fileDrawerVisible}
        onSelect={handleFileSelect}
        onCancel={() => setFileDrawerVisible(false)}
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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  author: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 18,
    textAlign: 'center',
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

const fileStyles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(17,24,39,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  fileIcon: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  fileInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  fileName: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  fileRow: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  fileSize: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 40,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '60%',
    padding: 22,
    paddingBottom: 40,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  title: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '700',
  },
});
