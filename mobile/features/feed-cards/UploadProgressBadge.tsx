import { View, ActivityIndicator, Pressable } from "react-native";
import { Upload, AlertCircle } from "lucide-react-native";
import { useUploadQueueStore } from "@/lib/stores/uploadQueueStore";
import { useTranslation } from "react-i18next";
import AppText from "@/components/AppText";

export default function UploadProgressBadge({
  targetId,
}: {
  targetId: string;
}) {
  const { t } = useTranslation("common");
  const queue = useUploadQueueStore((s) => s.queue);

  const items = queue.filter((item) => item.targetId === targetId);
  if (items.length === 0) return null;

  const completed = items.filter((i) => i.status === "completed").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const total = items.length;

  if (completed === total) return null;

  if (failed > 0) {
    return (
      <Pressable
        className="flex-row items-center gap-1"
        onPress={() => useUploadQueueStore.getState().retryFailed(targetId)}
      >
        <AlertCircle size={12} color="#f87171" />
        <AppText className="text-xs text-red-400">
          {t("common.media.tapToRetry")}
        </AppText>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-1">
      <ActivityIndicator size={10} color="#60a5fa" />
      <Upload size={12} color="#60a5fa" />
      <AppText className="text-xs text-blue-400">
        {completed}/{total}
      </AppText>
    </View>
  );
}
