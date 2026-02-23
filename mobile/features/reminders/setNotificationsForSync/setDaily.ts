import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export default function setDailyNotification({
  notifyAt,
  title,
  notes,
  reminderId,
}: {
  notifyAt: Date;
  title: string;
  notes: string;
  reminderId: string;
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
    },
    trigger,
  });
}