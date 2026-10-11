
import { useState, useCallback } from "react";
import { View, Text, Button, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ambilSemuaFavorit,
  hapusFavorit,
} from "../../services/favoritStorage";
import { KotaFavorit } from "../../types/favorit";

export default function TabRiwayat() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);

  useFocusEffect(
    useCallback(() => {
      ambilSemuaFavorit().then(setDaftarFavorit);
    }, []),
  );

  function konfirmasiHapus(id: number, namaKota: string) {
    Alert.alert(
      "Konfirmasi Hapus",
      `Yakin hapus ${namaKota}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            hapus(id);
          },
        },
      ],
      { cancelable: true },
    );
  }

  async function hapus(id: number) {
    await hapusFavorit(id);

    setDaftarFavorit((prev) =>
      prev.filter((kota) => kota.id !== id),
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, padding: 16, gap: 12 }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>
        Kota Favorit
      </Text>

      <Text>
        Tersimpan {daftarFavorit.length} kota
      </Text>

      {daftarFavorit.length === 0 && (
        <Text>Belum ada kota favorit</Text>
      )}

      {daftarFavorit.map((kota) => (
        <View
          key={kota.id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text>{kota.nama}</Text>

          <Button
            title="Hapus"
            color="red"
            onPress={() =>
              konfirmasiHapus(kota.id, kota.nama)
            }
          />
        </View>
      ))}
    </SafeAreaView>
  );
}
