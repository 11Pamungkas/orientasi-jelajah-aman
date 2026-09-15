// components/RiwayatList.tsx (diperbarui)
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

interface RiwayatListProps {
  daftarKota: string[];
}

export default function RiwayatList({ daftarKota }: RiwayatListProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Riwayat pencarian</Text>
      {daftarKota.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada kota yang dicari.</Text>
      ) : (
        daftarKota.map((kota, index) => (
          <Link
            key={`${kota}-${index}`}
            href={{ pathname: "/detail/[kota]", params: { kota } }}
            style={styles.link}
          >
            <Text style={styles.cityName}>{kota}</Text>
          </Link>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  link: {
    backgroundColor: "#F4F7FA",
    borderColor: "#E1E8EF",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  cityName: { color: "#26364A", fontSize: 16 },
  emptyText: { color: "#66788A", fontSize: 14 },
});
