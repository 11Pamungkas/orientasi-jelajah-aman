// src/types/cache.ts
import { DataCuacaLengkap, DataKualitasUdara } from "./weather";
// Dari mana data yang sedang tampil berasal
export type SumberData = "jaringan" | "cache-segar" | "cache-basi";
// Identitas lokasi yang disimpan bersama cache
export interface KotaUntukCache {
id: number;
nama: string;
latitude: number;
longitude: number;
}
// Isi satu baris cache setelah dibaca dari SQLite
export interface DataTersimpan {
cuaca: DataCuacaLengkap;
kualitasUdara: DataKualitasUdara;
disimpanPada: number; // epoch milidetik
}
// Hasil akhir yang dipakai layar
export interface HasilCuacaOffline extends DataTersimpan {
sumber: SumberData;
}
// Ringkasan untuk daftar "Tersimpan di perangkat"
export interface RingkasanKotaTersimpan extends KotaUntukCache {
kunci: string;
disimpanPada: number;
}