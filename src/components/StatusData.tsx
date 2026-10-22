import { View, Text } from "react-native";
import { SumberData } from "../types/cache";
import { useAppTheme } from "../context/ThemeContext";

interface StatusDataProps {
  sumber: SumberData;
  disimpanPada: number;
}

function formatUmur(disimpanPada: number): string {
  const menit = Math.floor((Date.now() - disimpanPada) / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return menit + " menit lalu";
  const jam = Math.floor(menit / 60);
  if (jam < 24) return jam + " jam lalu";
  return Math.floor(jam / 24) + " hari lalu";
}

function labelSumber(sumber: SumberData): string {
  if (sumber === "jaringan") return "Data terbaru dari internet";
  if (sumber === "cache-segar") return "Data tersimpan (masih segar)";
  return "Mode offline - data tersimpan mungkin sudah usang";
}

export default function StatusData({ sumber, disimpanPada }: StatusDataProps) {
  const { colors } = useAppTheme();
  const basi = sumber === "cache-basi";
  const label = labelSumber(sumber);
  const umur = formatUmur(disimpanPada);

  const backgroundColor = basi ? colors.statusBasiBg : colors.statusSegarBg;
  const textColor = basi ? colors.statusBasiText : colors.statusSegarText;

  return (
    <View
      accessible
      accessibilityLabel={label + ", diperbarui " + umur}
      style={{
        padding: 10,
        borderRadius: 8,
        backgroundColor,
        borderWidth: 1,
        borderColor: textColor + "40",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: textColor }}>
        {label}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
        Diperbarui {umur}
      </Text>
    </View>
  );
}
