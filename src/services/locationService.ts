import { Platform } from "react-native";
import * as Location from "expo-location";

export type StatusIzinLokasi = "granted" | "denied" | "unavailable";

export interface HasilKoordinat {
  latitude: number;
  longitude: number;
  namaKota?: string;
}

/**
 * Fallback penentuan lokasi berbasis IP publik.
 * Berguna saat perangkat desktop/laptop tidak memiliki chip GPS,
 * atau saat izin GPS browser dibatasi atau mengalami timeout.
 */
async function ambilKoordinatDariIP(): Promise<HasilKoordinat> {
  // Opsi 1: Coba ipwho.is (sangat akurat untuk deteksi kota di Indonesia)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://ipwho.is/", { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (
        data.success &&
        typeof data.latitude === "number" &&
        typeof data.longitude === "number"
      ) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          namaKota: data.city || data.region,
        };
      }
    }
  } catch {
    // Lanjut ke fallback berikutnya
  }

  // Opsi 2: Coba geojs.io
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json", {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        return {
          latitude: lat,
          longitude: lon,
          namaKota: data.city || data.region,
        };
      }
    }
  } catch {
    // Abaikan
  }

  throw new Error(
    "Tidak dapat mendeteksi lokasi (GPS dan IP tidak tersedia). Silakan cari kota secara manual."
  );
}

export async function mintaIzinLokasi(): Promise<StatusIzinLokasi> {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return "unavailable";
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        if (result.state === "denied") return "denied";
        if (result.state === "granted") return "granted";
      } catch {
        // Query permissions tidak didukung di sebagian browser
      }
    }
    return "granted";
  }

  try {
    const layananAktif = await Location.hasServicesEnabledAsync();
    if (!layananAktif) {
      return "unavailable";
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted" ? "granted" : "denied";
  } catch (error) {
    console.error("Gagal meminta izin lokasi:", error);
    return "denied";
  }
}

export async function ambilKoordinatSaatIni(): Promise<HasilKoordinat> {
  if (Platform.OS === "web") {
    // Jalankan penentuan lokasi via navigator.geolocation dengan enableHighAccuracy: false
    // enableHighAccuracy: false mencegah timeout pada browser desktop/laptop yang tidak punya chip GPS
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: false, // PENTING: false agar cepat & tidak mencari satelit GPS di PC
              timeout: 5000,             // Batas 5 detik
              maximumAge: 300000,        // Boleh pakai cache posisi 5 menit terakhir
            }
          );
        });

        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch (err: any) {
        // Jika timeout (code 3), posisi tidak tersedia (code 2), atau izin ditolak (code 1):
        // Otomatis fallback ke penentuan lokasi berdasarkan IP jaringan
        console.warn("Geolocation browser gagal, menggunakan fallback IP:", err?.message);
        return await ambilKoordinatDariIP();
      }
    }

    // Jika browser tidak support navigator.geolocation sama sekali
    return await ambilKoordinatDariIP();
  }

  // Pada perangkat native (Android/iOS)
  try {
    const lokasi = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: lokasi.coords.latitude,
      longitude: lokasi.coords.longitude,
    };
  } catch {
    // Coba last known position jika GPS lambat
    try {
      const lokasiTerakhir = await Location.getLastKnownPositionAsync({});
      if (lokasiTerakhir) {
        return {
          latitude: lokasiTerakhir.coords.latitude,
          longitude: lokasiTerakhir.coords.longitude,
        };
      }
    } catch {
      // Abaikan
    }

    // Fallback terakhir ke IP
    return await ambilKoordinatDariIP();
  }
}