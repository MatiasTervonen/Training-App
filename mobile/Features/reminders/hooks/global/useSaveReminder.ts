import Toast from "react-native-toast-message";
import { saveGlobalReminder } from "@/database/reminders/save-global-reminder";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceId } from "@/utils/deviceId";

export default function useSaveReminder({
  title,
  notes,
  notifyAt,
  mode,
  setIsSaving,
  resetReminder,
  setNotification,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  mode: "alarm" | "normal";
  setIsSaving: (isSaving: boolean) => void;
  resetReminder: () => void;
  setNotification: (reminderId: string) => Promise<string | undefined>;
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
      // Get current device ID to identify which device created this reminder
      const deviceId = await getDeviceId();

      const { reminderId } = await saveGlobalReminder({
        title: title,
        notes,
        type: "global",
        notify_at: notifyAt ? notifyAt.toISOString() : null,
        created_from_device_id: deviceId,
        mode,
      });

      // Schedule local notification on this device
      if (reminderId) {
        const notificationId = await setNotification(reminderId);

        if (notificationId) {
          await AsyncStorage.setItem(
            `notification:${reminderId}`,
            JSON.stringify([notificationId]),
          );
        }
      }

      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["feed"], exact: true }),
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        }),
      ]);

      router.push("/dashboard");
      resetReminder();
      Toast.show({
        type: "success",
        text1: "Reminder saved successfully.",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to save reminder.",
        text2: "Please try again later.",
      });
      setIsSaving(false);
    }
  };
  return {
    saveReminder,
  };
}
