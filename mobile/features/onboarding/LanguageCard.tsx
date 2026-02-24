import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";

type Props = {
  label: string;
  flag: string;
  isSelected: boolean;
  onSelect: () => void;
};

export default function LanguageCard({
  label,
  flag,
  isSelected,
  onSelect,
}: Props) {
  return (
    <AnimatedButton
      onPress={onSelect}
      className={`flex-row items-center p-4 rounded-lg border-2 mb-3 ${
        isSelected
          ? "bg-blue-900/40 border-blue-500"
          : "bg-slate-800 border-slate-700"
      }`}
    >
      <AppText className="text-3xl mr-4">{flag}</AppText>
      <AppText className="text-xl">{label}</AppText>
      {isSelected && (
        <View className="ml-auto">
          <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
            <AppText className="text-sm">✓</AppText>
          </View>
        </View>
      )}
    </AnimatedButton>
  );
}
