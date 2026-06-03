import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

export function ProfileHeaderCard() {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <MaterialIcons name="person" color="#FFFFFF" size={42} />
      </View>
      <View>
        <Text style={styles.name}>Adam Smith</Text>
        <Text style={styles.handle}>adam.smith@gmail.com</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#F07D7D',
    borderColor: '#FFFFFF',
    borderRadius: 31,
    borderWidth: 3,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#625DFF',
    borderRadius: 5,
    elevation: 8,
    flexDirection: 'row',
    gap: 14,
    minHeight: 98,
    paddingHorizontal: 18,
    shadowColor: '#625DFF',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  handle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
