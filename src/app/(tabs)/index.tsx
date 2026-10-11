import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import {
  mintaIzinLokasi,
  ambilKoordinatSaatIni,
} from "../../services/locationService";

import {
  ActivityIndicator,
  Button,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { router, useFocusEffect } from "expo-router";

import AtribusiCuaca from "../../../components/AtribusiCuaca";
import SearchBox from "../../components/SearchBox";
import WeatherCard from "../../components/WeatherCard";

import { useDebounce } from "../../hooks/use-debounce";
import { cariKota } from "../../services/geocodingService";
import { ambilKualitasUdara } from "../../services/airQualityService";
import { ambilCuaca } from "../../services/weatherService";
import { konversiTingkatAQI } from "../../services/weatherAdapter";
import { labelKodeCuaca } from "../../constants/weatherCodes";

import { HasilGeocoding } from "../../types/geocoding";

import {
  DataCuacaLengkap,
  DataKualitasUdara,
} from "../../types/weather";

import { KotaFavorit } from "../../types/favorit";
import { ambilSemuaFavorit } from "../../services/favoritStorage";

export default function HalamanUtama() {
  const [teksCari, setTeksCari] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<
    HasilGeocoding[]
  >([]);

  const [kotaTerpilih, setKotaTerpilih] =
    useState<HasilGeocoding | null>(null);

  const [cuaca, setCuaca] =
    useState<DataCuacaLengkap | null>(null);

  const [kualitasUdara, setKualitasUdara] =
    useState<DataKualitasUdara | null>(null);

  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pesanLokasi, setPesanLokasi] = useState<string | null>(null);

  // Menyimpan daftar kota favorit
  const [daftarFavorit, setDaftarFavorit] = useState<KotaFavorit[]>([]);

  const teksTertunda = useDebounce(teksCari, 500);

  // Mencegah race condition saat request sebelumnya selesai lebih lambat.
  const requestIdRef = useRef(0);

  // Memuat ulang daftar favorit ketika tab Beranda aktif kembali.
  useFocusEffect(
    useCallback(() => {
      let masihAktif = true;

      ambilSemuaFavorit()
        .then((favorit) => {
          if (masihAktif) {
            setDaftarFavorit(favorit);
          }
        })
        .catch((error) => {
          console.error(
            "Gagal mengambil data favorit:",
            error,
          );
        });

      return () => {
        masihAktif = false;
      };
    }, []),
  );

  // Memeriksa apakah kota yang dipilih sudah menjadi favorit.
  const sudahFavorit =
    kotaTerpilih !== null &&
    daftarFavorit.some(
      (favorit) => favorit.id === kotaTerpilih.id,
    );

  useEffect(() => {
    if (teksTertunda.trim().length === 0) {
      setHasilPencarian([]);
      return;
    }

    cariKota(teksTertunda)
      .then(setHasilPencarian)
      .catch(() => setHasilPencarian([]));
  }, [teksTertunda]);

  async function pilihKota(kota: HasilGeocoding) {
    setKotaTerpilih(kota);

    const idSaatIni = ++requestIdRef.current;

    setSedangMemuat(true);
    setPesanError(null);

    try {
      const [dataCuaca, dataAQI] = await Promise.all([
        ambilCuaca(kota.latitude, kota.longitude),
        ambilKualitasUdara(kota.latitude, kota.longitude),
      ]);

      // Jika ada request yang lebih baru, abaikan hasil request ini.
      if (idSaatIni !== requestIdRef.current) {
        return;
      }

      setCuaca(dataCuaca);
      setKualitasUdara(dataAQI);
    } catch {
      if (idSaatIni !== requestIdRef.current) {
        return;
      }

      setPesanError(
        "Gagal memuat data cuaca. Periksa koneksi internet Anda.",
      );
    } finally {
      if (idSaatIni === requestIdRef.current) {
        setSedangMemuat(false);
      }
    }
  }

  // Menggunakan lokasi perangkat saat ini.
  async function gunakanLokasiSaatIni() {
    const status = await mintaIzinLokasi();

    if (status === "denied") {
      setPesanLokasi(
        "Izin lokasi ditolak. Silakan cari kota secara manual di atas.",
      );
      return;
    }

    if (status === "unavailable") {
      setPesanLokasi(
        "Layanan lokasi tidak aktif di perangkat ini. Silakan cari kota secara manual.",
      );
      return;
    }

    setPesanLokasi(null);

    const koordinat = await ambilKoordinatSaatIni();

    pilihKota({
      id: -1,
      name: "Lokasi Saat Ini",
      latitude: koordinat.latitude,
      longitude: koordinat.longitude,
      country: "",
    });
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        padding: 16,
        gap: 16,
      }}
    >
      <SearchBox onCari={setTeksCari} />

      <Button
        title="Gunakan Lokasi Saat Ini"
        onPress={gunakanLokasiSaatIni}
      />

      {pesanLokasi && (
        <View>
          <Text>{pesanLokasi}</Text>
        </View>
      )}

      {hasilPencarian.map((kota) => (
        <TouchableOpacity
          key={kota.id}
          onPress={() => pilihKota(kota)}
        >
          <Text>{kota.name}</Text>
        </TouchableOpacity>
      ))}

      {sedangMemuat && <ActivityIndicator />}

      {pesanError && (
        <View>
          <Text>{pesanError}</Text>

          <Button
            title="Coba Lagi"
            onPress={() =>
              kotaTerpilih && pilihKota(kotaTerpilih)
            }
          />
        </View>
      )}

      {cuaca &&
        kualitasUdara &&
        kotaTerpilih &&
        !sedangMemuat && (
          <>
            <WeatherCard
              kota={kotaTerpilih.name}
              suhu={cuaca.saatIni.suhu}
              tingkatAQI={konversiTingkatAQI(
                kualitasUdara.indeksAQI,
              )}
            />

            {!sudahFavorit && (
              <Button
                title="Tambahkan ke Favorit"
                onPress={() =>
                  router.push({
                    pathname: "/tambah-favorit",
                    params: {
                      id: String(kotaTerpilih.id),
                      nama: kotaTerpilih.name,
                      lat: String(kotaTerpilih.latitude),
                      lon: String(kotaTerpilih.longitude),
                    },
                  })
                }
              />
            )}

            {sudahFavorit && (
              <Text style={{ color: "green" }}>
                Kota ini sudah tersimpan di favorit.
              </Text>
            )}
          </>
        )}

      {cuaca && (
        <Text
          style={{
            fontSize: 12,
            color: "#888",
          }}
        >
          Kondisi: {labelKodeCuaca(cuaca.saatIni.kodeCuaca)} •
          Angin {cuaca.saatIni.kecepatanAngin} km/j
        </Text>
      )}

      <AtribusiCuaca />
    </SafeAreaView>
  );
}