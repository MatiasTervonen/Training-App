import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function useNotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { data } = response.notification.request.content;
        const actionId = response.actionIdentifier;

        // Only handle default tap (not custom actions like snooze)
        if (actionId !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

        if (data?.type === "friend_request" || data?.type === "friend_accepted") {
          router.push("/menu/friends");
        }
      },
    );

    return () => sub.remove();
  }, [router]);
}
