import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyTextNC from "@/components/BodyTextNC";
import FoodLogItem from "@/features/nutrition/components/FoodLogItem";
import { DailyFoodLog } from "@/database/nutrition/get-daily-logs";

type MealSectionProps = {
  title: string;
  items: DailyFoodLog[];
  onDelete: (id: string) => void;
};

export default function MealSection({
  title,
  items,
  onDelete,
}: MealSectionProps) {
  if (items.length === 0) return null;

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <View className="gap-2 mb-4">
      <View className="flex-row justify-between items-center">
        <AppText className="text-base">{title}</AppText>
        <BodyTextNC className="text-sm text-slate-400">
          {Math.round(totalCalories)} kcal
        </BodyTextNC>
      </View>
      <View className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
        {items.map((item, index) => (
          <FoodLogItem
            key={item.id}
            item={item}
            onDelete={() => onDelete(item.id)}
            showBorder={index < items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
