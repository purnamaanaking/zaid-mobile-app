import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function ScheduleEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View>
      <ThemedText type="title">Edit Jadwal</ThemedText>
      <ThemedText>{id}</ThemedText>
    </View>
  );
}
