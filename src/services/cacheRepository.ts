import { ambilDatabase } from "../db/database";
import { DataCuacaLengkap, DataKualitasUdara } from "../types/weather";
import {
  DataTersimpan,
  KotaUntukCache,
  RingkasanKotaTersimpan,
} from "../types/cache";

interface BarisCache {
  kunci: string;
  kota_id: number;
  nama_kota: string;
  latitude: number;
  longitude: number;
  cuaca_json: string;
  aqi_json: string;
  disimpan_pada: number;
  jumlah_dibuka?: number;
}

type BarisRingkasan = Omit<BarisCache, "cuaca_json" | "aqi_json">;

// Koordinat dibulatkan 2 desimal (~1,1 km) agar GPS yang bergeser sedikit
// tetap memakai cache yang sama
export function buatKunci(latitude: number, longitude: number): string {
  return latitude.toFixed(2) + "," + longitude.toFixed(2);
}

export async function simpanCache(
  kota: KotaUntukCache,
  cuaca: DataCuacaLengkap,
  kualitasUdara: DataKualitasUdara,
): Promise<void> {
  const db = await ambilDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO cache_cuaca
(kunci, kota_id, nama_kota, latitude, longitude, cuaca_json, aqi_json, disimpan_pada)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      buatKunci(kota.latitude, kota.longitude),
      kota.id,
      kota.nama,
      kota.latitude,
      kota.longitude,
      JSON.stringify(cuaca),
      JSON.stringify(kualitasUdara),
      Date.now(),
    ],
  );
}

export async function ambilCache(
  latitude: number,
  longitude: number,
): Promise<DataTersimpan | null> {
  const db = await ambilDatabase();
  const baris = await db.getFirstAsync<BarisCache>(
    "SELECT * FROM cache_cuaca WHERE kunci = ?",
    [buatKunci(latitude, longitude)],
  );
  if (!baris) return null;
  return {
    cuaca: JSON.parse(baris.cuaca_json) as DataCuacaLengkap,
    kualitasUdara: JSON.parse(baris.aqi_json) as DataKualitasUdara,
    disimpanPada: baris.disimpan_pada,
  };
}

export async function daftarKotaTersimpan(): Promise<RingkasanKotaTersimpan[]> {
  const db = await ambilDatabase();
  const semua = await db.getAllAsync<BarisRingkasan>(
    `SELECT kunci, kota_id, nama_kota, latitude, longitude, disimpan_pada
FROM cache_cuaca ORDER BY disimpan_pada DESC LIMIT 10`,
  );
  return semua.map((b) => ({
    kunci: b.kunci,
    id: b.kota_id,
    nama: b.nama_kota,
    latitude: b.latitude,
    longitude: b.longitude,
    disimpanPada: b.disimpan_pada,
  }));
}

/**
 * Menghapus data cache hanya untuk satu kota tertentu berdasarkan kunci koordinat.
 * Tidak menghapus data favorit maupun riwayat pencarian.
 */
export async function hapusCacheKota(kunci: string): Promise<boolean> {
  try {
    const db = await ambilDatabase();
    const hasil = await db.runAsync("DELETE FROM cache_cuaca WHERE kunci = ?", [kunci]);
    return (hasil.changes ?? 0) > 0;
  } catch (error) {
    console.error("Gagal menghapus cache kota:", error);
    return false;
  }
}

/**
 * Menghapus data cache hanya untuk satu kota tertentu berdasarkan koordinat.
 */
export async function hapusCacheKotaByCoords(
  latitude: number,
  longitude: number
): Promise<boolean> {
  return hapusCacheKota(buatKunci(latitude, longitude));
}

// Invalidation otomatis: buang cache yang lebih tua dari batas umur
export async function bersihkanCacheLama(batasUmurMs: number): Promise<void> {
  const db = await ambilDatabase();
  await db.runAsync("DELETE FROM cache_cuaca WHERE disimpan_pada < ?", [
    Date.now() - batasUmurMs,
  ]);
}

// Invalidation manual: kosongkan seluruh cache
export async function hapusSemuaCache(): Promise<void> {
  const db = await ambilDatabase();
  await db.runAsync("DELETE FROM cache_cuaca");
}
