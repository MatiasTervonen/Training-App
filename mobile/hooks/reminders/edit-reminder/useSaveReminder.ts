import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { FeedItemUI, full_reminder } from "@/types/session";
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
  type,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  setIsSaving: (isSaving: boolean) => void;
  reminder: FeedItemUI | full_reminder;
  onSave: (updateFeedItem: FeedItemUI) => void;
  onClose: () => void;
  scheduleNotifications: () => Promise<string | string[] | undefined>;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
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

    if (type === "one-time" && notifyAt < new Date()) {
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
        `notification:${(reminder as FeedItemUI).source_id ?? (reminder as full_reminder).id}`
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
          `reminder:${(reminder as FeedItemUI).source_id ?? (reminder as full_reminder).id}`,
          JSON.stringify(normalizedIds)
        );
      }

      const updatedFeedItem = await EditLocalReminder({
        id: (reminder as FeedItemUI).source_id ?? (reminder as full_reminder).id,
        title,
        notes,
        seen_at: null,
        notify_at_time:
          type === "weekly" || type === "daily"
            ? notifyAt
              ? notifyAt.toTimeString().slice(0, 8)
              : null
            : null,
        notify_date: type === "one-time" ? (notifyAt ? notifyAt : null) : null,
        weekdays,
        type: type as "weekly" | "daily" | "one-time",
        updated_at: updated,
      });

      await onSave(updatedFeedItem);
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
