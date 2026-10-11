import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabPengaturan() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        Jelajah Aman
      </Text>

      <Text>Versi 1.0.0</Text>
    </SafeAreaView>
  );
}