import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { formatWaktuCache } from "../../services/cacheService";
import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import { cekKoneksiInternet } from "../../services/networkService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { ambilCuaca } from "../../services/weatherService";
import { KotaFavorit } from "../../types/favorit";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";

interface CuacaFavorit {
  cuaca: DataCuacaLengkap;
  aqi: DataKualitasUdara;
  dariCache: boolean;
  waktuCache?: string;
}

export default function TabRiwayat() {
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [cuacaMap, setCuacaMap] = useState<Record<number, CuacaFavorit>>({});
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [sedangOffline, setSedangOffline] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let masihAktif = true;

      async function muatData() {
        setSedangMemuat(true);

        // Cek koneksi
        const online = await cekKoneksiInternet();
        if (masihAktif) setSedangOffline(!online);

        // Ambil daftar favorit
        const favorit = await ambilSemuaFavorit();
        if (!masihAktif) return;
        setDaftarFavorit(favorit);

        // Ambil cuaca untuk setiap kota favorit (dari API atau cache)
        const mapBaru: Record<number, CuacaFavorit> = {};

        await Promise.all(
          favorit.map(async (kota) => {
            try {
              const [hasilCuaca, hasilAQI] = await Promise.all([
                ambilCuaca(kota.latitude, kota.longitude),
                ambilKualitasUdara(kota.latitude, kota.longitude),
              ]);

              mapBaru[kota.id] = {
                cuaca: hasilCuaca.data,
                aqi: hasilAQI.data,
                dariCache: hasilCuaca.dariCache || hasilAQI.dariCache,
                waktuCache: hasilCuaca.waktuCache ?? hasilAQI.waktuCache,
              };
            } catch {
              // Tidak ada data (online maupun cache) — lewati
            }
          }),
        );

        if (masihAktif) {
          setCuacaMap(mapBaru);
          setSedangMemuat(false);
        }
      }

      muatData();

      return () => {
        masihAktif = false;
      };
    }, []),
  );

  function konfirmasiHapus(id: number, namaKota: string) {
    if (Platform.OS === "web") {
      const setuju =
        typeof window !== "undefined"
          ? window.confirm(`Yakin hapus ${namaKota}?`)
          : true;
      if (setuju) {
        hapus(id);
      }
      return;
    }

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

    setDaftarFavorit((prev) => prev.filter((kota) => kota.id !== id));

    // Hapus juga dari cuacaMap
    setCuacaMap((prev) => {
      const baru = { ...prev };
      delete baru[id];
      return baru;
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Kota Favorit</Text>

      <Text>Tersimpan {daftarFavorit.length} kota</Text>

      {/* Banner offline */}
      {sedangOffline && (
        <View
          style={{
            backgroundColor: "#FFF3CD",
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#FFECB5",
          }}
        >
          <Text style={{ color: "#856404", fontWeight: "bold", fontSize: 13 }}>
            Offline
          </Text>     
        </View>
      )}

      {sedangMemuat && (
        <View style={{ alignItems: "center", padding: 16 }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#888" }}>
            Memuat data cuaca favorit...
          </Text>
        </View>
      )}

      {!sedangMemuat && daftarFavorit.length === 0 && (
        <Text>Belum ada kota favorit</Text>
      )}

      {!sedangMemuat && (
        <ScrollView style={{ flex: 1 }}>
          {daftarFavorit.map((kota) => {
            const data = cuacaMap[kota.id];

            return (
              <View
                key={kota.id}
                style={{
                  backgroundColor: "#F4F7FA",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 12,
                }}
              >
                {/* Header: nama kota + tombol hapus */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    {kota.nama}
                  </Text>

                  <Button
                    title="Hapus"
                    color="red"
                    onPress={() => konfirmasiHapus(kota.id, kota.nama)}
                  />
                </View>

                {/* Data cuaca */}
                {data ? (
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 28, fontWeight: "bold" }}>
                      {data.cuaca.saatIni.suhu}°C
                    </Text>
                    <Text style={{ color: "#555" }}>
                      {labelKodeCuaca(data.cuaca.saatIni.kodeCuaca)} • Angin{" "}
                      {data.cuaca.saatIni.kecepatanAngin} km/j
                    </Text>
                    <Text
                      style={{
                        color:
                          konversiTingkatAQI(data.aqi.indeksAQI) === "BAIK"
                            ? "green"
                            : konversiTingkatAQI(data.aqi.indeksAQI) ===
                                "SEDANG"
                              ? "goldenrod"
                              : konversiTingkatAQI(data.aqi.indeksAQI) ===
                                  "TIDAK_SEHAT"
                                ? "orange"
                                : "crimson",
                        fontSize: 13,
                      }}
                    >
                      AQI: {data.aqi.indeksAQI} (
                      {konversiTingkatAQI(data.aqi.indeksAQI)})
                    </Text>

                    {data.dariCache && data.waktuCache && (
                      <Text
                        style={{ color: "#888", fontSize: 11, marginTop: 4 }}
                      >
                        📦 Cache • {formatWaktuCache(data.waktuCache)}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={{ color: "#888", fontStyle: "italic" }}>
                    Data cuaca tidak tersedia
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
