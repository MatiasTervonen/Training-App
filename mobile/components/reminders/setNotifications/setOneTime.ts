import * as Notifications from "expo-notifications";

export default function setOneTimeNotification({
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
  return Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: notes,
      sound: true,
      data: {
        reminderId: reminderId,
        type: "onetime-reminder",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notifyAt,
    },
  });
}
