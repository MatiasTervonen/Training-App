import Toast from "react-native-toast-message";
import SaveReminder from "@/database/reminders/save-reminder";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export default function useSaveReminder({
  title,
  notes,
  notifyAt,
  setIsSaving,
  resetReminder,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  setIsSaving: (isSaving: boolean) => void;
  resetReminder: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const saveReminder = async () => {
    if (title.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: "Title is required",
      });
      return;
    }
    if (!notifyAt) {
      Toast.show({
        type: "error",
        text1: "Notify time is required",
      });
      return;
    }

    setIsSaving(true);

    try {
      await SaveReminder({
        title: title,
        notes,
        type: "global",
        notify_at: notifyAt ? notifyAt.toISOString() : null,
      });

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["feed"], exact: true }),
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        }),
      ]);

      router.push("/dashboard");
      resetReminder();
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to save reminder. Please try again.",
      });
      setIsSaving(false);
    }
  };
  return {
    saveReminder,
  };
}
