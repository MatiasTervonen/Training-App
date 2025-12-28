import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { FeedItemUI } from "@/types/session";
import EditLocalReminder from "@/database/reminders/edit-local-reminder";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useSaveReminder({
  title,
  notes,
  notifyAt,
  setIsSaving,
  reminder,
  onSave,
  onClose,
  scheduleNotifications,
  weekdays,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  setIsSaving: (isSaving: boolean) => void;
  reminder: FeedItemUI;
  onSave: () => void;
  onClose: () => void;
  scheduleNotifications: () => Promise<string | string[] | undefined>;
  weekdays: number[];
}) {
  const handleSave = async () => {
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

    if (reminder.type === "one-time" && notifyAt < new Date()) {
      Toast.show({
        type: "error",
        text1: "Notify time must be in the future.",
      });
      return;
    }

    const updated = new Date().toISOString();

    setIsSaving(true);
    try {
      // Cancel old notifications
      const stored = await AsyncStorage.getItem(
        `notification:${reminder.source_id}`
      );
      const oldIds: string[] = stored ? JSON.parse(stored) : [];

      for (const id of oldIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }

      const newIds = await scheduleNotifications();
      const normalizedIds = newIds
        ? Array.isArray(newIds)
          ? newIds
          : [newIds]
        : [];

      if (normalizedIds.length) {
        await AsyncStorage.setItem(
          `reminder:${reminder.source_id}`,
          JSON.stringify(normalizedIds)
        );
      }

      await EditLocalReminder({
        id: reminder.source_id,
        title,
        notes,
        seen_at: null,
        notify_at_time:
          reminder.type === "weekly" || reminder.type === "daily"
            ? notifyAt
              ? notifyAt.toTimeString().slice(0, 8)
              : null
            : null,
        notify_date:
          reminder.type === "one-time" ? (notifyAt ? notifyAt : null) : null,
        weekdays,
        type: reminder.type as "weekly" | "daily" | "one-time",
        updated_at: updated,
      });

      await onSave();
      onClose();
      Toast.show({
        type: "success",
        text1: "Reminder updated successfully",
      });
    } catch (error) {
      console.log("error updating reminder", error);
      Toast.show({
        type: "error",
        text1: "Error updating reminder",
        text2: "Try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  return {
    handleSave,
  };
}
