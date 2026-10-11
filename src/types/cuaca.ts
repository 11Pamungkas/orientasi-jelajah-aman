export type TingkatAQI =
  | "BAIK"
  | "SEDANG"
  | "TIDAK_SEHAT"
  | "BERBAHAYA";

export interface WeatherCardProps {
  kota: string;
  suhu: number;
  tingkatAQI: TingkatAQI;
  indeksAQI?: number;
}
