import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";
import AtribusiCuaca from "../../components/AtribusiCuaca";
import StatusData from "../../components/StatusData";
import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import {
  ambilCuacaOfflineFirst,
  BATAS_CACHE_MS,
} from "../../services/cuacaRepository";
import {
  bersihkanCacheLama,
  daftarKotaTersimpan,
  hapusCacheKota,
} from "../../services/cacheRepository";
import {
  mintaIzinLokasi,
  ambilKoordinatSaatIni,
} from "../../services/locationService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../constants/weatherCodes";
import { HasilGeocoding } from "../../types/geocoding";
import { HasilCuacaOffline, RingkasanKotaTersimpan } from "../../types/cache";
import {
  ambilRiwayatPencarian,
  tambahRiwayatPencarian,
  ItemRiwayatPencarian,
} from "../../services/riwayatPencarianService";
import { ambilSemuaFavorit } from "../../services/favoritStorage";
import { KotaFavorit } from "../../types/favorit";
import { useAppTheme } from "../../context/ThemeContext";

export default function HalamanUtama() {
  const { colors } = useAppTheme();

  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<HasilGeocoding[]>([]);
  const [kotaTerpilih, setKotaTerpilih] = useState<HasilGeocoding | null>(null);
  const [hasil, setHasil] = useState<HasilCuacaOffline | null>(null);
  const [kotaTersimpan, setKotaTersimpan] = useState<RingkasanKotaTersimpan[]>([]);
  const [riwayatPencarian, setRiwayatPencarian] = useState<ItemRiwayatPencarian[]>([]);
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);

  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);
  const [notifSukses, setNotifSukses] = useState<string | null>(null);

  const teksTertunda = useDebounce(teksCari, 500);
  const requestIdRef = useRef(0);

  async function muatDataPendukung() {
    try {
      const [tersimpan, riwayat, favorit] = await Promise.all([
        daftarKotaTersimpan(),
        ambilRiwayatPencarian(),
        ambilSemuaFavorit(),
      ]);
      setKotaTersimpan(tersimpan);
      setRiwayatPencarian(riwayat);
      setDaftarFavorit(favorit);
    } catch (err) {
      console.error("Gagal memuat data pendukung:", err);
    }
  }

  // Refresh data saat tab aktif
  useFocusEffect(
    useCallback(() => {
      muatDataPendukung();
    }, [])
  );

  // Bersihkan cache > 7 hari saat pertama buka
  useEffect(() => {
    bersihkanCacheLama(BATAS_CACHE_MS)
      .then(muatDataPendukung)
      .catch(() => {});
  }, []);

  // Pencarian otomatis saat teks berubah (debounced)
  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      setHasilPencarian([]);
      return;
    }
    cariKota(teksTertunda)
      .then(setHasilPencarian)
      .catch(() => setHasilPencarian([]));
  }, [teksTertunda]);

  // Cek apakah kota terpilih sudah di favorit
  const sudahFavorit =
    kotaTerpilih !== null &&
    daftarFavorit.some((fav) => fav.id === kotaTerpilih.id);

  async function pilihKota(kota: HasilGeocoding, paksaPerbarui = false) {
    setKotaTerpilih(kota);
    setTeksCari("");
    setHasilPencarian([]);
    const idSaatIni = ++requestIdRef.current;
    setSedangMemuat(true);
    setPesanError(null);
    setNotifSukses(null);

    try {
      const data = await ambilCuacaOfflineFirst(
        {
          id: kota.id,
          nama: kota.name,
          latitude: kota.latitude,
          longitude: kota.longitude,
        },
        { paksaPerbarui }
      );

      if (idSaatIni !== requestIdRef.current) return;
      setHasil(data);

      // Simpan ke riwayat pencarian (maksimal 10) hanya saat berhasil dimuat
      await tambahRiwayatPencarian(kota);
      muatDataPendukung();
    } catch {
      if (idSaatIni !== requestIdRef.current) return;
      setHasil(null);
      setPesanError(
        "Belum ada data tersimpan dan tidak ada koneksi internet. Sambungkan internet lalu coba lagi."
      );
    } finally {
      if (idSaatIni === requestIdRef.current) setSedangMemuat(false);
    }
  }

  async function gunakanLokasiSaatIni() {
    setSedangMemuat(true);
    setPesanLokasi(null);
    setPesanError(null);

    try {
      const status = await mintaIzinLokasi();
      if (status === "denied") {
        setPesanLokasi("Izin lokasi ditolak. Silakan berikan izin lokasi di pengaturan atau cari kota secara manual.");
        return;
      }
      if (status === "unavailable") {
        setPesanLokasi("Layanan lokasi (GPS) tidak aktif di perangkat ini. Silakan aktifkan GPS atau cari kota secara manual.");
        return;
      }

      setPesanLokasi(null);
      const koordinat = await ambilKoordinatSaatIni();

      const bagianWilayah = [koordinat.namaKota, koordinat.provinsi].filter(Boolean);
      const namaWilayah = bagianWilayah.length > 0 ? bagianWilayah.join(", ") : "Lokasi Saat Ini";
      const namaTampil = `${namaWilayah} (Lokasi Saat Ini)`;

      setPesanLokasi(
        `✓ Lokasi berhasil ditentukan dari GPS HP: ${namaWilayah} (${koordinat.latitude.toFixed(4)}, ${koordinat.longitude.toFixed(4)}).`
      );

      const kotaId =
        Math.round(Math.abs(koordinat.latitude * 1000 + koordinat.longitude * 1000)) || -1;

      await pilihKota(
        {
          id: kotaId,
          name: namaTampil,
          latitude: koordinat.latitude,
          longitude: koordinat.longitude,
          country: koordinat.provinsi || "Indonesia",
        },
        true
      );
    } catch (err: unknown) {
      const pesan =
        err instanceof Error
          ? err.message
          : "Gagal mendeteksi lokasi saat ini. Silakan coba lagi.";
      setPesanLokasi(pesan);
    } finally {
      setSedangMemuat(false);
    }
  }

  // Penghapusan cache kota tertentu dengan konfirmasi dialog
  function konfirmasiHapusCacheKota(kunci: string, namaKota: string) {
    const aksiHapus = async () => {
      const berhasil = await hapusCacheKota(kunci);
      if (berhasil) {
        setNotifSukses(`Cache data cuaca kota ${namaKota} berhasil dihapus.`);
        setTimeout(() => setNotifSukses(null), 3500);
        muatDataPendukung();
      } else {
        setPesanError(`Gagal menghapus cache kota ${namaKota}.`);
      }
    };

    if (Platform.OS === "web") {
      if (
        typeof window !== "undefined" &&
        window.confirm(`Yakin ingin menghapus cache data cuaca kota ${namaKota}?`)
      ) {
        aksiHapus();
      }
      return;
    }

    Alert.alert(
      "Konfirmasi Hapus Cache",
      `Yakin ingin menghapus cache data cuaca kota ${namaKota}?`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: aksiHapus },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Kolom Pencarian */}
        <SearchBox onCari={setTeksCari} />

        {/* Tombol Lokasi Saat Ini */}
        <TouchableOpacity
          onPress={gunakanLokasiSaatIni}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: colors.card,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <Ionicons name="navigate" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
            Gunakan Lokasi Saat Ini
          </Text>
        </TouchableOpacity>

        {pesanLokasi && (
          <View style={{ backgroundColor: colors.card, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }} accessibilityLabel={pesanLokasi}>
              {pesanLokasi}
            </Text>
          </View>
        )}

        {/* Notifikasi Sukses Hapus Cache */}
        {notifSukses && (
          <View style={{ backgroundColor: colors.statusSegarBg, padding: 10, borderRadius: 8 }}>
            <Text style={{ color: colors.statusSegarText, fontSize: 13, fontWeight: "500" }}>
              ✓ {notifSukses}
            </Text>
          </View>
        )}

        {/* Hasil Pencarian Dropdown */}
        {hasilPencarian.length > 0 && (
          <View style={{ backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" }}>
            {hasilPencarian.map((kota, index) => (
              <TouchableOpacity
                key={kota.id}
                onPress={() => pilihKota(kota)}
                style={{
                  padding: 14,
                  borderBottomWidth: index < hasilPencarian.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Ionicons name="location-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "500" }}>
                    {kota.name}
                  </Text>
                  {kota.admin1 && (
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {kota.admin1}, {kota.country}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Riwayat Pencarian Terakhir (Maksimal 10) */}
        {riwayatPencarian.length > 0 && hasilPencarian.length === 0 && !kotaTerpilih && (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>
                  Riwayat Pencarian Terakhir
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {riwayatPencarian.length}/10 kota
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {riwayatPencarian.map((item) => (
                <TouchableOpacity
                  key={`history-${item.id}`}
                  onPress={() =>
                    pilihKota({
                      id: item.id,
                      name: item.nama,
                      latitude: item.latitude,
                      longitude: item.longitude,
                      country: item.country ?? "",
                    })
                  }
                  style={{
                    backgroundColor: colors.card,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Ionicons name="search-outline" size={13} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: "500" }}>
                    {item.nama}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Daftar Kota Tersimpan di Perangkat (Offline First) */}
        {kotaTersimpan.length > 0 && (
          <View style={{ gap: 8, backgroundColor: colors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="cloud-offline-outline" size={16} color={colors.primary} />
                <Text style={{ fontWeight: "700", color: colors.text, fontSize: 14 }}>
                  Tersimpan di Perangkat (Bisa Dibuka Offline)
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {kotaTersimpan.length} kota
              </Text>
            </View>

            <View style={{ gap: 6 }}>
              {kotaTersimpan.map((k) => (
                <View
                  key={k.kunci}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      pilihKota({
                        id: k.id,
                        name: k.nama,
                        latitude: k.latitude,
                        longitude: k.longitude,
                        country: "",
                      })
                    }
                    style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <Ionicons name="business-outline" size={16} color={colors.primary} />
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: "500" }}>
                      {k.nama}
                    </Text>
                  </TouchableOpacity>

                  {/* Tombol Hapus Cache per Kota */}
                  <TouchableOpacity
                    onPress={() => konfirmasiHapusCacheKota(k.kunci, k.nama)}
                    accessibilityLabel={`Hapus cache kota ${k.nama}`}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Loading Indicator */}
        {sedangMemuat && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>
              Memuat data cuaca...
            </Text>
          </View>
        )}

        {/* Pesan Error */}
        {pesanError && (
          <View style={{ backgroundColor: colors.dangerBg, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.danger, gap: 10 }}>
            <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18 }} accessibilityLabel={pesanError}>
              {pesanError}
            </Text>
            <TouchableOpacity
              onPress={() => kotaTerpilih && pilihKota(kotaTerpilih, true)}
              style={{
                backgroundColor: colors.danger,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 6,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>
                Coba Lagi
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Kartu Cuaca & Aksi */}
        {hasil && kotaTerpilih && !sedangMemuat && (
          <View style={{ gap: 12 }}>
            <StatusData
              sumber={hasil.sumber}
              disimpanPada={hasil.disimpanPada}
            />

            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={hasil.cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(hasil.kualitasUdara.indeksAQI)}
              indeksAQI={hasil.kualitasUdara.indeksAQI}
            />

            <View style={{ backgroundColor: colors.card, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                Kondisi: <Text style={{ color: colors.text, fontWeight: "600" }}>{labelKodeCuaca(hasil.cuaca.saatIni.kodeCuaca)}</Text>
                {"  •  "}
                Angin: <Text style={{ color: colors.text, fontWeight: "600" }}>{hasil.cuaca.saatIni.kecepatanAngin} km/j</Text>
              </Text>
            </View>

            {/* Tombol Aksi */}
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => pilihKota(kotaTerpilih, true)}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>
                  Perbarui Cuaca Sekarang
                </Text>
              </TouchableOpacity>

              {!sudahFavorit && kotaTerpilih.id !== -1 && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/tambah-favorit",
                      params: {
                        id: String(kotaTerpilih.id),
                        nama: kotaTerpilih.name,
                        lat: String(kotaTerpilih.latitude),
                        lon: String(kotaTerpilih.longitude),
                      },
                    })
                  }
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
                    Tambahkan ke Favorit
                  </Text>
                </TouchableOpacity>
              )}

              {sudahFavorit && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingVertical: 4 }}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.statusSegarText} />
                  <Text style={{ color: colors.statusSegarText, fontSize: 13, fontWeight: "500" }}>
                    Kota ini sudah tersimpan di daftar favorit.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <AtribusiCuaca />
      </ScrollView>
    </SafeAreaView>
  );
}
