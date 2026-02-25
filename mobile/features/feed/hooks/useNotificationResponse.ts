import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import {
  SNOOZE_ACTION_ID,
  SNOOZE_CATEGORY_ID,
  SNOOZE_DELAY_MS,
} from "@/features/push-notifications/constants";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export default function useNotificationResponse() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const actionId = response.actionIdentifier;
        if (actionId !== SNOOZE_ACTION_ID) return;

        const notification = response.notification;
        const { title, body, data } = notification.request.content;

        // Dismiss current notification and schedule snooze in parallel
        await Promise.all([
          Notifications.dismissNotificationAsync(
            notification.request.identifier,
          ),
          Notifications.scheduleNotificationAsync({
            content: {
              title: title ?? undefined,
              body: body ?? undefined,
              sound: true,
              data,
              categoryIdentifier: SNOOZE_CATEGORY_ID,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(Date.now() + SNOOZE_DELAY_MS),
            },
          }),
        ]);

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
