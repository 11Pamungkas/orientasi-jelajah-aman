// src/services/geocodingService.ts
import { GeocodingResponse, HasilGeocoding } from "../types/geocoding";
import {
  simpanCacheGeocoding,
  ambilCacheGeocoding,
} from "./cacheService";

const BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";

/**
 * Mencari kota berdasarkan nama.
 * - Jika online dan berhasil: hasil disimpan ke cache lalu dikembalikan.
 * - Jika gagal (offline/error): hasil dari cache dikembalikan jika ada.
 * - Jika tidak ada cache: kembalikan array kosong.
 */
export async function cariKota(
  nama: string,
): Promise<HasilGeocoding[]> {
  const url = `${BASE_URL}?name=${encodeURIComponent(
    nama,
  )}&count=5&language=id&format=json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Gagal memuat data (status ${response.status})`);
    }

    const data: GeocodingResponse = await response.json();
    const hasil = data.results ?? [];

    // Simpan ke cache untuk akses offline
    if (hasil.length > 0) {
      await simpanCacheGeocoding(nama, hasil);
    }

    return hasil;
  } catch {
    // Jika gagal fetch, coba ambil dari cache
    const cache = await ambilCacheGeocoding(nama);
    return cache ?? [];
  }
}