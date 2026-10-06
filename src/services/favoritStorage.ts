import AsyncStorage from "@react-native-async-storage/async-storage";
import { KotaFavorit } from "../types/favorit";
const KUNCI_PENYIMPANAN = "@jelajah_aman:favorit";
export async function ambilSemuaFavorit(): Promise<KotaFavorit[]> {
const json = await AsyncStorage.getItem(KUNCI_PENYIMPANAN);
return json ? JSON.parse(json) : [];
}
export async function tambahFavorit(kota: KotaFavorit): Promise<void> {
const daftar = await ambilSemuaFavorit();
const sudahAda = daftar.some((k) => k.id === kota.id);
if (sudahAda) return;
const daftarBaru = [...daftar, kota];
await AsyncStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(daftarBaru));
}
export async function hapusFavorit(id: number): Promise<void> {
const daftar = await ambilSemuaFavorit();
const daftarBaru = daftar.filter((k) => k.id !== id);
await AsyncStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(daftarBaru));
}