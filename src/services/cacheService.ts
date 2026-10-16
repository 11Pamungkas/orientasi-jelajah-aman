// src/services/cacheService.ts
// Layanan cache untuk menyimpan data cuaca, AQI, dan geocoding secara lokal
// agar aplikasi tetap bisa menampilkan data saat offline.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { DataCuacaLengkap, DataKualitasUdara } from "../types/weather";
import { HasilGeocoding } from "../types/geocoding";

const PREFIX_CUACA = "@jelajah_aman:cache_cuaca:";
const PREFIX_AQI = "@jelajah_aman:cache_aqi:";
const PREFIX_GEOCODING = "@jelajah_aman:cache_geocoding:";
const KUNCI_TIMESTAMP = "@jelajah_aman:cache_timestamp:";

/** Membuat kunci cache berdasarkan koordinat (dibulatkan ke 2 desimal). */
function kunciKoordinat(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

// ─── Cuaca ────────────────────────────────────────────────────────────────────

export async function simpanCacheCuaca(
  lat: number,
  lon: number,
  data: DataCuacaLengkap,
): Promise<void> {
  const kunci = PREFIX_CUACA + kunciKoordinat(lat, lon);
  await AsyncStorage.setItem(kunci, JSON.stringify(data));
  await AsyncStorage.setItem(
    KUNCI_TIMESTAMP + kunci,
    new Date().toISOString(),
  );
}

export async function ambilCacheCuaca(
  lat: number,
  lon: number,
): Promise<{ data: DataCuacaLengkap; waktuCache: string } | null> {
  const kunci = PREFIX_CUACA + kunciKoordinat(lat, lon);
  const json = await AsyncStorage.getItem(kunci);
  const waktu = await AsyncStorage.getItem(KUNCI_TIMESTAMP + kunci);

  if (!json) return null;

  return {
    data: JSON.parse(json) as DataCuacaLengkap,
    waktuCache: waktu ?? "tidak diketahui",
  };
}

// ─── Kualitas Udara (AQI) ────────────────────────────────────────────────────

export async function simpanCacheAQI(
  lat: number,
  lon: number,
  data: DataKualitasUdara,
): Promise<void> {
  const kunci = PREFIX_AQI + kunciKoordinat(lat, lon);
  await AsyncStorage.setItem(kunci, JSON.stringify(data));
  await AsyncStorage.setItem(
    KUNCI_TIMESTAMP + kunci,
    new Date().toISOString(),
  );
}

export async function ambilCacheAQI(
  lat: number,
  lon: number,
): Promise<{ data: DataKualitasUdara; waktuCache: string } | null> {
  const kunci = PREFIX_AQI + kunciKoordinat(lat, lon);
  const json = await AsyncStorage.getItem(kunci);
  const waktu = await AsyncStorage.getItem(KUNCI_TIMESTAMP + kunci);

  if (!json) return null;

  return {
    data: JSON.parse(json) as DataKualitasUdara,
    waktuCache: waktu ?? "tidak diketahui",
  };
}

// ─── Geocoding ───────────────────────────────────────────────────────────────

export async function simpanCacheGeocoding(
  query: string,
  data: HasilGeocoding[],
): Promise<void> {
  const kunci = PREFIX_GEOCODING + query.toLowerCase().trim();
  await AsyncStorage.setItem(kunci, JSON.stringify(data));
}

export async function ambilCacheGeocoding(
  query: string,
): Promise<HasilGeocoding[] | null> {
  const kunci = PREFIX_GEOCODING + query.toLowerCase().trim();
  const json = await AsyncStorage.getItem(kunci);
  if (!json) return null;
  return JSON.parse(json) as HasilGeocoding[];
}

// ─── Utilitas ────────────────────────────────────────────────────────────────

/** Format waktu cache menjadi string yang mudah dibaca. */
export function formatWaktuCache(isoString: string): string {
  if (isoString === "tidak diketahui") return isoString;

  try {
    const waktu = new Date(isoString);
    const sekarang = new Date();
    const selisihMs = sekarang.getTime() - waktu.getTime();
    const selisihMenit = Math.floor(selisihMs / 60000);

    if (selisihMenit < 1) return "baru saja";
    if (selisihMenit < 60) return `${selisihMenit} menit lalu`;

    const selisihJam = Math.floor(selisihMenit / 60);
    if (selisihJam < 24) return `${selisihJam} jam lalu`;

    const selisihHari = Math.floor(selisihJam / 24);
    return `${selisihHari} hari lalu`;
  } catch {
    return isoString;
  }
}

