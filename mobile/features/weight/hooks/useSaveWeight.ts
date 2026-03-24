import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { saveWeightWithoutMedia } from "@/database/weight/save-weight";
import { DraftVideo, weight } from "@/types/session";

type DraftRecording = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
};

type DraftImage = {
  id: string;
  uri: string;
};

export default function useSaveWeight({
  title,
  notes,
  weight,
  setIsSaving,
  setSavingProgress,
  resetWeight,
  draftImages = [],
  draftVideos = [],
  draftRecordings = [],
}: {
  title: string;
  notes: string;
  weight: string;
  setIsSaving: (isSaving: boolean) => void;
  setSavingProgress?: (progress: number | undefined) => void;
  resetWeight: () => void;
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  draftRecordings?: DraftRecording[];
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation(["weight", "common"]);

  const handleSaveWeight = async () => {
    if (draftVideos.some((v) => v.isCompressing)) {
      Toast.show({ type: "info", text1: t("common.media.videoStillCompressing") });
      return;
    }

    const today = new Date().toLocaleDateString("en-CA");
    const cached = queryClient.getQueryData<weight[]>(["get-weight"]);
    const alreadyLogged = cached?.some(
      (entry) => new Date(entry.created_at).toLocaleDateString("en-CA") === today,
    );
    if (alreadyLogged) {
      Toast.show({
        type: "error",
        text1: t("weight:weight.alreadyLoggedTitle"),
        text2: t("weight:weight.alreadyLoggedMessage"),
      });
      return;
    }

    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: t("weight:weight.save.missingTitle"),
        text2: t("weight:weight.save.missingTitleSub"),
      });
      return;
    }

    if (!weight.trim() || isNaN(Number(weight))) {
      Toast.show({
        type: "error",
        text1: t("weight:weight.save.invalidWeight"),
        text2: t("weight:weight.save.invalidWeightSub"),
      });
      return;
    }
    setIsSaving(true);
    setSavingProgress?.(undefined);

    try {
      const { hasMedia } = await saveWeightWithoutMedia({
        title,
        notes,
        weight: Number(weight),
        draftImages,
        draftVideos,
        draftRecordings,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["get-weight"],
          exact: true,
        }),
        queryClient.invalidateQueries({ queryKey: ["feed"], exact: true }),
      ]);

      router.push("/dashboard");
      resetWeight();
      Toast.show({
        type: "success",
        text1: t("common:common.success"),
        text2: t("weight:weight.save.success"),
      });
      if (hasMedia) {
        Toast.show({
          type: "info",
          text1: t("common:common.media.uploadingBackground"),
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: t("common:common.error"),
        text2: t("weight:weight.save.error"),
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveWeight,
  };
}
