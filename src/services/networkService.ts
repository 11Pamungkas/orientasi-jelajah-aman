// src/services/networkService.ts
// Utilitas sederhana untuk mengecek koneksi jaringan.
// Menggunakan teknik "fetch ringan" ke API yang digunakan aplikasi.

const URL_CEK = "https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m";
const BATAS_WAKTU_MS = 3000;

/**
 * Mengecek apakah perangkat terhubung ke internet
 * dengan mencoba fetch ringan ke API Open-Meteo.
 */
export async function cekKoneksiInternet(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BATAS_WAKTU_MS);

  try {
    const response = await fetch(URL_CEK, {
      method: "HEAD",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

