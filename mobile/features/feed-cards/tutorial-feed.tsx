import { View } from "react-native";
import { BookOpen } from "lucide-react-native";
import BodyText from "@/components/BodyText";
import { FeedCardProps } from "@/types/session";
import BaseFeedCard from "@/features/feed-cards/BaseFeedCard";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";

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
        <BookOpen size={20} color={"#cbd5e1"} />
      }
      typeName={t("feed.card.types.tutorial")}
      statsContent={
        <View>
          <BodyText className="text-slate-300">
            {t("feed.tutorial.subtitle", { appName: APP_NAME })}
          </BodyText>
          <BodyText className="text-sm mt-1 text-slate-400">
            {t("feed.tutorial.tap_to_read")}
          </BodyText>
        </View>
      }
    />
  );
}
