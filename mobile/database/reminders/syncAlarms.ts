import { handleError } from "@/utils/handleError";
import { supabase } from "@/lib/supabase";
import { Platform } from "react-native";
import {
  cancelAllNativeAlarms,
  scheduleNativeAlarm,
  scheduleRepeatingNativeAlarm,
} from "@/native/android/NativeAlarm";
import { getDeviceId } from "@/utils/deviceId";
import { t } from "i18next";

export async function syncAlarms() {
  // Only sync alarms on Android
  if (Platform.OS !== "android") {
    return true;
  }

  // 1. Clear all existing alarms
  cancelAllNativeAlarms();

  // 2. Get device ID for global reminders
  const deviceId = await getDeviceId();

  // 3. Fetch all local reminders with alarm mode
  const { data: localReminders, error: localRemindersError } = await supabase
    .from("local_reminders")
    .select("*")
    .eq("mode", "alarm");

  if (localRemindersError) {
    handleError(localRemindersError, {
      message: "Error getting local reminders for alarm sync",
      route: "/database/reminders/syncAlarms",
      method: "GET",
    });
    throw new Error("Failed to sync alarms");
  }

  // 4. Fetch global reminders created from this device with alarm mode
  let globalReminders: any[] = [];
  const { data, error: globalRemindersError } = await supabase
    .from("global_reminders")
    .select("*")
    .eq("created_from_device_id", deviceId)
    .eq("mode", "alarm");

  if (globalRemindersError) {
    handleError(globalRemindersError, {
      message: "Error getting global reminders for alarm sync",
      route: "/database/reminders/syncAlarms",
      method: "GET",
    });
  } else {
    globalReminders = data || [];
  }

  // 3. Re-schedule all alarms
  await Promise.all(
    (localReminders || []).map(async (reminder) => {
      const notifyAt = new Date(reminder.notify_at_time);
      const hour = notifyAt.getHours();
      const minute = notifyAt.getMinutes();

      switch (reminder.type) {
        case "daily": {
          // Calculate first trigger time (today or tomorrow at the specified time)
          const now = new Date();
          const triggerDate = new Date();
          triggerDate.setHours(hour, minute, 0, 0);

          // If the time has already passed today, schedule for tomorrow
          if (triggerDate.getTime() <= now.getTime()) {
            triggerDate.setDate(triggerDate.getDate() + 1);
          }

          scheduleRepeatingNativeAlarm(
            triggerDate.getTime(),
            reminder.id,
            reminder.title,
            "reminder",
            reminder.notes || "",
            "daily",
            hour,
            minute
          );
          return;
        }

        case "weekly": {
          const weekdays: number[] = reminder.weekdays || [];
          if (weekdays.length === 0) return;

          // Calculate first trigger time based on next matching weekday
          const now = new Date();
          const currentDay = now.getDay() + 1; // JS: 0=Sun, convert to 1=Sun like our weekdays

          // Find the next weekday that matches
          let daysToAdd = 7;
          for (let i = 0; i <= 7; i++) {
            const checkDay = ((currentDay - 1 + i) % 7) + 1;
            if (weekdays.includes(checkDay)) {
              // If it's today, check if the time has passed
              if (i === 0) {
                const todayTrigger = new Date();
                todayTrigger.setHours(hour, minute, 0, 0);
                if (todayTrigger.getTime() > now.getTime()) {
                  daysToAdd = 0;
                  break;
                }
              } else {
                daysToAdd = i;
                break;
              }
            }
          }

          const triggerDate = new Date();
          triggerDate.setDate(triggerDate.getDate() + daysToAdd);
          triggerDate.setHours(hour, minute, 0, 0);

          scheduleRepeatingNativeAlarm(
            triggerDate.getTime(),
            reminder.id,
            reminder.title,
            "reminder",
            reminder.notes || "",
            "weekly",
            hour,
            minute,
            weekdays
          );
          return;
        }

        case "one-time": {
          // For one-time reminders, use the notify_date if available
          let triggerDate: Date;
          if (reminder.notify_date) {
            triggerDate = new Date(reminder.notify_date);
            triggerDate.setHours(hour, minute, 0, 0);
          } else {
            triggerDate = notifyAt;
          }

          // Do NOT schedule past one-time reminders
          if (triggerDate <= new Date()) {
            return;
          }

          scheduleNativeAlarm(
            triggerDate.getTime(),
            reminder.id,
            reminder.title,
            "reminder",
            reminder.notes || "",
            t("reminders:reminders.notification.tapToOpen"),
            t("reminders:reminders.notification.reminder"),
            t("reminders:reminders.notification.stopAlarm")
          );
          return;
        }
      }
    })
  );

  // 6. Schedule global reminders (one-time alarms)
  await Promise.all(
    globalReminders.map(async (reminder) => {
      const notifyAt = new Date(reminder.notify_at);

      // Do NOT schedule past reminders
      if (notifyAt <= new Date()) {
        return;
      }

      scheduleNativeAlarm(
        notifyAt.getTime(),
        reminder.id,
        reminder.title,
        "reminder",
        reminder.notes || "",
        t("reminders:reminders.notification.tapToOpen"),
        t("reminders:reminders.notification.reminder"),
        t("reminders:reminders.notification.stopAlarm")
      );
    })
  );

  return true;
}
