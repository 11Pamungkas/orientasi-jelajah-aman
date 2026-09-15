// src/app/detail/[kota].tsx
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import WeatherCard from "../../../components/WeatherCard";

export default function HalamanDetail() {
  const { kota } = useLocalSearchParams<{ kota: string }>();
  return (
    <View style={{ padding: 16 }}>
      <WeatherCard kota={kota} suhu={29} tingkatAQI="BAIK" />
    </View>
  );
}