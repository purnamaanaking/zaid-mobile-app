import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/store/auth.store';
import { authApi } from '@/src/services/api/auth.api';

export default function ProfileSettingsRoute() {
  const { user, setProfile } = useAuthStore();
  const [draftName, setDraftName] = useState(user?.full_name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!draftName.trim()) return;
    setIsSaving(true);
    try {
      const res = await authApi.updateProfile({ full_name: draftName.trim() });
      if (res.success && res.data) {
        setProfile({
          id: res.data.id,
          email: res.data.email,
          full_name: res.data.full_name,
          avatar_url: res.data.avatar_url ?? undefined,
          phone_number: res.data.phone_number ?? undefined,
          phone_verified: res.data.phone_verified,
          status: res.data.status,
        });
        Alert.alert('Berhasil', 'Profil berhasil diperbarui.');
      }
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.message || err.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kbv}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Kembali" onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text style={styles.title}>Pengaturan Profil</Text>
          <View style={styles.iconSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" color="#FFFFFF" size={34} />
            </View>
            <Pressable style={styles.secondaryButton}>
              <MaterialIcons name="photo-camera" color="#665CFF" size={18} />
              <Text style={styles.secondaryButtonText}>Ubah Foto</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nama</Text>
            <TextInput
              onChangeText={setDraftName}
              placeholder="Nama lengkap"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              value={draftName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              editable={false}
              placeholder="-"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.inputDisabled]}
              value={user?.email ?? ''}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nomor WhatsApp</Text>
            <TextInput
              editable={false}
              placeholder="-"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, styles.inputDisabled]}
              value={user?.phone_number ?? '-'}
            />
          </View>

          <Pressable
            accessibilityLabel="Simpan profil"
            accessibilityRole="button"
            disabled={isSaving || !draftName.trim()}
            onPress={handleSave}
            style={[styles.saveButton, (!draftName.trim() || isSaving) ? styles.saveButtonDisabled : null]}>
            <Text style={styles.saveText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: '#111827', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  avatarRow: { alignItems: 'center', flexDirection: 'row', gap: 14, marginBottom: 10 },
  content: { gap: 16, padding: 24 },
  field: { gap: 7 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  iconButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  iconSpacer: { width: 40 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 12, borderWidth: 1, color: '#111827', fontSize: 15, minHeight: 48, paddingHorizontal: 14 },
  inputDisabled: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  kbv: { flex: 1 },
  label: { color: '#374151', fontSize: 13, fontWeight: '700' },
  safeArea: { backgroundColor: '#FAFAFB', flex: 1 },
  saveButton: { alignItems: 'center', backgroundColor: '#665CFF', borderRadius: 12, height: 48, justifyContent: 'center', marginTop: 12 },
  saveButtonDisabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', borderColor: '#E8E6FF', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  secondaryButtonText: { color: '#665CFF', fontSize: 13, fontWeight: '700' },
  title: { color: '#111827', fontSize: 18, fontWeight: '800' },
});
