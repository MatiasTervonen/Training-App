import { supabase } from "@/lib/supabase";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import { FeedItem } from "@/types/models";
import { handleError } from "@/utils/handleError";
import MarkOccurrenceCompleted from "@/database/reminders/mark-occurrence-completed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function useNotificationResponse(
  setExpandedItem: (item: FeedItem) => void
) {
  const queryClient = useQueryClient();

  const handleNotificationResponse = async (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;

    if (data?.reminderId) {
      try {
        console.log("Fetching reminder for ID:", data.reminderId);
        const { data: feedItem, error } = await supabase
          .from("feed_with_pins")
          .select("*")
          .eq("id", data.reminderId)
          .single();

        if (error) {
          throw error;
        }

        if (!feedItem) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Reminder not found.",
          });
          return;
        }

        console.log("Data:", data);
        console.log("Feed item:", feedItem);

        if (feedItem) {
          setExpandedItem({
            table: feedItem.type,
            item: { ...feedItem, id: feedItem.id },
            pinned: feedItem.pinned,
          } as FeedItem);

          if (data.type === "onetime-reminder") {
            await MarkOccurrenceCompleted(data.occurrenceId as string);
          }

          queryClient.invalidateQueries({
            queryKey: ["feed"],
          });
        }
      } catch (error) {
        console.error("Error fetching reminder from notification:", error);
        handleError(error, {
          message: "Error fetching reminder from notification",
          route: "/notifications/response",
          method: "GET",
        });
      }
    }
  };

  useEffect(() => {
    const handleResponse = async (
      response: Notifications.NotificationResponse
    ) => {
      const notifId = response.notification.request.identifier;
      console.log("Notification response received with ID:", notifId);

      const lastHandled = await AsyncStorage.getItem("lastHandledNotification");

      if (lastHandled === notifId) {
        console.log("Notification already handled, skipping.");
        return;
      }

      await AsyncStorage.setItem("lastHandledNotification", notifId);
      await handleNotificationResponse(response);
    };

    //  Handle case: app already open or in background
    const sub =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    // Handle case: app launched from killed state
    (async () => {
      const lastResponse = await Notifications.getLastNotificationResponse();

      if (lastResponse) {
        await handleResponse(lastResponse);
      }
    })();

    return () => sub.remove();
  }, []);
}
