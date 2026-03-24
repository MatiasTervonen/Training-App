import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { useTranslation } from "react-i18next";

type MealTypePickerProps = {
  selected: string;
  onSelect: (type: string) => void;
  customTypes: string[];
};

const DEFAULT_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function MealTypePicker({
  selected,
  onSelect,
  customTypes,
}: MealTypePickerProps) {
  const { t } = useTranslation("nutrition");

  const allTypes = [
    ...DEFAULT_TYPES.map((type) => ({
      value: type,
      label: t(`meals.${type}`),
    })),
    ...customTypes.map((type) => ({
      value: type,
      label: type,
    })),
  ];

  return (
    <View className="gap-2">
      <AppText className="text-sm">{t("detail.mealType")}</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {allTypes.map((type) => {
          const isSelected = selected === type.value;

          return (
            <AnimatedButton
              key={type.value}
              onPress={() => onSelect(type.value)}
              className={`px-4 py-2 rounded-full border ${
                isSelected
                  ? "bg-orange-500/20 border-orange-500/50"
                  : "bg-slate-800 border-slate-700"
              }`}
            >
              <AppText className="text-sm">{type.label}</AppText>
            </AnimatedButton>
          );
        })}
      </ScrollView>
    </View>
  );
}
