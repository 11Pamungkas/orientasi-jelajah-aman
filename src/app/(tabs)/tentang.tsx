// src/app/(tabs)/tentang.tsx
import { View, Text } from "react-native";
import { typeScale, spacing } from "../../constants/styles";

export default function TabTentang() {
  return (
    <View style={{ padding: spacing.sedang }}>
      <Text
        accessible
        accessibilityLabel="Judul halaman Tentang aplikasi Jelajah Aman"
        style={{ fontSize: typeScale.judul, fontWeight: "bold" }}
      >
        Jelajah Aman
      </Text>
      <Text style={{ fontSize: typeScale.isi }}>Versi 1.0.0</Text>
      <Text style={{ fontSize: typeScale.isi }}>Dibuat oleh: Rangga</Text>
    </View>
  );
}