import { useState } from "react";
import { View, TextInput } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "../context/ThemeContext";

interface SearchBoxProps {
  onCari: (teks: string) => void;
  placeholder?: string;
}

export default function SearchBox({ onCari, placeholder = "Cari nama kota..." }: SearchBoxProps) {
  const { colors } = useAppTheme();
  const [teks, setTeks] = useState("");

  function handleChange(nilaiBaru: string) {
    setTeks(nilaiBaru);
    onCari(nilaiBaru);
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.searchBg,
        borderWidth: 1,
        borderColor: colors.searchBorder,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        gap: 8,
      }}
    >
      <Ionicons name="search" size={18} color={colors.textSecondary} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={teks}
        onChangeText={handleChange}
        accessibilityLabel="Cari cuaca untuk kota yang dimasukkan"
        style={{
          flex: 1,
          color: colors.text,
          fontSize: 15,
          paddingVertical: 8,
        }}
        autoCapitalize="words"
        returnKeyType="search"
      />
      {teks.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color={colors.textSecondary}
          onPress={() => handleChange("")}
        />
      )}
    </View>
  );
}
