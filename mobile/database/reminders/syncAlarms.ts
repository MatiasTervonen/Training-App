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

  // 1. Fetch all data BEFORE canceling alarms — if fetching fails, keep existing alarms
  const [{ data: localReminders, error: localRemindersError }, deviceId] =
    await Promise.all([
      supabase.from("local_reminders").select("*"),
      getDeviceId(),
    ]);

  if (localRemindersError) {
    handleError(localRemindersError, {
      message: "Error getting local reminders for alarm sync",
      route: "/database/reminders/syncAlarms",
      method: "GET",
    });
    throw new Error("Failed to sync alarms");
  }

  const { data: globalRemindersData, error: globalRemindersError } =
    await supabase
      .from("global_reminders")
      .select("*")
      .eq("created_from_device_id", deviceId);

  if (globalRemindersError) {
    handleError(globalRemindersError, {
      message: "Error getting global reminders for alarm sync",
      route: "/database/reminders/syncAlarms",
      method: "GET",
    });
  }

  const globalReminders = globalRemindersData || [];

  // 2. Only cancel alarms AFTER we have the data to reschedule
  cancelAllNativeAlarms();

  // 3. Re-schedule all alarms (allSettled so one failure doesn't skip the rest)
  await Promise.allSettled(
    (localReminders || []).map(async (reminder) => {
      const soundType = reminder.mode === "alarm" ? "reminder" : "reminder-normal";

      switch (reminder.type) {
        case "daily": {
          if (!reminder.notify_at_time) return;
          const [hour, minute] = reminder.notify_at_time.split(":").map(Number);

          const now = new Date();
          const triggerDate = new Date();
          triggerDate.setHours(hour, minute, 0, 0);

          if (triggerDate.getTime() <= now.getTime()) {
            triggerDate.setDate(triggerDate.getDate() + 1);
          }

          scheduleRepeatingNativeAlarm(
            triggerDate.getTime(),
            reminder.id,
            reminder.title,
            soundType,
            reminder.notes || "",
            "daily",
            hour,
            minute,
          );
          return;
        }

        case "weekly": {
          if (!reminder.notify_at_time) return;
          const [hour, minute] = reminder.notify_at_time.split(":").map(Number);

          const weekdays: number[] = (reminder.weekdays as number[]) || [];
          if (weekdays.length === 0) return;

          const now = new Date();
          const currentDay = now.getDay() + 1;

          let daysToAdd = 7;
          for (let i = 0; i <= 7; i++) {
            const checkDay = ((currentDay - 1 + i) % 7) + 1;
            if (weekdays.includes(checkDay)) {
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
            soundType,
            reminder.notes || "",
            "weekly",
            hour,
            minute,
            weekdays,
          );
          return;
        }

        case "one-time": {
          if (!reminder.notify_date) return;
          const triggerDate = new Date(reminder.notify_date);

          if (triggerDate <= new Date()) {
            return;
          }

          scheduleNativeAlarm(
            triggerDate.getTime(),
            reminder.id,
            reminder.title,
            soundType,
            reminder.notes || "",
            t("reminders:reminders.notification.tapToOpen"),
            t("reminders:reminders.notification.reminder"),
            t("reminders:reminders.notification.stopAlarm"),
            t("reminders:reminders.notification.snooze"),
          );
          return;
        }
      }
    }),
  );

  // 4. Schedule global reminders
  await Promise.allSettled(
    globalReminders.map(async (reminder) => {
      if (!reminder.notify_at) return;
      const notifyAt = new Date(reminder.notify_at);

      if (notifyAt <= new Date()) {
        return;
      }

      const soundType = reminder.mode === "alarm" ? "global-reminder" : "global-reminder-normal";

      scheduleNativeAlarm(
        notifyAt.getTime(),
        reminder.id,
        reminder.title,
        soundType,
        reminder.notes || "",
        t("reminders:reminders.notification.tapToOpen"),
        t("reminders:reminders.notification.reminder"),
        t("reminders:reminders.notification.stopAlarm"),
        t("reminders:reminders.notification.snooze"),
      );
    }),
  );

  return true;
}
