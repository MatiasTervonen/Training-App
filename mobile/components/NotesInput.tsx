import { TextInputProps, View, TextInput } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

type NotesInputProps = TextInputProps & {
  value: string;
  setValue: (value: string) => void;
  label?: string;
  className?: string;
  height?: number;
};

const DEFAULT_HEIGHT = 300;

export default function NotesInput({
  value,
  setValue,
  label,
  className,
  height = DEFAULT_HEIGHT,
  ...props
}: NotesInputProps) {
  const { t } = useTranslation();

  return (
    <View>
      {label && <AppText className="text-gray-300 mb-1">{label}</AppText>}
      <View className="border-2 rounded-lg overflow-hidden border-gray-400 focus:border-green-500">
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#333333"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <TextInput
          placeholderTextColor={"#9ca3af"}
          autoComplete="off"
          spellCheck={false}
          autoCorrect={false}
          multiline
          scrollEnabled
          textAlignVertical="top"
          value={value}
          onChangeText={setValue}
          className={`p-3 text-gray-100 font-lexend text-[15px] leading-[24px] ${className ?? ""}`}
          style={{ height, lineHeight: 20 }}
          maxLength={500000}
          {...props}
        />
        {value.length >= 500000 ? (
          <AppText className="text-yellow-400 mt-2">
            {t("common.charLimitReached", { max: 500000 })}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
