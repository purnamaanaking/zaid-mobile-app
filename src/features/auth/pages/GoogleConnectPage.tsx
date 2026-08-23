import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { PermissionItem } from '@/src/features/auth/components/AuthShared';

type GoogleConnectPageProps = {
  isCompactHeight: boolean;
  onAllowAccess: () => void;
};

export function GoogleConnectPage({ isCompactHeight, onAllowAccess }: GoogleConnectPageProps) {
  return (
    <View className="flex-1 items-center">
      <View className="h-[78px] w-[78px] items-center justify-center rounded-3xl bg-[#F0F1FF]">
        <MaterialIcons name="event-available" size={38} color="#7379FF" />
      </View>
      <Text className="mt-[26px] text-center text-[22px] font-semibold text-[#56575C]">
        Hubungkan Google
      </Text>
      <Text className="mt-2.5 text-center text-[15px] leading-[22px] text-[#57575F]">
        Izinkan ZAID menghubungkan Google Calendar dan Google Tasks untuk pengingat.
      </Text>
      <View className="self-stretch gap-3" style={{ marginTop: isCompactHeight ? 30 : 46 }}>
        <PermissionItem icon="calendar-month" label="Google Calendar" />
        <PermissionItem icon="task-alt" label="Google Tasks" />
      </View>
      <Button
        accessibilityLabel="Hubungkan Google Calendar dan Tasks"
        className="mt-10 self-stretch"
        onPress={onAllowAccess}>
        Izinkan Akses
      </Button>
    </View>
  );
}
