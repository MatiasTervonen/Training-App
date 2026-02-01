import { Dumbbell, Timer } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "./BaseFeedCard";
import { useTranslation } from "react-i18next";

type gymPayload = {
  duration: number;
  exercises_count: number;
  sets_count: number;
};

export default function GymCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("feed");
  const payload = item.extra_fields as gymPayload;

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Dumbbell size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />}
      typeName={t("feed.card.types.gym")}
      statsContent={
        <View className="flex-row gap-6 items-center">
          {payload.exercises_count > 0 && payload.sets_count > 0 && (
            <View className="gap-4 flex-row items-center">
              <AppText
                className={` ${pinned ? "text-slate-900" : "text-gray-100"}`}
              >
                {t("feed.card.exercises")}: {payload.exercises_count}
              </AppText>
              <AppText
                className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
              >
                {t("feed.card.sets")}: {payload.sets_count}
              </AppText>
            </View>
          )}
          {payload.duration > 0 && (
            <View className="flex-row items-center gap-2">
              <Timer size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
              <AppText
                className={` ${pinned ? "text-slate-900" : "text-gray-100"}`}
              >
                {Math.floor(payload.duration / 60)} {t("feed.card.min")}
              </AppText>
            </View>
          )}
        </View>
      }
    />
  );
}
