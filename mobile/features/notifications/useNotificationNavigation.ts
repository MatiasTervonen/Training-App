import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { router } from "expo-router";
import { getRouteForNotification } from "@/features/notifications/getRouteForNotification";

export default function useNotificationNavigation(sessionChecked: boolean) {
  const lastResponse = Notifications.useLastNotificationResponse();

  // Navigate after auth is done, then clear so the hook stops returning it
  useEffect(() => {
    if (!sessionChecked || !lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const { data } = lastResponse.notification.request.content;
    const route = getRouteForNotification(data);
    if (route) {
      router.push(route);
      Notifications.clearLastNotificationResponse();
    }
  }, [sessionChecked, lastResponse]);
}
