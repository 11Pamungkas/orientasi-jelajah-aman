import { View, Text } from "react-native";
import { WeatherCardProps, TingkatAQI } from "../types/cuaca";
import { typeScale, spacing } from "../constants/styles";
import { useAppTheme } from "../context/ThemeContext";

const warnaPerTingkat: Record<TingkatAQI, string> = {
  BAIK: "#10B981",
  SEDANG: "#F59E0B",
  TIDAK_SEHAT: "#F97316",
  BERBAHAYA: "#EF4444",
};

export default function WeatherCard({
  kota,
  suhu,
  tingkatAQI,
  indeksAQI,
}: WeatherCardProps) {
  const { colors } = useAppTheme();

  const teksAQI =
    indeksAQI !== undefined
      ? `AQI: ${indeksAQI} (${tingkatAQI})`
      : `AQI: ${tingkatAQI}`;

  const labelAksesibilitas =
    indeksAQI !== undefined
      ? `Cuaca ${kota}, suhu ${suhu} derajat, indeks kualitas udara ${indeksAQI}, kategori ${tingkatAQI}`
      : `Cuaca ${kota}, suhu ${suhu} derajat, kualitas udara ${tingkatAQI}`;

  return (
    <View
      accessible
      accessibilityLabel={labelAksesibilitas}
      style={{
        padding: spacing.sedang,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        gap: 6,
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: typeScale.judul, color: colors.text }}>
        {kota}
      </Text>
      <Text style={{ fontSize: 36, fontWeight: "700", color: colors.text }}>
        {suhu}°C
      </Text>
      <Text style={{ color: warnaPerTingkat[tingkatAQI], fontSize: typeScale.isi, fontWeight: "600" }}>
        {teksAQI}
      </Text>
    </View>
  );
}
