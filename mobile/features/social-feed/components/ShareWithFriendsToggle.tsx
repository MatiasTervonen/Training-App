import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { updateFeedItemVisibility } from "@/database/social-feed/update-visibility";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import AnimatedButton from "@/components/buttons/animatedButton";

type ShareWithFriendsButtonProps = {
  sourceId: string;
  sessionType: "gym_sessions" | "activity_sessions";
};

async function getFeedItemVisibility(
  sourceId: string,
  type: string,
): Promise<"private" | "friends"> {
  const { data, error } = await supabase
    .from("feed_items")
    .select("visibility")
    .eq("source_id", sourceId)
    .eq("type", type)
    .single();

  if (error || !data) return "private";
  return (data.visibility as "private" | "friends") ?? "private";
}

export default function ShareWithFriendsButton({
  sourceId,
  sessionType,
}: ShareWithFriendsButtonProps) {
  const { t } = useTranslation("social");
  const queryClient = useQueryClient();
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);

  const { data: visibility } = useQuery({
    queryKey: ["feed-item-visibility", sourceId, sessionType],
    queryFn: () => getFeedItemVisibility(sourceId, sessionType),
  });

  const isShared = optimisticValue ?? visibility === "friends";

  const performToggle = useCallback(async () => {
    const newValue = !isShared;
    setOptimisticValue(newValue);
    try {
      await updateFeedItemVisibility(
        sourceId,
        sessionType,
        newValue ? "friends" : "private",
      );
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
      queryClient.invalidateQueries({
        queryKey: ["feed-item-visibility", sourceId, sessionType],
      });
      Toast.show({
        type: "success",
        text1: newValue
          ? t("social.sharedWithFriends")
          : t("social.removedFromFriends"),
      });
    } catch {
      setOptimisticValue(null);
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
      });
    }
  }, [isShared, sourceId, sessionType, queryClient, t]);

  const handlePress = useCallback(() => {
    Alert.alert(
      isShared
        ? t("social.removeFromFriendsTitle")
        : t("social.shareWithFriendsTitle"),
      isShared
        ? t("social.removeFromFriendsMessage")
        : t("social.shareWithFriendsMessage"),
      [
        { text: t("social.cancel"), style: "cancel" },
        {
          text: isShared
            ? t("social.removeConfirm")
            : t("social.shareConfirm"),
          onPress: performToggle,
        },
      ],
    );
  }, [isShared, performToggle, t]);

  if (visibility === undefined) return null;

  return (
    <AnimatedButton onPress={handlePress} hitSlop={10}>
      <Users size={20} color={isShared ? "#67e8f9" : "#9ca3af"} />
    </AnimatedButton>
  );
}
