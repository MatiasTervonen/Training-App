import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { saveTimer } from "@/database/timer/save-timer";

export default function useSaveTimer({
  title,
  notes,
  setIsSaving,
  durationInSeconds,
  handleReset,
}: {
  title: string;
  notes: string;
  setIsSaving: (isSaving: boolean) => void;
  durationInSeconds: number;
  handleReset: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSaveTimer = async () => {
    if (!title || durationInSeconds === 0) {
      Toast.show({
        type: "error",
        text1: "Please fill in all fields",
      });
      return;
    }

    setIsSaving(true);

    try {
      await saveTimer({
        title,
        durationInSeconds,
        notes,
      });

      queryClient.invalidateQueries({ queryKey: ["timers"], exact: true });
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
