import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { full_reminder } from "@/types/session";
import EditCustomReminderData from "@/database/reminders/edit-custom-reminder";

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
  reminder: full_reminder;
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

    const delivered =
      reminder.type === "one-time"
        ? notifyAt?.toISOString() === reminder.notify_date
          ? reminder.delivered
          : false
        : false;

    const updated = new Date().toISOString();

    setIsSaving(true);
    try {
      // Cancel old notifications
      const oldNotificationIds = Array.isArray(reminder.notification_id)
        ? reminder.notification_id
        : typeof reminder.notification_id === "string"
          ? [reminder.notification_id]
          : [];

      for (const nid of oldNotificationIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(nid);
        } catch (error) {
          console.log("Error canceling notification:", error);
        }
      }

      // Schedule new notifications with reminderId
      const newNotificationIds = await scheduleNotifications();

      await EditCustomReminderData({
        id: reminder.id,
        title,
        notes,
        delivered,
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
        notification_id: newNotificationIds || [],
        updated_at: updated,
      });

      await onSave();
      onClose();
      Toast.show({
        type: "success",
        text1: "Reminder updated successfully",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error updating reminder, Try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  return {
    handleSave,
  };
}
