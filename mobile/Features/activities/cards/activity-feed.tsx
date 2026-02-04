import { Activity, Route, Timer } from "lucide-react-native";
import { View } from "react-native";
import AppText from "@/components/AppText";
import { formatMeters, formatDuration } from "@/lib/formatDate";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

type activityPayload = {
  duration: number;
  distance: number;
  activity_name: string;
  activity_slug?: string;
};
export default function ActivityCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onEdit,
}: FeedCardProps) {
  const { t } = useTranslation("activities");
  const payload = item.extra_fields as activityPayload;

  // Get translated activity name using slug, fallback to stored name
  const getActivityTypeName = () => {
    if (payload.activity_slug) {
      const translated = t(
        `activities.activityNames.${payload.activity_slug}`,
        {
          defaultValue: "",
        },
      );
      if (
        translated &&
        translated !== `activities.activityNames.${payload.activity_slug}`
      ) {
        return translated;
      }
    }
    return payload.activity_name;
  };

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onEdit={onEdit}
      typeIcon={<Activity size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />}
      typeName={getActivityTypeName()}
      statsContent={
        <View className="flex-row items-center gap-5">
          {payload.distance > 0 && (
            <View className="flex-row items-center gap-2">
              <Route size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
              <AppText
                className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
              >
                {formatMeters(payload.distance)}
              </AppText>
            </View>
          )}
          <View className="flex-row items-center gap-2">
            <Timer size={20} color={pinned ? "#0f172a" : "#f3f4f6"} />
            <AppText
              className={`${pinned ? "text-slate-900" : "text-gray-100"}`}
            >
              {formatDuration(payload.duration)}
            </AppText>
          </View>
        </View>
      }
    />
  );
}
