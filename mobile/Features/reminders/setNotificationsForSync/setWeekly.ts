import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export default async function setWeeklyNotification({
  notifyAt,
  title,
  notes,
  weekdays,
  reminderId,
}: {
  notifyAt: Date;
  title: string;
  notes: string;
  weekdays: number[];
  reminderId: string;
}) {
  const hour = notifyAt.getHours();
  const minute = notifyAt.getMinutes();

  await Promise.all(
    weekdays.map((day) => {
      const trigger: any =
        Platform.OS === "android"
          ? {
              type: "weekly",
              weekday: day,
              hour,
              minute,
              repeat: true,
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              weekday: day,
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
    })
  );
}