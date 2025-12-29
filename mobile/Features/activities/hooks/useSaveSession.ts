import { confirmAction } from "@/lib/confirmAction";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { saveActivitySession } from "@/database/activities/save-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TrackPoint } from "@/types/session";
import { useStopGPStracking } from "@/Features/activities/lib/location-actions";
import { useQueryClient } from "@tanstack/react-query";

export default function useSaveActivitySession({
  title,
  notes,
  elapsedTime,
  track,
  setIsSaving,
  resetSession,
}: {
  title: string;
  notes: string;
  elapsedTime: number;
  track: TrackPoint[];
  setIsSaving: (isSaving: boolean) => void;
  resetSession: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { stopGPStracking } = useStopGPStracking();

  const handleSaveSession = async () => {
    if (title.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Title is required.",
      });
      return;
    }

    const confirmSave = await confirmAction({
      title: "Confirm Finish Session",
      message: "Are you sure you want to finish this session?",
    });

    if (!confirmSave) return;

    const duration = elapsedTime;
    const end_time = new Date().toISOString();

    const draft = await AsyncStorage.getItem("activity_draft");

    const startTime = draft
      ? JSON.parse(draft).startTime
      : new Date().toISOString();

    const activityId = draft ? JSON.parse(draft).activityId : null;

    try {
      setIsSaving(true);
      await saveActivitySession({
        title,
        notes,
        duration,
        start_time: startTime,
        end_time,
        track,
        activityId,
      });

      // stop the GPS tracking
      await stopGPStracking();

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      resetSession();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving activity session", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to save session. Please try again.",
      });
      setIsSaving(false);
    }
  };
  return {
    handleSaveSession,
  };
}
