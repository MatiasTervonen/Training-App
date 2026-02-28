import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { saveWeight } from "@/database/weight/save-weight";
import { DraftVideo } from "@/types/session";

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
  resetWeight,
  draftImages = [],
  draftVideos = [],
  draftRecordings = [],
}: {
  title: string;
  notes: string;
  weight: string;
  setIsSaving: (isSaving: boolean) => void;
  resetWeight: () => void;
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
  draftRecordings?: DraftRecording[];
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSaveWeight = async () => {
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Title",
        text2: "Please enter a title for your weight entry.",
      });
      return;
    }

    if (!weight.trim() || isNaN(Number(weight))) {
      Toast.show({
        type: "error",
        text1: "Invalid Weight",
        text2: "Please enter a valid numeric weight.",
      });
      return;
    }
    setIsSaving(true);

    try {
      await saveWeight({
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
        text1: "Success",
        text2: "Weight saved successfully!",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save weights. Please try again.",
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveWeight,
  };
}
