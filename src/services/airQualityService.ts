// src/services/airQualityService.ts
import { DataKualitasUdara } from "../types/weather";
import { simpanCacheAQI, ambilCacheAQI } from "./cacheService";

const BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const BATAS_WAKTU_MS = 3000;

/**
 * Mengambil data kualitas udara dari API.
 * - Jika online dan berhasil: data disimpan ke cache lalu dikembalikan.
 * - Jika gagal (offline/error): data dari cache dikembalikan jika ada.
 * - Jika tidak ada cache sama sekali: throw error.
 */
export async function ambilKualitasUdara(
  latitude: number,
  longitude: number,
): Promise<{ data: DataKualitasUdara; dariCache: boolean; waktuCache?: string }> {
  const url =
    `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=european_aqi,pm2_5,pm10`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BATAS_WAKTU_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Gagal memuat kualitas udara (status ${response.status})`);
    }
    const raw = await response.json();
    const dataAQI: DataKualitasUdara = {
      indeksAQI: raw.current.european_aqi,
      pm25: raw.current.pm2_5,
      pm10: raw.current.pm10,
    };

    // Simpan ke cache untuk akses offline
    await simpanCacheAQI(latitude, longitude, dataAQI);

    return { data: dataAQI, dariCache: false };
  } catch (err) {
    // Jika gagal fetch, coba ambil dari cache
    const cache = await ambilCacheAQI(latitude, longitude);
    if (cache) {
      return {
        data: cache.data,
        dariCache: true,
        waktuCache: cache.waktuCache,
      };
    }

    // Tidak ada cache, lempar error asli
    throw err;
  } finally {
    clearTimeout(timer);
  }
}