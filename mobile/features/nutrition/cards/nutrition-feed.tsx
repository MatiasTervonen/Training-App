import { Utensils } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type NutritionPayload = {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  entry_count: number;
  calorie_goal: number;
};

export default function NutritionCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const { t: tNutrition } = useTranslation("nutrition");
  const payload = item.extra_fields as NutritionPayload;

  return (
    <BaseFeedCard
      item={{ ...item, title: tNutrition("title") }}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onHide={onHide}
      typeIcon={<Utensils size={20} color="#f97316" />}
      typeName={t("feed.card.types.nutrition")}
      statsContent={
        <View className="gap-1">
          <View className="flex-row gap-2 items-center">
            <AppText className="text-lg">
              {Math.round(payload.total_calories)} / {payload.calorie_goal}
            </AppText>
            <BodyText className="text-sm text-slate-400">{tNutrition("feed.kcal")}</BodyText>
          </View>
          <View className="flex-row gap-4">
            <BodyText className="text-sm text-slate-400">
              P: {Math.round(payload.total_protein)}g
            </BodyText>
            <BodyText className="text-sm text-slate-400">
              C: {Math.round(payload.total_carbs)}g
            </BodyText>
            <BodyText className="text-sm text-slate-400">
              F: {Math.round(payload.total_fat)}g
            </BodyText>
          </View>
          <BodyText className="text-xs text-slate-500">
            {payload.entry_count} {payload.entry_count === 1 ? tNutrition("feed.entry") : tNutrition("feed.entries")}
          </BodyText>
        </View>
      }
      showUpdatedAt={true}
    />
  );
}
