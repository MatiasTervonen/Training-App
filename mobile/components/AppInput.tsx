import { useState } from "react";
import { View, TextInput, TextInputProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";

type AppInputProps = TextInputProps & { label?: string };

export default function AppInput({ label, ...props }: AppInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <>
      {label && <AppText className="mb-2">{label}</AppText>}

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
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
          allowFontScaling={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-12 font-russo bg-transparent text-gray-100 text-lg px-4"
          {...props}
        />
      </View>
    </>
  );
}
