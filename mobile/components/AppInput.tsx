import { View, TextInput, TextInputProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";

type AppInputProps = TextInputProps & {
  value: string;
  setValue?: (value: string) => void;
  label?: string;
};

export default function AppInput({
  value,
  setValue,
  label,
  ...props
}: AppInputProps) {
  const { t } = useTranslation("common");

  return (
    <View>
      {label && <AppText className="mb-1">{label}</AppText>}
      <View className="border-2 rounded-lg overflow-hidden border-gray-400 focus:border-green-500">
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#333333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          spellCheck={false}
          allowFontScaling={false}
          className="bg-transparent text-gray-100 text-lg px-4 py-2 h-12 font-russo"
          maxLength={150}
          {...props}
        />
      </View>
      {value.length >= 150 ? (
        <AppText className="text-yellow-500 mt-2">
          {t("common.charLimitReached", { max: 150 })}
        </AppText>
      ) : null}
    </View>
  );
}
