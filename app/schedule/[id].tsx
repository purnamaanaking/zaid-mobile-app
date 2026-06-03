import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View>
      <ThemedText type="title">Detail Jadwal</ThemedText>
      <ThemedText>{id}</ThemedText>
    </View>
  );
}
