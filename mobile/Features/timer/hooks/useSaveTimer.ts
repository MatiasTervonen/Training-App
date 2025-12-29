import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import saveTimer from "@/database/timer/save-timer";

export default function useSaveTimer({
  title,
  notes,
  setIsSaving,
  alarmMinutes,
  alarmSeconds,
  handleReset,
}: {
  title: string;
  notes: string;
  setIsSaving: (isSaving: boolean) => void;
  alarmMinutes: string;
  alarmSeconds: string;
  handleReset: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSaveTimer = async () => {
    if (!title || !alarmMinutes || !alarmSeconds) {
      Toast.show({
        type: "error",
        text1: "Please fill in all fields",
      });
      return;
    }

    setIsSaving(true);

    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;
    const totalSeconds = minutes * 60 + seconds;

    try {
      await saveTimer({
        title,
        durationInSeconds: totalSeconds,
        notes,
      });

      queryClient.refetchQueries({ queryKey: ["timers"], exact: true });
      router.push("/timer/my-timers");
      Toast.show({
        type: "success",
        text1: "Timer saved successfully",
      });
      handleReset();
    } catch {
      Toast.show({
        type: "error",
        text1: "Error saving timer",
      });
    } finally {
      setIsSaving(false);
    }
  };
  return {
    handleSaveTimer,
  };
}
