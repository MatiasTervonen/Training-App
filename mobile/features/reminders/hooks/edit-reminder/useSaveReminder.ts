import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { FeedItemUI, full_reminder } from "@/types/session";
import { editLocalReminder } from "@/database/reminders/edit-local-reminder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

type ReminderInput = FeedItemUI | full_reminder;

type useSaveReminderProps = {
  title: string;
  notes: string;
  notifyAt: Date | null;
  setIsSaving: (isSaving: boolean) => void;
  reminder: ReminderInput;
  onSave: ((updateFeedItem: FeedItemUI) => void) | (() => void);
  onClose: () => void;
  scheduleNotifications: () => Promise<string | string[] | undefined>;
  weekdays: number[];
  type: "weekly" | "daily" | "one-time";
  mode?: "alarm" | "normal";
};

function getReminderId(reminder: ReminderInput): string {
  if ("source_id" in reminder && reminder.source_id) {
    return reminder.source_id;
  }
  return reminder.id;
}

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
  mode = "normal",
}: useSaveReminderProps) {
  const { t } = useTranslation("reminders");
  const queryClient = useQueryClient();
  const reminderId = getReminderId(reminder);

  const handleSave = async () => {
    if (title.trim().length === 0) {
      Toast.show({
        type: "error",
        text1: t("reminders.validation.titleRequired"),
      });
      return;
    }

    if (!notifyAt) {
      Toast.show({
        type: "error",
        text1: t("reminders.validation.notifyTimeRequired"),
      });
      return;
    }

    if (type === "one-time" && notifyAt < new Date()) {
      Toast.show({
        type: "error",
        text1: t("reminders.validation.notifyTimeFuture"),
      });
      return;
    }

    const updated = new Date().toISOString();

    setIsSaving(true);
    try {
      // Cancel old notifications
      const stored = await AsyncStorage.getItem(`notification:${reminderId}`);
      const oldIds: string[] = stored ? JSON.parse(stored) : [];

      await Promise.all(
        oldIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
      );

      const newIds = await scheduleNotifications();
      const normalizedIds = newIds
        ? Array.isArray(newIds)
          ? newIds
          : [newIds]
        : [];

      if (normalizedIds.length) {
        await AsyncStorage.setItem(
          `reminder:${reminderId}`,
          JSON.stringify(normalizedIds),
        );
      }

      const updatedFeedItem = await editLocalReminder({
        id: reminderId,
        title,
        notes,
        seen_at: undefined,
        notify_at_time:
          type === "weekly" || type === "daily"
            ? notifyAt.toTimeString().slice(0, 8)
            : undefined,
        notify_date: type === "one-time" ? notifyAt.toISOString() : undefined,
        weekdays,
        type: type as "weekly" | "daily" | "one-time",
        updated_at: updated,
        mode,
      });

      // Handle both FeedItemUI and full_reminder callbacks
      if ("feed_context" in reminder) {
        (onSave as (item: FeedItemUI) => void)({
          ...updatedFeedItem,
          feed_context: reminder.feed_context,
        });
      } else {
        (onSave as () => void)();
      }
      onClose();
      queryClient.invalidateQueries({ queryKey: ["feed"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      Toast.show({
        type: "success",
        text1: t("reminders.success.updated"),
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("reminders.errors.updateFailed"),
        text2: t("reminders.errors.tryAgainLater"),
      });
    } finally {
      setIsSaving(false);
    }
  };
  return {
    handleSave,
  };
}
