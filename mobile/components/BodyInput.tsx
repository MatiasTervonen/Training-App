import { View, TextInput, TextInputProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import BodyTextNC from "./BodyTextNC";
import AppText from "./AppText";

type BodyInputProps = TextInputProps & {
  value: string;
  setValue?: (value: string) => void;
  label?: string;
};

export default function BodyInput({
  value,
  setValue,
  label,
  ...props
}: BodyInputProps) {
  const { t } = useTranslation("common");

  return (
    <View>
      {label && <AppText className="mb-1">{label}</AppText>}
      <View className="border-[1.5px] rounded-lg overflow-hidden border-gray-400 focus:border-green-500">
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
          className="bg-transparent text-gray-100 text-lg px-4 py-2 h-12 font-lexend"
          maxLength={5000}
          {...props}
        />
      </View>
      {value.length >= 5000 ? (
        <BodyTextNC className="text-yellow-500 mt-2">
          {t("common.charLimitReached", { max: 5000 })}
        </BodyTextNC>
      ) : null}
    </View>
  );
}
