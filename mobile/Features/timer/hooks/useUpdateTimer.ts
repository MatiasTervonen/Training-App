import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { updateTimer } from "@/database/timer/update-timer";

export default function useUpdateTimer({
  id,
  title,
  notes,
  setIsSaving,
  alarmMinutes,
  alarmSeconds,
  onSuccess,
}: {
  id: string;
  title: string;
  notes: string;
  setIsSaving: (isSaving: boolean) => void;
  alarmMinutes: string;
  alarmSeconds: string;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  const handleUpdateTimer = async () => {
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
      await updateTimer({
        id,
        title,
        durationInSeconds: totalSeconds,
        notes,
      });

      queryClient.invalidateQueries({ queryKey: ["timers"], exact: true });
      Toast.show({
        type: "success",
        text1: "Timer updated successfully",
      });
      onSuccess();
    } catch {
      Toast.show({
        type: "error",
        text1: "Error updating timer",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    handleUpdateTimer,
  };
}
