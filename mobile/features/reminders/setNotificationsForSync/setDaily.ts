import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { SNOOZE_CATEGORY_ID } from "@/features/push-notifications/constants";

export default function setDailyNotification({
  notifyAt,
  title,
  notes,
  reminderId,
  mode = "normal",
}: {
  notifyAt: Date;
  title: string;
  notes: string;
  reminderId: string;
  mode?: "alarm" | "normal";
}) {
  const hour = notifyAt.getHours();
  const minute = notifyAt.getMinutes();

  const trigger: Notifications.NotificationTriggerInput =
    Platform.OS === "android"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: notes,
      sound: true,
      data: { reminderId: reminderId },
      ...(mode === "normal" && {
        categoryIdentifier: SNOOZE_CATEGORY_ID,
      }),
    },
    trigger,
  });
}
