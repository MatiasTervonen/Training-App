import { useEffect } from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import { useRouter } from "expo-router";
import { stopNativeAlarm } from "@/native/android/NativeAlarm";

type AlarmInfo = {
  reminderId: string;
  soundType: string;
  title: string;
  content: string;
};

export default function AlarmPlayingListener() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const sub = DeviceEventEmitter.addListener(
      "ALARM_PLAYING",
      (data: AlarmInfo) => {
        // Stop the alarm immediately
        stopNativeAlarm();

        // Navigate based on alarm type - this will expand the reminder
        if (data.soundType === "reminder" && data.reminderId) {
          router.push(`/dashboard?reminderId=${data.reminderId}`);
        } else if (data.soundType === "timer") {
          router.push("/timer/empty-timer");
        } else {
          router.push("/dashboard");
        }
      }
    );

    return () => sub.remove();
  }, [router]);

  return null;
}
