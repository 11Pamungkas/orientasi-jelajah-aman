import { useState } from "react";
import { View, TextInput, Button } from "react-native";

interface SearchBoxProps {
  onCari: (kota: string) => void;
}

export default function SearchBox({ onCari }: SearchBoxProps) {
  const [teks, setTeks] = useState("");
  const teksRapi = teks.trim();

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <TextInput
        placeholder="Cari kota"
        value={teks}
        onChangeText={setTeks}
        style={{ flex: 1, borderWidth: 1, padding: 8 }}
      />
      <Button title="Cari" disabled={!teksRapi} onPress={() => onCari(teksRapi)} />
    </View>
  );
}
