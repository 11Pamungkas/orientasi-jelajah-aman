import { View, Text, Button } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { tambahFavorit } from "../services/favoritStorage";
export default function ModalTambahFavorit() {
const { id, nama, lat, lon } = useLocalSearchParams<{
id: string;
nama: string;
lat: string;
lon: string;
}>();
async function simpan() {
await tambahFavorit({
id: Number(id),
nama,
latitude: Number(lat),
longitude: Number(lon),
});
router.back();
}
return (
<View style={{ padding: 16, gap: 16 }}>
<Text>Tambahkan {nama} ke daftar favorit?</Text>
<Button title="Simpan" onPress={simpan} />
</View>
);
}