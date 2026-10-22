import { Platform } from "react-native";
import * as Location from "expo-location";

export type StatusIzinLokasi = "granted" | "denied" | "unavailable";

export interface HasilKoordinat {
  latitude: number;
  longitude: number;
  namaKota?: string;
  kecamatan?: string;
  provinsi?: string;
  sumber: "gps";
}

/**
 * Mengecek apakah koordinat merupakan koordinat default Googleplex / Android Studio Emulator (Mountain View, CA).
 * Latitude ~37.422, Longitude ~ -122.084.
 */
function isDefaultEmulatorCoordinates(lat: number, lon: number): boolean {
  return Math.abs(lat - 37.422) < 0.1 && Math.abs(lon - -122.084) < 0.1;
}

/**
 * Membersihkan nama wilayah agar rapi (misal "Kota Pekalongan" -> "Pekalongan", "Kabupaten Batang" -> "Batang").
 */
export function rapikanNamaWilayah(nama: string): string {
  return nama
    .replace(/^Kota\s+Administrasi\s+/i, "")
    .replace(/^Kota\s+/i, "")
    .replace(/^Kabupaten\s+/i, "")
    .replace(/^Kab\.\s+/i, "")
    .trim();
}

/**
 * Mencari nama kota/kabupaten secara akurat dari titik koordinat GPS (Reverse Geocoding).
 * Menggunakan geocoder native (Google Play Services / iOS) dan fallback ke OpenStreetMap Nominatim.
 */
export async function cariNamaKotaDariKoordinat(
  latitude: number,
  longitude: number
): Promise<{ namaKota?: string; kecamatan?: string; provinsi?: string }> {
  // 1. Pada perangkat native Android / iOS
  if (Platform.OS !== "web") {
    try {
      const hasil = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (hasil && hasil.length > 0) {
        const addr = hasil[0];
        // subregion menyimpan nama Kabupaten/Kota otonom yang sebenarnya di Indonesia
        const kotaKabRaw =
          addr.subregion ||
          addr.city ||
          addr.district ||
          addr.region ||
          addr.name;

        if (kotaKabRaw && kotaKabRaw.trim().length > 0) {
          const namaKota = rapikanNamaWilayah(kotaKabRaw);
          const kecamatan = addr.district ? rapikanNamaWilayah(addr.district) : undefined;
          const provinsi = addr.region ? rapikanNamaWilayah(addr.region) : undefined;
          return { namaKota, kecamatan, provinsi };
        }
      }
    } catch (err) {
      console.warn("Location.reverseGeocodeAsync native gagal, menggunakan Nominatim:", err);
    }
  }

  // 2. Nominatim OpenStreetMap (Akurasi tinggi untuk wilayah administratif Indonesia)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`,
      {
        headers: { "User-Agent": "OrientasiJelajahAman/1.0 (Mobile App)" },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const kotaKab =
        addr.city ||
        addr.town ||
        addr.county ||
        addr.municipality ||
        addr.city_district ||
        addr.state_district;
      const kec = addr.suburb || addr.district || addr.village;
      const prov = addr.state;

      if (kotaKab) {
        return {
          namaKota: rapikanNamaWilayah(kotaKab),
          kecamatan: kec ? rapikanNamaWilayah(kec) : undefined,
          provinsi: prov ? rapikanNamaWilayah(prov) : undefined,
        };
      }
    }
  } catch {
    // Abaikan dan lanjut ke BigDataCloud
  }

  // 3. Fallback: BigDataCloud Reverse Geocoding
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.localityInfo?.administrative)) {
        const admin = data.localityInfo.administrative;
        const level5 = admin.find((a: any) => a.adminLevel === 5);
        const level6 = admin.find((a: any) => a.adminLevel === 6);
        const level4 = admin.find((a: any) => a.adminLevel === 4);
        if (level5?.name) {
          return {
            namaKota: rapikanNamaWilayah(level5.name),
            kecamatan: level6?.name ? rapikanNamaWilayah(level6.name) : undefined,
            provinsi: level4?.name ? rapikanNamaWilayah(level4.name) : undefined,
          };
        }
      }
      if (data.city) {
        return { namaKota: rapikanNamaWilayah(data.city) };
      }
      if (data.locality) {
        return { namaKota: rapikanNamaWilayah(data.locality) };
      }
    }
  } catch {
    // Abaikan
  }

  return {};
}

