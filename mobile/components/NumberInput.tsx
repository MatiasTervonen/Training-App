import { useState } from "react";
import { View, TextInput, TextInputProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";

type AppInputProps = TextInputProps & { label?: string };

export default function NumberInput({
  label,
  onChangeText,
  ...props
}: AppInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChangeText = (val: string) => {
    const numbersOnly = val.replace(/[^0-9.]/g, "");
    onChangeText?.(numbersOnly);
  };

  return (
    <View>
      {label && <AppText className="mb-1">{label}</AppText>}
      <View
        style={{
          borderColor: focused ? "#22c55e" : "#d1d5db", // green-500 / gray-300
        }}
        className="border-2 rounded-lg overflow-hidden"
      >
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#333333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <TextInput
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          spellCheck={false}
          allowFontScaling={false}
          keyboardType="numeric"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={handleChangeText}
          className="bg-transparent text-gray-100 text-xl px-4 py-2 h-12 font-russo"
          {...props}
        />
      </View>
    </View>
  );
}
