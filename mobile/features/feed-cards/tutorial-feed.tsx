import { View } from "react-native";
import { BookOpen } from "lucide-react-native";
import AppText from "@/components/AppText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";

export default function TutorialCard({
  item,
  pinned,
  onTogglePin,
  onDelete,
  onExpand,
  onHide,
}: FeedCardProps) {
  const { t } = useTranslation("feed");

  return (
    <BaseFeedCard
      item={item}
      pinned={pinned}
      onTogglePin={onTogglePin}
      onDelete={onDelete}
      onExpand={onExpand}
      onHide={onHide}
      typeIcon={
        <BookOpen size={20} color={pinned ? "#0f172a" : "#cbd5e1"} />
      }
      typeName={t("feed.card.types.tutorial")}
      statsContent={
        <View>
          <AppText
            className={`${pinned ? "text-slate-900" : "text-slate-300"}`}
          >
            {t("feed.tutorial.subtitle")}
          </AppText>
          <AppText
            className={`text-sm mt-1 ${pinned ? "text-slate-700" : "text-slate-400"}`}
          >
            {t("feed.tutorial.tap_to_read")}
          </AppText>
        </View>
      }
    />
  );
}
