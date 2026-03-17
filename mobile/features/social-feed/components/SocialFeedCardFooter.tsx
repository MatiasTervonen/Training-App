import { View } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Heart, MessageCircle, SquareArrowOutUpRight } from "lucide-react-native";
import { SocialFeedItem } from "@/types/social-feed";
import { useTranslation } from "react-i18next";

type Props = {
  item: SocialFeedItem;
  onToggleLike: () => void;
  onExpand: () => void;
  onOpenComments: () => void;
};

export default function SocialFeedCardFooter({ item, onToggleLike, onExpand, onOpenComments }: Props) {
  const { t } = useTranslation("social");

  return (
    <View className="flex-row items-center justify-between px-4 py-2 border-t border-slate-700/50 mt-1">
      <AnimatedButton
        onPress={onToggleLike}
        className="flex-row items-center gap-2"
        hitSlop={10}
      >
        <Heart
          size={20}
          color={item.user_has_liked ? "#ef4444" : "#64748b"}
          fill={item.user_has_liked ? "#ef4444" : "transparent"}
        />
        <AppText className={item.user_has_liked ? "text-red-400 text-sm" : "text-slate-500 text-sm"}>
          {item.like_count > 0
            ? `${item.like_count} ${item.like_count === 1 ? t("social.like") : t("social.likes")}`
            : t("social.like")}
        </AppText>
      </AnimatedButton>

      {/* Comment button */}
      <AnimatedButton
        onPress={onOpenComments}
        className="flex-row items-center gap-2"
        hitSlop={10}
      >
        <MessageCircle size={18} color="#64748b" />
        {item.comment_count > 0 && (
          <AppText className="text-slate-500 text-sm">{item.comment_count}</AppText>
        )}
      </AnimatedButton>

      <AnimatedButton
        onPress={onExpand}
        className="flex-row items-center gap-2"
        hitSlop={10}
      >
        <SquareArrowOutUpRight size={18} color="#64748b" />
        <AppText className="text-slate-500 text-sm">{t("social.details")}</AppText>
      </AnimatedButton>
    </View>
  );
}
