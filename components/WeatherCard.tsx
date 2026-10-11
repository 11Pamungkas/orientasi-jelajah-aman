// components/WeatherCard.tsx
import { Text, View } from "react-native";
import { spacing, typeScale } from "../src/constants/styles";
import { type TingkatAQI, type WeatherCardProps } from "../src/types/cuaca";

const warnaPerTingkat: Record<TingkatAQI, string> = {
  BAIK: "green",
  SEDANG: "goldenrod",
  TIDAK_SEHAT: "orange",
  BERBAHAYA: "crimson",
};

export default function WeatherCard({
  kota,
  suhu,
  tingkatAQI,
  indeksAQI,
}: WeatherCardProps) {
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
        borderRadius: 8,
        backgroundColor: "#F4F7FA",
      }}
    >
      <Text style={{ fontWeight: "bold", fontSize: typeScale.judul }}>
        {kota}
      </Text>
      <Text style={{ fontSize: 32 }}>{suhu}°C</Text>
      <Text
        style={{ color: warnaPerTingkat[tingkatAQI], fontSize: typeScale.isi }}
      >
        {teksAQI}
      </Text>
    </View>
  );
}
