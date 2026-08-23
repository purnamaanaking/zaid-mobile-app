import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts } from '@/src/constants/typography';

type AiPromptComposerProps = {
  isProcessing: boolean;
  onAttachFile: () => void;
  onChangePrompt: (value: string) => void;
  onSubmit: () => void;
  prompt: string;
  attachedFile: { name: string; type: string; uri?: string } | null;
  onRemoveAttachedFile: () => void;
  bottomInset?: number;
};

export function AiPromptComposer({
  isProcessing,
  onAttachFile,
  onChangePrompt,
  onSubmit,
  prompt,
  attachedFile,
  onRemoveAttachedFile,
  bottomInset = 0,
}: AiPromptComposerProps) {
  const restMargin = bottomInset > 0
    ? bottomInset + 12
    : (Platform.OS === 'ios' ? 24 : 12);

  return (
    <View style={[styles.card, { marginBottom: restMargin }]}>
      {/* Render Attached File Badge if present */}
      {attachedFile && (
        <View style={styles.attachmentBadge}>
          {attachedFile.uri && attachedFile.type.startsWith('image/') ? (
            <Image source={{ uri: attachedFile.uri }} style={styles.attachmentThumb} />
          ) : (
            <MaterialIcons
              name={attachedFile.type.includes('pdf') ? 'picture-as-pdf' : attachedFile.type.startsWith('image/') ? 'insert-photo' : 'insert-drive-file'}
              color={attachedFile.type.includes('pdf') ? '#EF4444' : attachedFile.type.startsWith('image/') ? '#3B82F6' : '#6B7280'}
              size={18}
            />
          )}
          <Text numberOfLines={1} style={styles.attachmentText}>
            {attachedFile.name}
          </Text>
          <Pressable
            accessibilityLabel="Hapus lampiran file"
            accessibilityRole="button"
            onPress={onRemoveAttachedFile}
            style={styles.removeAttachmentButton}>
            <MaterialIcons name="close" color="#6B7280" size={14} />
          </Pressable>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Lampirkan file jadwal"
          accessibilityRole="button"
          onPress={onAttachFile}
          style={styles.iconButton}>
          <MaterialIcons name="attach-file" color="#665CFF" size={27} />
        </Pressable>
        <TextInput
          accessibilityLabel="Teks perintah jadwal"
          multiline
          onChangeText={onChangePrompt}
          placeholder="Tulis pesan ke ZAID AI..."
          placeholderTextColor="#8A93A5"
          style={styles.input}
          value={prompt}
        />
        <Pressable
          accessibilityLabel="Kirim pesan AI"
          accessibilityRole="button"
          disabled={isProcessing || (!prompt.trim() && !attachedFile)}
          onPress={onSubmit}
          style={[
            styles.sendButton,
            isProcessing || (!prompt.trim() && !attachedFile) ? styles.sendDisabled : null,
          ]}>
          <MaterialIcons name={isProcessing ? 'hourglass-empty' : 'send'} color="#FFFFFF" size={22} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6E8F0',
    borderRadius: 24,
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#1D2433',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  iconButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    color: '#273044',
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 112,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlignVertical: 'center',
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendDisabled: {
    opacity: 0.48,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 6,
  },
  attachmentText: {
    color: '#374151',
    fontFamily: Fonts.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  attachmentThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  removeAttachmentButton: {
    padding: 2,
  },
});
