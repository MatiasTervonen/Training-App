import { useMemo } from "react";
import { View } from "react-native";
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

  const rows = useMemo(() => {
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

    // Split into rows of 2
    const result: (typeof allTypes)[] = [];
    for (let i = 0; i < allTypes.length; i += 2) {
      result.push(allTypes.slice(i, i + 2));
    }
    return result;
  }, [customTypes, t]);

  return (
    <View className="gap-2">
      <AppText className="text-sm">{t("detail.mealType")}</AppText>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-2">
          {row.map((type) => {
            const isSelected = selected === type.value;
            return (
              <AnimatedButton
                key={type.value}
                onPress={() => onSelect(type.value)}
                className={`flex-1 items-center py-2.5 rounded-lg border ${
                  isSelected
                    ? "bg-orange-500/20 border-orange-500/50"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                <AppText className="text-sm">{type.label}</AppText>
              </AnimatedButton>
            );
          })}
          {row.length === 1 && <View className="flex-1" />}
        </View>
      ))}
    </View>
  );
}
