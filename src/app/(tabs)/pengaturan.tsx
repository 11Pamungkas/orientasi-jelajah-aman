import { useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { hapusSemuaCache } from "../../services/cacheRepository";
import { useAppTheme, ThemeMode } from "../../context/ThemeContext";

export default function TabPengaturan() {
  const { themeMode, setThemeMode, colors, isDark } = useAppTheme();
  const [pesan, setPesan] = useState<string | null>(null);

  const daftarPilihanTema: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap; deskripsi: string }[] = [
    {
      mode: "light",
      label: "Terang (Light)",
      icon: "sunny",
      deskripsi: "Tampilan selalu cerah dengan latar putih",
    },
    {
      mode: "dark",
      label: "Gelap (Dark)",
      icon: "moon",
      deskripsi: "Tampilan gelap yang nyaman di mata pada malam hari",
    },
    {
      mode: "system",
      label: "Ikuti Sistem (System Default)",
      icon: "phone-portrait-outline",
      deskripsi: "Menyesuaikan otomatis dengan tema perangkat Anda",
    },
  ];

  function konfirmasiHapusSemuaCache() {
    const aksiHapus = async () => {
      await hapusSemuaCache();
      setPesan("Seluruh data cache cuaca tersimpan berhasil dibersihkan.");
      setTimeout(() => setPesan(null), 4000);
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Yakin ingin menghapus seluruh cache cuaca tersimpan di perangkat?")) {
        aksiHapus();
      }
      return;
    }

    Alert.alert(
      "Konfirmasi Hapus Seluruh Cache",
      "Apakah Anda yakin ingin mengosongkan seluruh data cuaca tersimpan? Tindakan ini tidak menghapus riwayat atau daftar favorit.",
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus Semua", style: "destructive", onPress: aksiHapus },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        {/* Info Aplikasi */}
        <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
            Jelajah Aman
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Aplikasi Informasi Cuaca & Kualitas Udara (Offline-First)
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
            Versi 1.0.0 • Pemrograman Berbasis Platform
          </Text>
        </View>

        {/* Pilihan Tema */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Tema Tampilan
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Pilih mode tampilan yang diterapkan ke seluruh halaman aplikasi:
          </Text>

          <View style={{ gap: 8 }}>
            {daftarPilihanTema.map((item) => {
              const aktif = themeMode === item.mode;
              return (
                <TouchableOpacity
                  key={item.mode}
                  onPress={() => setThemeMode(item.mode)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 14,
                    borderRadius: 10,
                    backgroundColor: aktif ? (isDark ? "#1E293B" : "#EFF6FF") : colors.card,
                    borderWidth: 1.5,
                    borderColor: aktif ? colors.primary : colors.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={aktif ? colors.primary : colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: aktif ? "700" : "500", color: aktif ? colors.primary : colors.text }}>
                        {item.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        {item.deskripsi}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={aktif ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={aktif ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Manajemen Penyimpanan Cache */}
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Penyimpanan & Cache
          </Text>

          <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, gap: 12 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              Hapus seluruh data cache cuaca yang tersimpan secara lokal. Tindakan ini hanya mengosongkan cache hasil unduhan, tanpa menghapus daftar kota favorit atau riwayat pencarian Anda.
            </Text>

            <TouchableOpacity
              onPress={konfirmasiHapusSemuaCache}
              style={{
                backgroundColor: colors.dangerBg,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.danger,
              }}
            >
              <Text style={{ color: colors.danger, fontWeight: "600", fontSize: 14 }}>
                Hapus Seluruh Cache Cuaca
              </Text>
            </TouchableOpacity>

            {pesan && (
              <View style={{ backgroundColor: colors.statusSegarBg, padding: 10, borderRadius: 8 }}>
                <Text style={{ color: colors.statusSegarText, fontSize: 12, textAlign: "center" }}>
                  {pesan}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
