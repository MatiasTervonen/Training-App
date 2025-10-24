import Toggle from "../toggle";
import AppText from "../AppText";
import { View, Platform } from "react-native";
import {
  deleteTokenFromServer,
  registerForPushNotificationsAsync,
  SaveTokenToServer,
} from "./actions";
import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useUserStore } from "@/lib/stores/useUserStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function PushNotificationManager() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [toggleState, setToggleState] = useState(false);

  const pushEnabled = useUserStore((state) => state.preferences?.push_enabled);

  useEffect(() => {
    if (pushEnabled) {
      setToggleState(true);
    } else {
      setToggleState(false);
    }
  }, [pushEnabled]);

  const platform = Platform.OS === "ios" ? "ios" : "android";

  const subscribeToPush = async () => {
    setToggleState(true);
    try {
      const token = await registerForPushNotificationsAsync();

      if (!token) {
        throw new Error("No token received");
      }

      await SaveTokenToServer(token, platform);

      setExpoPushToken(token);
    } catch (error) {
      console.log("Error during push notification registration:", error);
      setToggleState(false);
    }
  };

  async function handleToggle() {
    if (toggleState) {
      try {
        await deleteTokenFromServer(expoPushToken, platform);
        setExpoPushToken("");
        setToggleState(false);
      } catch (error) {
        console.log("Error during push notification unregistration:", error);
      }
    } else {
      await subscribeToPush();
    }
  }

  return (
    <View className="my-5">
      <AppText className="underline text-lg">Push Notifications</AppText>
      <View className="flex-row mt-5 items-center justify-between">
        <AppText className="text-lg">
          {toggleState
            ? "Push notifications enabled"
            : "Allow push notifications"}
        </AppText>
        <View className="mr-5">
          <Toggle isOn={toggleState} onToggle={handleToggle} />
        </View>
      </View>
    </View>
  );
}