/**
 * Meminta izin penggunaan lokasi (GPS) ke pengguna.
 */
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
    // 1. Cek permission yang sudah aktif
    const existing = await Location.getForegroundPermissionsAsync();
    let status = existing.status;

    if (status !== "granted") {
      const requested = await Location.requestForegroundPermissionsAsync();
      status = requested.status;
    }

    if (status !== "granted") {
      return "denied";
    }

    // 2. Pastikan layanan GPS perangkat aktif
    const layananAktif = await Location.hasServicesEnabledAsync();
    if (!layananAktif) {
      if (Platform.OS === "android") {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          // Pengguna membatalkan dialog aktivasi lokasi
        }
      }
      const aktifUlang = await Location.hasServicesEnabledAsync();
      if (!aktifUlang) return "unavailable";
    }

    return "granted";
  } catch (error) {
    console.error("Gagal meminta izin lokasi:", error);
    return "denied";
  }
}

/**
 * Menentukan koordinat lokasi saat ini MURNI dari sensor GPS perangkat.
 * Tidak menggunakan estimasi IP publik (yang sering keliru menunjukkan kota gateway operator seperti Semarang).
 */
export async function ambilKoordinatSaatIni(): Promise<HasilKoordinat> {
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const detail = await cariNamaKotaDariKoordinat(lat, lon);
      return {
        latitude: lat,
        longitude: lon,
        namaKota: detail.namaKota,
        kecamatan: detail.kecamatan,
        provinsi: detail.provinsi,
        sumber: "gps",
      };
    }
    throw new Error("Geolocation browser tidak didukung.");
  }

  // Pada perangkat HP fisik (Android / iOS):
  let coords: { latitude: number; longitude: number } | null = null;

  // 1. Cek posisi tersimpan terakhir dari GPS perangkat jika ada dan bukan default emulator
  try {
    const lastKnown = await Location.getLastKnownPositionAsync({});
    if (
      lastKnown &&
      !isDefaultEmulatorCoordinates(lastKnown.coords.latitude, lastKnown.coords.longitude)
    ) {
      coords = {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    }
  } catch {
    // Lanjut ke GPS aktif
  }

  // 2. Gunakan watchPositionAsync untuk memaksa chip GPS hardware aktif dan mengambil koordinat pertama
  try {
    const gpsMurni = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      let sub: Location.LocationSubscription | null = null;
      let selesai = false;

      const timer = setTimeout(() => {
        if (!selesai) {
          selesai = true;
          sub?.remove();
          // Jika watchPosition timeout, coba ambil via getCurrentPositionAsync
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
            .then((loc) => {
              if (loc && !isDefaultEmulatorCoordinates(loc.coords.latitude, loc.coords.longitude)) {
                resolve({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
              } else if (coords) {
                // Gunakan lastKnown jika ada
                resolve(coords);
              } else {
                reject(new Error("Sinyal GPS tidak terdeteksi. Pastikan GPS aktif dan berada di area terbuka."));
              }
            })
            .catch((err) => {
              if (coords) {
                resolve(coords);
              } else {
                reject(err);
              }
            });
        }
      }, 5000);

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
          mayShowUserSettingsDialog: true,
        },
        (loc) => {
          if (!selesai && loc && !isDefaultEmulatorCoordinates(loc.coords.latitude, loc.coords.longitude)) {
            selesai = true;
            clearTimeout(timer);
            sub?.remove();
            resolve({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      )
        .then((s) => {
          sub = s;
          if (selesai) {
            sub.remove();
          }
        })
        .catch((err) => {
          if (!selesai) {
            selesai = true;
            clearTimeout(timer);
            // Fallback ke getCurrentPositionAsync
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              mayShowUserSettingsDialog: true,
            })
              .then((loc) => {
                if (loc && !isDefaultEmulatorCoordinates(loc.coords.latitude, loc.coords.longitude)) {
                  resolve({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                } else if (coords) {
                  resolve(coords);
                } else {
                  reject(new Error("Gagal mengambil posisi GPS."));
                }
              })
              .catch((e) => {
                if (coords) resolve(coords);
                else reject(e);
              });
          }
        });
    });

    if (gpsMurni) {
      coords = gpsMurni;
    }
  } catch (err: any) {
    if (!coords) {
      throw new Error(
        "Sinyal GPS belum terkunci. Pastikan GPS di HP Anda aktif (mode Akurasi Tinggi) dan izinkan akses lokasi."
      );
    }
  }

  if (!coords) {
    throw new Error(
      "Gagal mendapatkan koordinat dari GPS HP. Silakan aktifkan GPS perangkat Anda."
    );
  }

  // Cari nama wilayah resmi dari koordinat GPS murni tersebut
  const detail = await cariNamaKotaDariKoordinat(coords.latitude, coords.longitude);
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    namaKota: detail.namaKota,
    kecamatan: detail.kecamatan,
    provinsi: detail.provinsi,
    sumber: "gps",
  };
}
