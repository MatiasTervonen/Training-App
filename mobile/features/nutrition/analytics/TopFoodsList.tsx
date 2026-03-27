import { View } from "react-native";
import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import BodyText from "@/components/BodyText";
import BodyTextNC from "@/components/BodyTextNC";
import { useTranslation } from "react-i18next";
import type { TopFood } from "@/database/nutrition/get-analytics";

type TopFoodsListProps = {
  foods: TopFood[];
};

export default function TopFoodsList({ foods }: TopFoodsListProps) {
  const { t } = useTranslation("nutrition");

  if (foods.length === 0) return null;

  return (
    <View className="bg-slate-900 rounded-2xl p-4">
      <AppText className="text-lg text-center mb-3">
        {t("analytics.topFoods.title")}
      </AppText>
      <View className="gap-2">
        {foods.map((food, index) => (
          <View
            key={food.food_name}
            className="flex-row items-center bg-slate-800 rounded-xl px-3 py-3"
          >
            <AppTextNC className="text-green-400 w-7 text-center">
              {index + 1}
            </AppTextNC>
            <View className="flex-1 ml-2">
              <BodyText numberOfLines={1}>{food.food_name}</BodyText>
              <BodyTextNC className="text-xs text-gray-400 mt-0.5">
                {food.log_count} {t("analytics.topFoods.times")} · {food.total_calories}{" "}
                {t("analytics.topFoods.kcal")}
              </BodyTextNC>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
