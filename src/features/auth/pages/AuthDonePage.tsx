import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';

type AuthDonePageProps = {
  onContinue: () => void;
};

export function AuthDonePage({ onContinue }: AuthDonePageProps) {
  return (
    <View className="flex-1 items-center">
      <View className="h-[78px] w-[78px] items-center justify-center rounded-3xl bg-[#F0F1FF]">
        <MaterialIcons name="check" size={44} color="#7379FF" />
      </View>
      <Text className="mt-[26px] text-center text-[22px] font-semibold text-[#56575C]">
        You are all set
      </Text>
      <Text className="mt-2.5 text-center text-[15px] leading-[22px] text-[#57575F]">
        Google Calendar and Tasks are ready to sync with ZAID.
      </Text>
      <Button
        accessibilityLabel="Back to welcome"
        className="mt-auto self-stretch"
        onPress={onContinue}>
        Continue
      </Button>
    </View>
  );
}
