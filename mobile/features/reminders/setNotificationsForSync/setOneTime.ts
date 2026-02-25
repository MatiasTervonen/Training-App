import * as Notifications from "expo-notifications";
import { SNOOZE_CATEGORY_ID } from "@/features/push-notifications/constants";

export default function setOneTimeNotification({
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
  return Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: notes,
      sound: true,
      data: {
        reminderId: reminderId,
        type: "onetime-reminder",
      },
      ...(mode === "normal" && {
        categoryIdentifier: SNOOZE_CATEGORY_ID,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notifyAt,
    },
  });
}
