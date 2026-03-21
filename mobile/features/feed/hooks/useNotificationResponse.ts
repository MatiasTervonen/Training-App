import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useEffect } from "react";
import {
  SNOOZE_ACTION_ID,
  SNOOZE_CATEGORY_ID,
  SNOOZE_DELAY_MS,
  HABIT_DONE_ACTION_ID,
} from "@/features/push-notifications/constants";
import { supabase } from "@/lib/supabase";
import { markHabitDone } from "@/database/habits/mark-habit-done";
import { handleError } from "@/utils/handleError";
import { queryClient } from "@/lib/queryClient";

export default function useNotificationResponse() {

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const actionId = response.actionIdentifier;
        const { data } = response.notification.request.content;

        // Mark habit as done from notification action button
        if (actionId === HABIT_DONE_ACTION_ID && data?.habitId) {
          const today = new Date().toLocaleDateString("en-CA");
          await markHabitDone(data.habitId as string, today);
          queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
          queryClient.invalidateQueries({ queryKey: ["habit-stats"] });
          queryClient.invalidateQueries({ queryKey: ["feed"] });
          Notifications.dismissNotificationAsync(
            response.notification.request.identifier,
          ).catch(() => {});
          return;
        }

        if (actionId !== SNOOZE_ACTION_ID) return;

        const notification = response.notification;
        const { title, body } = notification.request.content;

        // Dismiss current notification first, then schedule snooze
        await Notifications.dismissNotificationAsync(
          notification.request.identifier,
        ).catch(() => {});

        await Notifications.scheduleNotificationAsync({
          content: {
            title: title ?? undefined,
            body: body ?? undefined,
            sound: true,
            data,
            ...(Platform.OS === "android" && { channelId: "reminders" }),
            categoryIdentifier: SNOOZE_CATEGORY_ID,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(Date.now() + SNOOZE_DELAY_MS),
          },
        });

        // If this is a global reminder, update the DB so cron re-delivers
        if (data?.type === "global-reminder" && data?.reminderId) {
          const { error } = await supabase
            .from("global_reminders")
            .update({
              notify_at: new Date(Date.now() + SNOOZE_DELAY_MS).toISOString(),
              delivered: false,
            })
            .eq("id", data.reminderId as string);

          if (error) {
            handleError(error, {
              message: "Error updating global reminder snooze",
              route: "features/feed/hooks/useNotificationResponse",
              method: "UPDATE",
            });
          }
        }
      },
    );

    return () => sub.remove();
  }, []);
}
