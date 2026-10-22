import AsyncStorage from '@react-native-async-storage/async-storage';
import { HasilGeocoding } from '../types/geocoding';

const KUNCI_RIWAYAT_PENCARIAN = '@jelajah_aman:riwayat_pencarian';
const MAKSIMAL_RIWAYAT = 10;

export interface ItemRiwayatPencarian {
  id: number;
  nama: string;
  latitude: number;
  longitude: number;
  country?: string;
  waktuPencarian: number; // timestamp
}

/**
 * Mengambil daftar riwayat pencarian kota terakhir (maksimal 10 item).
 * Diurutkan dari yang paling baru ke yang paling lama.
 */
export async function ambilRiwayatPencarian(): Promise<ItemRiwayatPencarian[]> {
  try {
    const json = await AsyncStorage.getItem(KUNCI_RIWAYAT_PENCARIAN);
    if (!json) return [];
    const daftar: ItemRiwayatPencarian[] = JSON.parse(json);
    return Array.isArray(daftar) ? daftar : [];
  } catch (error) {
    console.error('Gagal mengambil riwayat pencarian:', error);
    return [];
  }
}

/**
 * Menyimpan kota yang berhasil dimuat/dicari ke riwayat pencarian.
 * - Jika sudah ada di riwayat, posisinya diperbarui ke paling atas.
 * - Membatasi daftar maksimal 10 item (entri terlama dibuang otomatis).
 */
export async function tambahRiwayatPencarian(
  kota: HasilGeocoding | { id: number; name: string; latitude: number; longitude: number; country?: string }
): Promise<void> {
  // Jangan simpan placeholder "Lokasi Saat Ini" (-1) ke riwayat pencarian kota
  if (kota.id === -1 || !kota.name) return;

  try {
    const daftarLama = await ambilRiwayatPencarian();

    // Hapus duplikat kota yang sama (cocokkan berdasarkan id atau nama dan koordinat berdekatan)
    const daftarTanpaDuplikat = daftarLama.filter(
      (item) => item.id !== kota.id && item.nama.toLowerCase() !== kota.name.toLowerCase()
    );

    const itemBaru: ItemRiwayatPencarian = {
      id: kota.id,
      nama: kota.name,
      latitude: kota.latitude,
      longitude: kota.longitude,
      country: kota.country,
      waktuPencarian: Date.now(),
    };

    // Letakkan di posisi paling atas dan batasi maksimal 10
    const daftarBaru = [itemBaru, ...daftarTanpaDuplikat].slice(0, MAKSIMAL_RIWAYAT);

    await AsyncStorage.setItem(KUNCI_RIWAYAT_PENCARIAN, JSON.stringify(daftarBaru));
  } catch (error) {
    console.error('Gagal menyimpan riwayat pencarian:', error);
  }
}

/**
 * Menghapus satu item dari riwayat pencarian.
 */
export async function hapusSatuRiwayatPencarian(id: number): Promise<void> {
  try {
    const daftarLama = await ambilRiwayatPencarian();
    const daftarBaru = daftarLama.filter((item) => item.id !== id);
    await AsyncStorage.setItem(KUNCI_RIWAYAT_PENCARIAN, JSON.stringify(daftarBaru));
  } catch (error) {
    console.error('Gagal menghapus item riwayat pencarian:', error);
  }
}

/**
 * Mengosongkan seluruh riwayat pencarian.
 */
export async function bersihkanRiwayatPencarian(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KUNCI_RIWAYAT_PENCARIAN);
  } catch (error) {
    console.error('Gagal membersihkan riwayat pencarian:', error);
  }
}

