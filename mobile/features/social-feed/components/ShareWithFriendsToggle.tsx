import { useCallback, useState } from "react";
import { View } from "react-native";
import AppText from "@/components/AppText";
import Toggle from "@/components/toggle";
import { Users } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { updateFeedItemVisibility } from "@/database/social-feed/update-visibility";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type ShareWithFriendsToggleProps = {
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

export default function ShareWithFriendsToggle({
  sourceId,
  sessionType,
}: ShareWithFriendsToggleProps) {
  const { t } = useTranslation("social");
  const queryClient = useQueryClient();
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);

  const { data: visibility } = useQuery({
    queryKey: ["feed-item-visibility", sourceId, sessionType],
    queryFn: () => getFeedItemVisibility(sourceId, sessionType),
  });

  const isShared = optimisticValue ?? visibility === "friends";

  const handleToggle = useCallback(async () => {
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
    } catch {
      setOptimisticValue(null);
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
      });
    }
  }, [isShared, sourceId, sessionType, queryClient, t]);

  if (visibility === undefined) return null;

  return (
    <View className="flex-row items-center justify-between py-4 px-4 mt-5 rounded-lg bg-slate-800/50 border border-slate-700">
      <View className="flex-row items-center gap-3">
        <Users size={20} color="#67e8f9" />
        <AppText className="text-gray-100">
          {t("social.shareWithFriends")}
        </AppText>
      </View>
      <Toggle isOn={isShared} onToggle={handleToggle} />
    </View>
  );
}
