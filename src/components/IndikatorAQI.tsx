import { View, Text } from "react-native";

// 1. Membuat Interface LaporanUdara
export interface LaporanUdara {
  kota: string;
  indeksAQI: number;
  tingkat: "BAIK" | "SEDANG" | "TIDAK_SEHAT" | "BERBAHAYA";
  diperbaruiPada?: string;
}

// 2. Membuat Komponen IndikatorAQI
export default function IndikatorAQI({ kota, indeksAQI, tingkat, diperbaruiPada }: LaporanUdara) {
  
  // Menentukan warna berdasarkan nilai tingkat
  let warnaTingkat = "black";
  switch (tingkat) {
    case "BAIK":
      warnaTingkat = "green";
      break;
    case "SEDANG":
      warnaTingkat = "orange";
      break;
    case "TIDAK_SEHAT":
      warnaTingkat = "red";
      break;
    case "BERBAHAYA":
      warnaTingkat = "darkred";
      break;
  }

  return (
    <View style={{ padding: 12, borderWidth: 1, borderColor: warnaTingkat, borderRadius: 8, marginTop: 10 }}>
      <Text style={{ fontWeight: "bold" }}>{kota}</Text>
      <Text>Indeks AQI: {indeksAQI}</Text>
      <Text style={{ color: warnaTingkat, fontWeight: "bold" }}>
        Status: {tingkat}
      </Text>
      
      {/* Menampilkan waktu update hanya jika properti diperbaruiPada dikirim (karena opsional) */}
      {diperbaruiPada && (
        <Text style={{ fontSize: 10, color: "gray", marginTop: 4 }}>
          Diperbarui pada: {diperbaruiPada}
        </Text>
      )}
    </View>
  );
}