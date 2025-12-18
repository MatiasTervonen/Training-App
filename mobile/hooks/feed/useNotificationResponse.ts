import * as Notifications from "expo-notifications";
import { useEffect } from "react";

export default function useNotificationResponse() {
  useEffect(() => {
    //  Handle case: app already open or in background
    const sub = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => sub.remove();
  }, []);
}
