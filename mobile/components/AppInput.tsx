import { forwardRef } from "react";
import { View, TextInput, TextInputProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "@/components/AppText";
import { useTranslation } from "react-i18next";
import AppTextNC from "./AppTextNC";

type AppInputProps = TextInputProps & {
  value: string;
  setValue?: (value: string) => void;
  label?: string;
};

const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { value, setValue, label, ...props },
  ref,
) {
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
          ref={ref}
          value={value}
          onChangeText={setValue}
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          spellCheck={false}
          allowFontScaling={false}
          className="bg-transparent text-gray-100 text-lg px-4 py-2 h-12 font-russo"
          maxLength={5000}
          {...props}
        />
      </View>
      {value.length >= 5000 ? (
        <AppTextNC className="text-yellow-500 mt-2">
          {t("common.charLimitReached", { max: 5000 })}
        </AppTextNC>
      ) : null}
    </View>
  );
});

export default AppInput;
