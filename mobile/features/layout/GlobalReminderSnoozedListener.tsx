import { useEffect } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type GlobalReminderSnoozedEvent = {
  reminderId: string;
  snoozeDurationMinutes: number;
};

export default function GlobalReminderSnoozedListener() {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const sub = DeviceEventEmitter.addListener(
      "GLOBAL_REMINDER_SNOOZED",
      async (data: GlobalReminderSnoozedEvent) => {
        const snoozeDurationMs = data.snoozeDurationMinutes * 60 * 1000;
        const newNotifyAt = new Date(Date.now() + snoozeDurationMs);

        const { error } = await supabase
          .from("global_reminders")
          .update({
            notify_at: newNotifyAt.toISOString(),
            delivered: false,
          })
          .eq("id", data.reminderId);

        if (error) {
          handleError(error, {
            message: "Error updating global reminder after snooze",
            route: "features/layout/GlobalReminderSnoozedListener",
            method: "UPDATE",
          });
        }
      },
    );

    return () => sub.remove();
  }, []);

  return null;
}
