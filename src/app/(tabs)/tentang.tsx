import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "../../context/ThemeContext";

export default function TabTentang() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.card,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Ionicons name="cloud-done" size={38} color={colors.primary} />
          </View>
          <Text
            accessible
            accessibilityLabel="Judul aplikasi Jelajah Aman"
            style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}
          >
            Jelajah Aman
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Versi 1.0.0
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Tentang Aplikasi
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
            Jelajah Aman adalah aplikasi informasi cuaca dan kualitas udara (Air Quality Index) yang dirancang dengan arsitektur <Text style={{ fontWeight: "700", color: colors.text }}>Offline-First</Text>.
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
            Aplikasi ini menyimpan data cuaca ke penyimpanan lokal (SQLite) sehingga pengguna tetap dapat memeriksa prakiraan cuaca kota favorit dan kota tersimpan meskipun sedang tidak terhubung ke jaringan internet.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Informasi Pengembang
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 4 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Mata Kuliah</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
              Pemrograman Berbasis Platform
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 4 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Tugas</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
              Ujian Tengah Semester (UTS)
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 4 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Dibuat Oleh</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
              pamungkas
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
