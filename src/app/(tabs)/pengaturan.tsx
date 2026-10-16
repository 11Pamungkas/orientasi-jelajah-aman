import { useState } from "react";
import { Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hapusSemuaCache } from "../../services/cacheRepository";
export default function TabPengaturan() {
  const [pesan, setPesan] = useState<string | null>(null);
  async function hapusDataTersimpan() {
    await hapusSemuaCache();
    setPesan("Data cuaca tersimpan sudah dihapus.");
  }
  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Jelajah Aman</Text>
      <Text>Versi 1.0.0</Text>
      <Button title="Hapus Data Cuaca Tersimpan" onPress={hapusDataTersimpan} />
      {pesan && <Text accessibilityLabel={pesan}>{pesan}</Text>}
    </SafeAreaView>
  );
}
