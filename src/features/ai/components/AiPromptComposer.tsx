import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type AiPromptComposerProps = {
  isProcessing: boolean;
  onAttachFile: () => void;
  onChangePrompt: (value: string) => void;
  onRecordVoice: () => void;
  onSubmit: () => void;
  prompt: string;
  attachedFile: { name: string; type: string } | null;
  onRemoveAttachedFile: () => void;
};

export function AiPromptComposer({
  isProcessing,
  onAttachFile,
  onChangePrompt,
  onRecordVoice,
  onSubmit,
  prompt,
  attachedFile,
  onRemoveAttachedFile,
}: AiPromptComposerProps) {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.logoMark}>
          <MaterialIcons name="auto-awesome" color="#FFFFFF" size={16} />
        </View>
        <Text style={styles.title}>AI Task Assistant</Text>
      </View>

      <TextInput
        accessibilityLabel="Prompt schedule text"
        multiline
        onChangeText={onChangePrompt}
        placeholder="Buatkan task laporan penjualan setiap Jumat jam 10 pagi"
        placeholderTextColor="#6B7280"
        style={styles.input}
        value={prompt}
      />

      {/* Render Attached File Badge if present */}
      {attachedFile && (
        <View style={styles.attachmentBadge}>
          <MaterialIcons
            name={attachedFile.type === 'pdf' ? 'picture-as-pdf' : 'insert-photo'}
            color={attachedFile.type === 'pdf' ? '#EF4444' : '#3B82F6'}
            size={18}
          />
          <Text numberOfLines={1} style={styles.attachmentText}>
            {attachedFile.name}
          </Text>
          <Pressable
            accessibilityLabel="Remove file attachment"
            accessibilityRole="button"
            onPress={onRemoveAttachedFile}
            style={styles.removeAttachmentButton}>
            <MaterialIcons name="close" color="#6B7280" size={14} />
          </Pressable>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Attach schedule file"
          accessibilityRole="button"
          onPress={onAttachFile}
          style={styles.iconButton}>
          <MaterialIcons name="attach-file" color="#665CFF" size={27} />
        </Pressable>
        <View style={styles.rightActions}>
          <Pressable
            accessibilityLabel="Record voice prompt"
            accessibilityRole="button"
            onPress={onRecordVoice}
            style={styles.iconButton}>
            <MaterialIcons name="mic-none" color="#9A8CFF" size={29} />
          </Pressable>
          <Pressable
            accessibilityLabel="Send AI prompt"
            accessibilityRole="button"
            disabled={isProcessing || (!prompt.trim() && !attachedFile)}
            onPress={onSubmit}
            style={[
              styles.sendButton,
              isProcessing || (!prompt.trim() && !attachedFile) ? styles.sendDisabled : null,
            ]}>
            <MaterialIcons name={isProcessing ? 'hourglass-empty' : 'send'} color="#FFFFFF" size={24} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#665CFF',
    borderRadius: 14,
    borderWidth: 1.5,
    bottom: 34,
    left: 24,
    padding: 18,
    position: 'absolute',
    right: 24,
    shadowColor: '#665CFF',
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
    backgroundColor: '#F0F2F6',
    borderRadius: 14,
    color: '#273044',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 14,
    minHeight: 80,
    padding: 16,
    textAlignVertical: 'top',
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    height: 21,
    justifyContent: 'center',
    width: 21,
  },
  rightActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#665CFF',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  sendDisabled: {
    opacity: 0.48,
  },
  title: {
    color: '#665CFF',
    fontSize: 16,
    fontWeight: '700',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 6,
  },
  attachmentText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  removeAttachmentButton: {
    padding: 2,
  },
});
