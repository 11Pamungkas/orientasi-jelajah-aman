// src/services/weatherService.ts
import { DataCuacaLengkap } from "../types/weather";
import { simpanCacheCuaca, ambilCacheCuaca } from "./cacheService";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const BATAS_WAKTU_MS = 3000;

/**
 * Mengambil data cuaca dari API.
 * - Jika online dan berhasil: data disimpan ke cache lalu dikembalikan.
 * - Jika gagal (offline/error): data dari cache dikembalikan jika ada.
 * - Jika tidak ada cache sama sekali: throw error.
 */
export async function ambilCuaca(
  latitude: number,
  longitude: number,
): Promise<{ data: DataCuacaLengkap; dariCache: boolean; waktuCache?: string }> {
  const url =
    `${BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BATAS_WAKTU_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Gagal memuat cuaca (status ${response.status})`);
    }
    const raw = await response.json();
    const dataCuaca: DataCuacaLengkap = {
      saatIni: {
        suhu: raw.current.temperature_2m,
        kodeCuaca: raw.current.weather_code,
        kecepatanAngin: raw.current.wind_speed_10m,
        waktu: raw.current.time,
      },
      harian: {
        tanggal: raw.daily.time,
        suhuMaksimal: raw.daily.temperature_2m_max,
        suhuMinimal: raw.daily.temperature_2m_min,
        kodeCuaca: raw.daily.weather_code,
      },
    };

    // Simpan ke cache untuk akses offline
    await simpanCacheCuaca(latitude, longitude, dataCuaca);

    return { data: dataCuaca, dariCache: false };
  } catch (err) {
    // Jika gagal fetch, coba ambil dari cache
    const cache = await ambilCacheCuaca(latitude, longitude);
    if (cache) {
      return {
        data: cache.data,
        dariCache: true,
        waktuCache: cache.waktuCache,
      };
    }

    // Tidak ada cache, lempar error asli
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Permintaan cuaca melebihi batas waktu, coba lagi");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}