import { memo } from "react";
import { View, Image, Alert } from "react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Trash2 } from "lucide-react-native";
import { FeedComment } from "@/types/social-feed";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import BodyTextNC from "@/components/BodyTextNC";

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return `${Math.floor(diffDay / 7)}w`;
}

type CommentItemProps = {
  comment: FeedComment;
  isOwnComment: boolean;
  onDelete: () => void;
  onReply: () => void;
};

function CommentItem({
  comment,
  isOwnComment,
  onDelete,
  onReply,
}: CommentItemProps) {
  const { t } = useTranslation(["social", "common"]);
  const isReply = !!comment.parent_id;

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t("social:social.deleteComment"),
      "",
      [
        { text: t("common:common.cancel"), style: "cancel" },
        {
          text: t("common:common.delete"),
          style: "destructive",
          onPress: onDelete,
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View className={`flex-row gap-3 py-3 ${isReply ? "pl-12 pr-4" : "px-4"}`}>
      {comment.author_profile_picture ? (
        <Image
          source={{ uri: comment.author_profile_picture }}
          className={`rounded-full bg-slate-600 ${isReply ? "w-7 h-7" : "w-9 h-9"}`}
        />
      ) : (
        <View
          className={`rounded-full bg-slate-600 items-center justify-center ${isReply ? "w-7 h-7" : "w-9 h-9"}`}
        >
          <AppText
            className={`text-gray-300 ${isReply ? "text-xs" : "text-sm"}`}
          >
            {comment.author_display_name?.charAt(0)?.toUpperCase() ?? "?"}
          </AppText>
        </View>
      )}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <AppText className="text-sm">{comment.author_display_name}</AppText>
          <View className="flex-row items-center gap-2">
            <AppText className="text-xs text-slate-500">
              {getRelativeTime(comment.created_at)}
            </AppText>
            {isOwnComment && (
              <AnimatedButton onPress={handleDelete} hitSlop={8}>
                <Trash2 size={14} color="#64748b" />
              </AnimatedButton>
            )}
          </View>
        </View>
        <BodyTextNC className="text-[13px] text-slate-400 mt-1 leading-5">
          {isReply && comment.reply_to_display_name && (
            <BodyTextNC className="text-sm text-blue-400">
              @{comment.reply_to_display_name}{" "}
            </BodyTextNC>
          )}
          {comment.content}
        </BodyTextNC>
        {!isReply && (
          <AnimatedButton onPress={onReply} className="mt-1.5" hitSlop={12}>
            <AppText className="text-xs text-slate-500">
              {t("social:social.reply")}
            </AppText>
          </AnimatedButton>
        )}
      </View>
    </View>
  );
}

export default memo(CommentItem);
