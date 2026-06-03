import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { Colors } from '@/src/constants/colors';

type DashboardSearchProps = {
  onChangeSearch: (value: string) => void;
  search: string;
};

export function DashboardSearch({ onChangeSearch, search }: DashboardSearchProps) {
  return (
    <View style={styles.searchBox}>
      <TextInput
        accessibilityLabel="Search schedule"
        onChangeText={onChangeSearch}
        placeholder="Search schedule"
        placeholderTextColor="#A4ADBF"
        style={styles.searchInput}
        value={search}
      />
      <MaterialIcons name="search" color="#C1C8D6" size={26} />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    flexDirection: 'row',
    height: 40,
    marginTop: 26,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: Colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: 40,
    padding: 0,
  },
});
