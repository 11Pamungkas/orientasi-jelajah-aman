import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ambilSemuaFavorit, hapusFavorit } from "../../services/favoritStorage";
import {
  ambilRiwayatPencarian,
  hapusSatuRiwayatPencarian,
  bersihkanRiwayatPencarian,
  ItemRiwayatPencarian,
} from "../../services/riwayatPencarianService";
import {
  hapusCacheKotaByCoords,
  ambilCache,
} from "../../services/cacheRepository";
import { ambilCuaca } from "../../services/weatherService";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { formatWaktuCache } from "../../services/cacheService";
import { cekKoneksiInternet } from "../../services/networkService";
import { KotaFavorit } from "../../types/favorit";
import { DataCuacaLengkap, DataKualitasUdara } from "../../types/weather";
import { useAppTheme } from "../../context/ThemeContext";

interface CuacaFavorit {
  cuaca: DataCuacaLengkap;
  aqi: DataKualitasUdara;
  dariCache: boolean;
  waktuCache?: string;
  punyaCacheDb?: boolean;
}

export default function TabRiwayat() {
  const { colors } = useAppTheme();

  // Mode tab aktif: "riwayat" atau "favorit"
  const [tabAktif, setTabAktif] = useState<"riwayat" | "favorit">("riwayat");

  const [daftarRiwayat, setDaftarRiwayat] = useState<ItemRiwayatPencarian[]>([]);
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);
  const [cuacaMap, setCuacaMap] = useState<Record<number, CuacaFavorit>>({});

  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [sedangOffline, setSedangOffline] = useState(false);
  const [pesanNotif, setPesanNotif] = useState<string | null>(null);

  const tampilkanNotif = (teks: string) => {
    setPesanNotif(teks);
    setTimeout(() => setPesanNotif(null), 3500);
  };

  const muatData = useCallback(async () => {
    setSedangMemuat(true);

    const online = await cekKoneksiInternet();
    setSedangOffline(!online);

    // Ambil data riwayat pencarian dan daftar favorit
    const [riwayat, favorit] = await Promise.all([
      ambilRiwayatPencarian(),
      ambilSemuaFavorit(),
    ]);

    setDaftarRiwayat(riwayat);
    setDaftarFavorit(favorit);

    // Muat cuaca untuk kota favorit
    const mapBaru: Record<number, CuacaFavorit> = {};
    await Promise.all(
      favorit.map(async (kota) => {
        try {
          const [hasilCuaca, hasilAQI, cacheDb] = await Promise.all([
            ambilCuaca(kota.latitude, kota.longitude),
            ambilKualitasUdara(kota.latitude, kota.longitude),
            ambilCache(kota.latitude, kota.longitude),
          ]);

          mapBaru[kota.id] = {
            cuaca: hasilCuaca.data,
            aqi: hasilAQI.data,
            dariCache: hasilCuaca.dariCache || hasilAQI.dariCache,
            waktuCache: hasilCuaca.waktuCache ?? hasilAQI.waktuCache,
            punyaCacheDb: cacheDb !== null,
          };
        } catch {
          // Gagal memuat cuaca untuk kota ini
        }
      })
    );

    setCuacaMap(mapBaru);
    setSedangMemuat(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      muatData();
    }, [muatData])
  );

  // Konfirmasi & Hapus Kota dari Favorit
  function konfirmasiHapusFavorit(id: number, namaKota: string) {
    const aksiHapus = async () => {
      await hapusFavorit(id);
      setDaftarFavorit((prev) => prev.filter((k) => k.id !== id));
      setCuacaMap((prev) => {
        const baru = { ...prev };
        delete baru[id];
        return baru;
      });
      tampilkanNotif(`Kota ${namaKota} dihapus dari daftar favorit.`);
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Yakin hapus ${namaKota} dari daftar favorit?`)) {
        aksiHapus();
      }
      return;
    }

    Alert.alert(
      "Konfirmasi Hapus Favorit",
      `Yakin ingin menghapus ${namaKota} dari daftar favorit?`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: aksiHapus },
      ]
    );
  }

  // Konfirmasi & Hapus Cache Kota tertentu (Tanpa menghapus kota dari favorit/riwayat)
  function konfirmasiHapusCacheKota(namaKota: string, lat: number, lon: number) {
    const aksiHapus = async () => {
      const berhasil = await hapusCacheKotaByCoords(lat, lon);
      if (berhasil) {
        tampilkanNotif(`Cache data cuaca kota ${namaKota} berhasil dihapus.`);
        muatData();
      } else {
        tampilkanNotif(`Tidak ada cache data cuaca tersimpan untuk kota ${namaKota}.`);
      }
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`Yakin ingin menghapus cache data cuaca kota ${namaKota}?`)) {
        aksiHapus();
      }
      return;
    }

    Alert.alert(
      "Konfirmasi Hapus Cache",
      `Yakin ingin menghapus cache data cuaca kota ${namaKota}? Tindakan ini tidak akan menghapus kota dari daftar favorit atau riwayat.`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus Cache", style: "destructive", onPress: aksiHapus },
      ]
    );
  }

  // Hapus satu item riwayat pencarian
  async function aksiHapusSatuRiwayat(id: number, nama: string) {
    await hapusSatuRiwayatPencarian(id);
    setDaftarRiwayat((prev) => prev.filter((item) => item.id !== id));
    tampilkanNotif(`Pencarian ${nama} dihapus dari riwayat.`);
  }

  // Kosongkan seluruh riwayat pencarian
  function konfirmasiBersihkanRiwayat() {
    const aksiBersihkan = async () => {
      await bersihkanRiwayatPencarian();
      setDaftarRiwayat([]);
      tampilkanNotif("Seluruh riwayat pencarian telah dibersihkan.");
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Yakin ingin menghapus semua riwayat pencarian?")) {
        aksiBersihkan();
      }
      return;
    }

    Alert.alert(
      "Bersihkan Riwayat Pencarian",
      "Apakah Anda yakin ingin menghapus seluruh 10 riwayat pencarian terakhir?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Bersihkan", style: "destructive", onPress: aksiBersihkan },
      ]
    );
  }

  // Klik item riwayat -> navigasi ke Beranda untuk memuat kota tersebut
  function klikPilihKota(kota: { id: number; nama: string; latitude: number; longitude: number; country?: string }) {
    router.push({
      pathname: "/",
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom", "left", "right"]}>
      {/* Segmented Control Tab: Riwayat Pencarian vs Kota Favorit */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.card,
            borderRadius: 10,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <TouchableOpacity
            onPress={() => setTabAktif("riwayat")}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              borderRadius: 8,
              backgroundColor: tabAktif === "riwayat" ? colors.primary : "transparent",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Ionicons
              name="time"
              size={16}
              color={tabAktif === "riwayat" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={{
                color: tabAktif === "riwayat" ? "#FFFFFF" : colors.textSecondary,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              Riwayat ({daftarRiwayat.length}/10)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTabAktif("favorit")}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              borderRadius: 8,
              backgroundColor: tabAktif === "favorit" ? colors.primary : "transparent",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Ionicons
              name="bookmark"
              size={16}
              color={tabAktif === "favorit" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={{
                color: tabAktif === "favorit" ? "#FFFFFF" : colors.textSecondary,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              Favorit ({daftarFavorit.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner Offline */}
      {sedangOffline && (
        <View style={{ marginHorizontal: 16, marginTop: 6, backgroundColor: colors.statusBasiBg, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.statusBasiText + "40" }}>
          <Text style={{ color: colors.statusBasiText, fontSize: 12, textAlign: "center", fontWeight: "600" }}>
            ⚠️ Mode Offline: Menampilkan data cuaca yang tersimpan di perangkat
          </Text>
        </View>
      )}

      {/* Notifikasi feedback aksi */}
      {pesanNotif && (
        <View style={{ marginHorizontal: 16, marginTop: 6, backgroundColor: colors.statusSegarBg, padding: 8, borderRadius: 8 }}>
          <Text style={{ color: colors.statusSegarText, fontSize: 12, textAlign: "center", fontWeight: "500" }}>
            ✓ {pesanNotif}
          </Text>
        </View>
      )}

      {sedangMemuat && (
        <View style={{ alignItems: "center", padding: 24 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13 }}>
            Memuat data...
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* ============================================================== */}
        {/* TAB 1: RIWAYAT PENCARIAN TERAKHIR (MAKS 10 KOTA)              */}
        {/* ============================================================== */}
        {tabAktif === "riwayat" && !sedangMemuat && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                Menampilkan maksimal 10 kota yang terakhir berhasil dicari:
              </Text>
              {daftarRiwayat.length > 0 && (
                <TouchableOpacity onPress={konfirmasiBersihkanRiwayat}>
                  <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "600" }}>
                    Bersihkan Semua
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {daftarRiwayat.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  padding: 32,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <Ionicons name="search-outline" size={44} color={colors.textSecondary} />
                <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>
                  Belum Ada Riwayat Pencarian
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
                  Cari dan muat cuaca kota di halaman Beranda. Maksimal 10 pencarian terakhir akan otomatis disimpan di sini.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/")}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>
                    Buka Halaman Beranda
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              daftarRiwayat.map((item, index) => {
                const menitLalu = Math.floor((Date.now() - item.waktuPencarian) / 60000);
                const infoWaktu =
                  menitLalu < 1 ? "Baru saja" : menitLalu < 60 ? `${menitLalu} mnt lalu` : `${Math.floor(menitLalu / 60)} jam lalu`;

                return (
                  <View
                    key={`riwayat-${item.id}-${index}`}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 10,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => klikPilihKota(item)}
                      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: colors.background,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                          {item.nama}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                          {item.country ? `${item.country} • ` : ""}{infoWaktu}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      {/* Tombol Hapus Cache Kota */}
                      <TouchableOpacity
                        onPress={() => konfirmasiHapusCacheKota(item.nama, item.latitude, item.longitude)}
                        accessibilityLabel={`Hapus cache kota ${item.nama}`}
                        style={{ padding: 6 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>

                      {/* Tombol Hapus dari Riwayat */}
                      <TouchableOpacity
                        onPress={() => aksiHapusSatuRiwayat(item.id, item.nama)}
                        accessibilityLabel={`Hapus ${item.nama} dari riwayat`}
                        style={{ padding: 6 }}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DAFTAR KOTA FAVORIT                                    */}
        {/* ============================================================== */}
        {tabAktif === "favorit" && !sedangMemuat && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Tersimpan {daftarFavorit.length} kota favorit:
            </Text>

            {daftarFavorit.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  padding: 32,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <Ionicons name="bookmark-outline" size={44} color={colors.textSecondary} />
                <Text style={{ fontWeight: "700", fontSize: 16, color: colors.text }}>
                  Belum Ada Kota Favorit
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
                  Tambahkan kota ke favorit melalui tombol "Tambahkan ke Favorit" saat melihat cuaca kota di halaman Beranda.
                </Text>
              </View>
            ) : (
              daftarFavorit.map((kota) => {
                const data = cuacaMap[kota.id];

                return (
                  <View
                    key={kota.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      gap: 10,
                    }}
                  >
                    {/* Header Kota & Aksi */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                        <Ionicons name="star" size={18} color="#EAB308" />
                        <Text style={{ fontWeight: "700", fontSize: 17, color: colors.text }}>
                          {kota.nama}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {/* Tombol Hapus Cache per Kota */}
                        <TouchableOpacity
                          onPress={() => konfirmasiHapusCacheKota(kota.nama, kota.latitude, kota.longitude)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            paddingHorizontal: 8,
                            paddingVertical: 5,
                            borderRadius: 6,
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <Ionicons name="trash-outline" size={14} color={colors.danger} />
                          <Text style={{ fontSize: 11, color: colors.danger, fontWeight: "500" }}>
                            Cache
                          </Text>
                        </TouchableOpacity>

                        {/* Tombol Hapus Favorit */}
                        <TouchableOpacity
                          onPress={() => konfirmasiHapusFavorit(kota.id, kota.nama)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 6,
                            backgroundColor: colors.dangerBg,
                          }}
                        >
                          <Text style={{ color: colors.danger, fontSize: 11, fontWeight: "600" }}>
                            Hapus
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Data Cuaca Kota Favorit */}
                    {data ? (
                      <View style={{ gap: 4, paddingTop: 4 }}>
                        <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.text }}>
                          {data.cuaca.saatIni.suhu}°C
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                          {labelKodeCuaca(data.cuaca.saatIni.kodeCuaca)} • Angin {data.cuaca.saatIni.kecepatanAngin} km/j
                        </Text>
                        <Text
                          style={{
                            color:
                              konversiTingkatAQI(data.aqi.indeksAQI) === "BAIK"
                                ? "#10B981"
                                : konversiTingkatAQI(data.aqi.indeksAQI) === "SEDANG"
                                  ? "#F59E0B"
                                  : konversiTingkatAQI(data.aqi.indeksAQI) === "TIDAK_SEHAT"
                                    ? "#F97316"
                                    : "#EF4444",
                            fontSize: 13,
                            fontWeight: "600",
                          }}
                        >
                          AQI: {data.aqi.indeksAQI} ({konversiTingkatAQI(data.aqi.indeksAQI)})
                        </Text>

                        {data.dariCache && data.waktuCache && (
                          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                            📦 Cache • {formatWaktuCache(data.waktuCache)}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={{ color: colors.textSecondary, fontStyle: "italic", fontSize: 13 }}>
                        Data cuaca belum tersedia
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
